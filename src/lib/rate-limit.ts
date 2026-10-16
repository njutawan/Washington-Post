import { createHash, randomUUID } from 'crypto';
import { database, transaction } from './storage';
import { tenantId } from './security-config';
export class LimitUnavailable extends Error {}
const buckets = new Map<string, { count: number; until: number }>();
export function clientKey(req: Request): string {
  // Only configure this if ingress OVERWRITES this header. Otherwise use one
  // conservative shared anonymous bucket; never trust arbitrary X-Forwarded-For.
  const header = process.env.TRUSTED_CLIENT_IP_HEADER;
  const ip = header
    ? req.headers.get(header)?.trim().slice(0, 128) || 'unknown'
    : 'unknown';
  return createHash('sha256')
    .update(tenantId() + ':' + ip)
    .digest('hex');
}
export function privateKey(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
export async function consumeLimit(key: string, max: number, windowMs: number) {
  const scoped = tenantId() + ':' + key;
  if (process.env.DATABASE_URL) {
    const r = await database().query(
      `INSERT INTO security_limits(key,count,expires_at)
      VALUES($1,1,clock_timestamp()+$2*interval '1 millisecond') ON CONFLICT(key) DO UPDATE SET
      count=CASE WHEN security_limits.expires_at<=clock_timestamp() THEN 1 ELSE security_limits.count+1 END,
      expires_at=CASE WHEN security_limits.expires_at<=clock_timestamp() THEN clock_timestamp()+$2*interval '1 millisecond' ELSE security_limits.expires_at END
      RETURNING count, greatest(1,ceil(extract(epoch FROM (expires_at-clock_timestamp())))) AS retry`,
      [scoped, windowMs],
    );
    return {
      allowed: r.rows[0].count <= max,
      retryAfter: Number(r.rows[0].retry),
    };
  }
  if (process.env.NODE_ENV === 'production') throw new LimitUnavailable();
  const now = Date.now();
  for (const [k, b] of buckets) if (b.until <= now) buckets.delete(k);
  let b = buckets.get(scoped);
  if (!b) {
    if (buckets.size >= 10000) return { allowed: false, retryAfter: 60 };
    b = { count: 0, until: now + windowMs };
    buckets.set(scoped, b);
  }
  b.count++;
  return {
    allowed: b.count <= max,
    retryAfter: Math.max(1, Math.ceil((b.until - now) / 1000)),
  };
}
const leases = new Map<string, { key: string; until: number }>();
export async function acquireConnection(
  key: string,
): Promise<null | (() => Promise<void>)> {
  const scoped = tenantId() + ':sse:' + key;
  const prefix = tenantId() + ':sse:';
  const id = randomUUID();
  if (process.env.DATABASE_URL) {
    const ok = await transaction(async (c) => {
      await c.query('SELECT pg_advisory_xact_lock(hashtext($1))', [prefix]);
      await c.query('DELETE FROM security_leases WHERE expires_at<=now()');
      const r = await c.query(
        `SELECT count(*) FILTER(WHERE key=$1)::int AS own, count(*)::int AS total
        FROM security_leases WHERE key LIKE $2`,
        [scoped, prefix + '%'],
      );
      if (r.rows[0].own >= 3 || r.rows[0].total >= 100) return false;
      await c.query(
        "INSERT INTO security_leases(id,key,expires_at) VALUES($1,$2,now()+interval '120 seconds')",
        [id, scoped],
      );
      return true;
    });
    return ok
      ? async () => {
          await database().query('DELETE FROM security_leases WHERE id=$1', [
            id,
          ]);
        }
      : null;
  }
  if (process.env.NODE_ENV === 'production') throw new LimitUnavailable();
  for (const [k, v] of leases) if (v.until <= Date.now()) leases.delete(k);
  if (
    [...leases.values()].filter((x) => x.key === scoped).length >= 3 ||
    leases.size >= 100
  )
    return null;
  leases.set(id, { key: scoped, until: Date.now() + 120000 });
  return async () => {
    leases.delete(id);
  };
}
