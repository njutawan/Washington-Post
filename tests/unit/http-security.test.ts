// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { readJson, withApi } from '@/lib/http-security';
import { redactTelemetry } from '@/lib/security-log';
import { newsletterSchema } from '@/lib/security-input';
import { validateRuntimeConfig } from '@/lib/security-config';
const req = (body: string, headers: Record<string, string> = {}) =>
  new Request('http://localhost:3000/api/test', {
    method: 'POST',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      ...headers,
    },
    body,
  });
describe('bounded schema parsing', () => {
  const handler = withApi(
    { name: 'parse-test', max: 100 },
    async (r: Request) =>
      Response.json(
        await readJson(r, z.object({ body: z.string().max(40) }).strict(), 64),
      ),
  );
  it.each([
    'null',
    '[]',
    '1',
    '"text"',
    '{',
    '{"body":null}',
    '{"body":"ok","extra":true}',
  ])('bad shape %s returns 400 not 500', async (raw) =>
    expect((await handler(req(raw), undefined)).status).toBe(400),
  );
  it('returns valid output and no-store', async () => {
    const res = await handler(req('{"body":"ok"}'), undefined);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toContain('no-store');
  });
  it('caps actual streamed bytes, not just Content-Length', async () =>
    expect(
      (await handler(req(JSON.stringify({ body: 'x'.repeat(100) })), undefined))
        .status,
    ).toBe(413));
  it('rejects oversized declared length and wrong content type', async () => {
    expect(
      (await handler(req('{}', { 'content-length': '1000' }), undefined))
        .status,
    ).toBe(413);
    expect(
      (await handler(req('{}', { 'content-type': 'text/plain' }), undefined))
        .status,
    ).toBe(415);
  });
  it('rejects unsolicited email and unknown preference keys', () => {
    expect(
      newsletterSchema.safeParse({ preferences: { '<b>bad</b>': true } })
        .success,
    ).toBe(false);
    expect(
      newsletterSchema.safeParse({
        preferences: { tech: true },
        email: 'victim@example.invalid',
      }).success,
    ).toBe(false);
    expect(
      newsletterSchema.safeParse({ preferences: { tech: true } }).success,
    ).toBe(true);
  });
  it('returns 429 with Retry-After', async () => {
    const limited = withApi({ name: 'one-test', max: 1 }, async () =>
      Response.json({ ok: true }),
    );
    expect((await limited(req('{}'), undefined)).status).toBe(200);
    const res = await limited(req('{}'), undefined);
    expect(res.status).toBe(429);
    expect(Number(res.headers.get('retry-after'))).toBeGreaterThan(0);
  });
  it('fails closed with sanitized 503 when dependency fails', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fail = withApi({ name: 'failure-test' }, async () => {
      throw Error('token=VERYSECRET');
    });
    const res = await fail(req('{}'), undefined);
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain('VERYSECRET');
    expect(JSON.stringify(spy.mock.calls)).not.toContain('VERYSECRET');
    spy.mockRestore();
  });
});
describe('telemetry redaction and runtime config', () => {
  it('scrubs credentials, addresses and query strings', () => {
    const value = redactTelemetry({
      request: {
        headers: { authorization: 'Bearer token', cookie: 'session=secret' },
        data: 'password=abc',
        url: 'https://site.test/x?token=secret',
      },
      message: 'person@example.test Bearer abcdef',
    });
    expect(JSON.stringify(value)).not.toMatch(
      /person@example|session=secret|password=abc|token=secret|abcdef/,
    );
  });
  it.each([
    ['NEXTAUTH_SECRET', 'short'],
    ['NEXTAUTH_SECRET', 'a'.repeat(64)],
    ['NEXTAUTH_SECRET', 'demo-demo-demo-demo-demo-demo-demo-demo'],
    ['NEXTAUTH_URL', 'http://production.invalid'],
    ['NEXTAUTH_URL', 'https://production.invalid/path'],
    ['NEXTAUTH_URL', 'https://user:password@production.invalid'],
    ['APP_TENANT_ID', ''],
    ['DATABASE_URL', ''],
    ['AUTH_URL', 'https://other.invalid'],
    ['CLERK_SECRET_KEY', 'legacy-provider'],
  ])('rejects invalid production %s', (field, value) => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', 'https://production.invalid');
    vi.stubEnv('APP_TENANT_ID', 'local');
    vi.stubEnv(
      'NEXTAUTH_SECRET',
      'fixture-only-strong-configuration-value-123456789',
    );
    vi.stubEnv('DATABASE_URL', 'postgresql://fixture-only');
    vi.stubEnv('AUTH_URL', '');
    vi.stubEnv('CLERK_SECRET_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', '');
    vi.stubEnv(field, value);
    try {
      expect(validateRuntimeConfig).toThrow();
    } finally {
      vi.stubEnv('NODE_ENV', 'test');
      vi.stubEnv('NEXTAUTH_URL', 'http://localhost:3000');
      vi.stubEnv('DATABASE_URL', '');
      vi.stubEnv('APP_TENANT_ID', 'local');
    }
  });
});
