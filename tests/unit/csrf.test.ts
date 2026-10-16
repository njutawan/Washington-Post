// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isCrossOriginMutation, csrfBlock } from '@/lib/csrf';
const request = (headers: Record<string, string | undefined>) =>
  new Request('http://localhost:3000/api/demo', {
    method: 'POST',
    headers: Object.fromEntries(
      Object.entries(headers).filter(
        (e): e is [string, string] => typeof e[1] === 'string',
      ),
    ),
  });
describe('canonical origin CSRF', () => {
  it.each([
    {},
    { origin: 'https://evil.example' },
    { origin: 'null' },
    { origin: 'not-url' },
    { origin: 'https://localhost:3000' },
    { origin: 'http://localhost:3000/' },
    { origin: 'http://localhost:3000', 'sec-fetch-site': 'cross-site' },
  ])('rejects missing/invalid/cross origin %j', (headers) => {
    expect(isCrossOriginMutation(request(headers))).toBe(true);
    expect(csrfBlock(request(headers))?.status).toBe(403);
  });
  it('allows exact canonical origin only', () =>
    expect(csrfBlock(request({ origin: 'http://localhost:3000' }))).toBeNull());
  it('does not trust manipulated Host or Forwarded-Host', () =>
    expect(
      isCrossOriginMutation(
        request({
          host: 'evil.example',
          'x-forwarded-host': 'evil.example',
          origin: 'http://evil.example',
        }),
      ),
    ).toBe(true));
});
