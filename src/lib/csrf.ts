import { NextResponse } from 'next/server';

/**
 * Defense-in-depth CSRF guard for mutating API routes (pentest follow-up).
 *
 * Primary CSRF protection is the session cookie's `SameSite=Lax` (browsers
 * don't attach it to cross-site POSTs). This adds a server-side check so the
 * routes stay safe even if cookie policy ever changes:
 *
 *  1. `Sec-Fetch-Site: cross-site` → reject. Only browsers send this header;
 *     same-origin/none navigation and non-browser clients omit it.
 *  2. `Origin` header present → its host must equal the request `Host`
 *     (covers fetch/XHR/form POSTs from browsers). Absent Origin (curl,
 *     native apps, same-origin GET-turned-POST navigations) is allowed.
 *
 * NOTE: only the `Host` header is trusted — `X-Forwarded-Host` is
 * client-spoofable and would let an attacker allowlist themselves.
 */
export function isCrossOriginMutation(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site === 'cross-site') return true;

  const origin = req.headers.get('origin');
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return true; // Malformed Origin — browsers never send one.
  }
  const host = (req.headers.get('host') || '').split(',')[0].trim().toLowerCase();
  if (!host) return false; // No Host to compare against (shouldn't happen via Next).
  return originHost !== host;
}

/** Returns a 403 JSON response when `req` is a cross-origin mutation, else null. */
export function csrfBlock(req: Request): NextResponse | null {
  if (!isCrossOriginMutation(req)) return null;
  return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
}
