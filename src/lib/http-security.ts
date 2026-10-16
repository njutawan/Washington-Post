import { NextResponse } from 'next/server';
import type { z } from 'zod';
import { csrfBlock } from './csrf';
import { consumeLimit, clientKey } from './rate-limit';
import { securityLog } from './security-log';
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function readJson<T>(
  req: Request,
  schema: z.ZodType<T>,
  limit = 16 * 1024,
): Promise<T> {
  if (
    !/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type') || '')
  )
    throw new HttpError(415, 'JSON content type required');
  const bytes = await readBody(req, limit);
  let raw: unknown;
  try {
    raw = JSON.parse(bytes.toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new HttpError(400, 'Invalid request');
  return result.data;
}
export async function readBody(req: Request, limit: number): Promise<Buffer> {
  const size = req.headers.get('content-length');
  if (size && (!/^\d+$/.test(size) || Number(size) > limit))
    throw new HttpError(413, 'Request too large');
  if (!req.body) throw new HttpError(400, 'JSON object required');
  const reader = req.body.getReader();
  let length = 0;
  const chunks: Uint8Array[] = [];
  let expired = false;
  const timeout = setTimeout(() => {
    expired = true;
    void reader.cancel().catch(() => undefined);
  }, 10000);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > limit) {
        await reader.cancel();
        throw new HttpError(413, 'Request too large');
      }
      chunks.push(value);
    }
    if (expired) throw new HttpError(408, 'Request timed out');
    return Buffer.concat(chunks);
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
}
export type ApiPolicy = {
  name: string;
  max?: number;
  windowMs?: number;
  csrf?: boolean;
  private?: boolean;
};
export function withApi<R extends Request, C>(
  policy: ApiPolicy,
  handler: (req: R, context: C) => Promise<Response> | Response,
) {
  return async (req: R, context: C): Promise<Response> => {
    try {
      if (
        policy.csrf !== false &&
        !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
      ) {
        const blocked = csrfBlock(req);
        if (blocked) return blocked;
      }
      const limit = await consumeLimit(
        policy.name + ':' + clientKey(req),
        policy.max ?? 60,
        policy.windowMs ?? 60000,
      );
      if (!limit.allowed)
        return NextResponse.json(
          { error: 'Too many requests' },
          {
            status: 429,
            headers: {
              'Retry-After': String(limit.retryAfter),
              'Cache-Control': 'no-store',
            },
          },
        );
      const res = await handler(req, context);
      if (policy.private !== false)
        res.headers.set('Cache-Control', 'private, no-store');
      return res;
    } catch (e) {
      const invalid =
        !!e && typeof e === 'object' && 'name' in e && e.name === 'ZodError';
      const known = e instanceof HttpError;
      if (invalid)
        return NextResponse.json(
          { error: 'Invalid request' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } },
        );
      if (!known) securityLog('request_failed');
      return NextResponse.json(
        { error: known ? e.message : 'Service temporarily unavailable' },
        {
          status: known ? e.status : 503,
          headers: {
            'Cache-Control': 'no-store',
            ...(known && e.status === 429 ? { 'Retry-After': '60' } : {}),
          },
        },
      );
    }
  };
}
