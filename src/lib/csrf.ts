import { NextResponse } from 'next/server';
import { canonicalOrigin } from './security-config';
/** CWE-352: exact canonical origin, not attacker-controlled Host/forwarding headers. */
export function isCrossOriginMutation(req: Request): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return true;
  const origin = req.headers.get('origin');
  // Cookie-authenticated mutations require a browser Origin. Non-browser helpers
  // must send the canonical Origin too (plus their shared token).
  if (!origin) return true;
  try { return new URL(origin).origin !== origin || origin !== canonicalOrigin(); }
  catch { return true; }
}
export function csrfBlock(req: Request): NextResponse | null {
  return isCrossOriginMutation(req) ? NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 }) : null;
}
