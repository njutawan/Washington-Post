import { describe, expect, it } from 'vitest';
import { csrfBlock, isCrossOriginMutation } from '@/lib/csrf';

// NOTE: `new Request(url, { headers })` silently drops forbidden headers
// (Origin, Sec-*, Host), so tests use a minimal { headers } stub instead —
// the guard only reads req.headers.
function post(headers: Record<string, string> = {}) {
  return { headers: new Headers({ host: 'localhost:3000', ...headers }) } as unknown as Request;
}

describe('CSRF origin guard', () => {
  it('allows requests without Origin (curl, native apps, navigations)', () => {
    expect(isCrossOriginMutation(post())).toBe(false);
    expect(csrfBlock(post())).toBeNull();
  });

  it('allows same-origin browser requests', () => {
    const req = post({ origin: 'http://localhost:3000', 'sec-fetch-site': 'same-origin' });
    expect(isCrossOriginMutation(req)).toBe(false);
  });

  it('blocks cross-origin Origin header', () => {
    const req = post({ origin: 'https://evil.example' });
    expect(isCrossOriginMutation(req)).toBe(true);
    const res = csrfBlock(req)!;
    expect(res.status).toBe(403);
  });

  it('blocks subdomain spoofing (exact host match required)', () => {
    expect(isCrossOriginMutation(post({ origin: 'http://evil.localhost:3000' }))).toBe(true);
    expect(isCrossOriginMutation(post({ origin: 'http://localhost:3000.evil.example' }))).toBe(true);
  });

  it('blocks Sec-Fetch-Site: cross-site even without Origin', () => {
    expect(isCrossOriginMutation(post({ 'sec-fetch-site': 'cross-site' }))).toBe(true);
  });

  it('blocks malformed Origin', () => {
    expect(isCrossOriginMutation(post({ origin: 'not-a-url' }))).toBe(true);
  });

  it('is case-insensitive on host comparison', () => {
    expect(isCrossOriginMutation(post({ origin: 'HTTP://LOCALHOST:3000' }))).toBe(false);
  });
});
