# Dependency Security Audit

**Date:** 2026-09-10
**Tooling:** `npm audit` (npm 10.9.8, Node 22.22.3) against the committed `package-lock.json`

## Findings (before remediation)

`npm audit` reported **11 vulnerabilities (3 high, 3 moderate, 5 low)**. All of them
lived in the **dev-only Storybook toolchain** — none were part of the production
dependency tree or the built Next.js application.

| # | Package | Version | Severity | Advisory | How it was pulled in |
|---|---------|---------|----------|----------|----------------------|
| 1 | `image-size` | 1.2.1 | **HIGH** (CVSS 7.5) | [GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) — ICNS parser DoS via infinite loop (CWE-835) | `@storybook/nextjs@8.6.18` |
| 2 | `image-size` | 1.2.1 | **HIGH** (CVSS 7.5) | [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq) — JXL/HEIF parser DoS via infinite loops (CWE-835) | `@storybook/nextjs@8.6.18` |
| 3 | `sharp` | 0.33.5 | **HIGH** | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) — inherited libvips CVEs: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591 | `@storybook/nextjs@8.6.18` |
| 4 | `sharp` | 0.33.5 | **HIGH** | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) — libheif vulnerabilities (GHSA-g89c-p67h-r497, GHSA-2jg2-4ch7-h545) | `@storybook/nextjs@8.6.18` |
| 5 | `uuid` | 9.0.1 | **MODERATE** (CVSS 7.5) | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) — missing buffer bounds check in v3/v5/v6 when `buf` is provided (CWE-787/CWE-1285); fixed in 11.1.1 | `@storybook/addon-essentials → @storybook/addon-actions` |
| 6 | `elliptic` | 6.6.1 | **LOW** (CVSS 2.9) | [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84) / CVE-2025-14505 — ECDSA generates incorrect signatures when an intermediate `k` has leading zeros; under specific conditions could expose the secret key | `@storybook/nextjs → node-polyfill-webpack-plugin → crypto-browserify → browserify-sign / create-ecdh` |

Items 3–11 of the npm count are the intermediate packages (`browserify-sign`,
`create-ecdh`, `crypto-browserify`, `node-polyfill-webpack-plugin`,
`@storybook/addon-actions`, `@storybook/addon-essentials`, `@storybook/nextjs`)
that inherit these severities through their `via` chains.

### Exposure assessment

- **Production build: zero exposure.** `npm audit --omit=dev` reports **0
  vulnerabilities**. None of the affected packages appear in `next build` output
  or the server bundle.
- **Storybook dev/build pipeline: limited exposure.** The affected code paths run
  only in the local Storybook/Chromatic toolchain:
  - `sharp`/`image-size` process component assets loaded by Storybook — DoS is
    possible only if a developer points Storybook at untrusted image files.
  - `uuid`'s missing bounds check is reachable only via the `buf` option of
    `v3/v5/v6`, which Storybook never uses (it calls `v4()`).
  - `elliptic` exists only inside webpack *polyfill* definitions that are emitted
    to the browser bundle only if a module requests Node's `crypto` — our
    stories do not.

## Remediation

**Upgraded Storybook 8.6.x → 10.6.0** (`npm audit`'s recommended fix installs
`@storybook/nextjs@10.6.0`). In Storybook 9/10, `sharp`, `image-size`,
`node-polyfill-webpack-plugin` (and therefore the entire `elliptic` chain except
its last hop — see below) were removed from `@storybook/nextjs`, and the
`uuid`-dependent `@storybook/addon-actions`/`@storybook/addon-essentials`
standalone packages were folded into core.

Changes:

1. `package.json` — devDependencies:
   - `@storybook/nextjs`, `@storybook/addon-a11y`, `@storybook/addon-links`,
     `storybook` → `^10.6.0`
   - removed `@storybook/addon-essentials`, `@storybook/addon-interactions`,
     `@storybook/test` (merged into Storybook core in v9+)
   - `@chromatic-com/storybook` stays at `^5.3.1` (peer-compatible with SB 10)
2. `.storybook/main.ts` — dropped the merged addons from the `addons` array and
   the obsolete `typescript.reactDocgen` key.
3. `.storybook/preview.ts` → `.storybook/preview.tsx` — Storybook 10's
   `@storybook/nextjs` SWC loader delegates to Next's `getLoaderSWCOptions`,
   which disables the TSX parser for plain `.ts` files; the file contains JSX,
   so it must carry the `.tsx` extension.
4. `package-lock.json` — regenerated via `npm install --legacy-peer-deps`
   (same flag CI uses).
5. `.github/workflows/ci.yml` — new CI step `npm audit --audit-level=moderate`
   so any future moderate/high/critical dependency vulnerability fails the build.

Verification after the change:

- `npm audit --omit=dev` → **0 vulnerabilities** (unchanged, still clean)
- `npm audit` → **6 low** (was 11: 3 high / 3 moderate / 5 low)
- `npx tsc --noEmit` → clean
- `npm test` (vitest) → 29/29 passed
- `npm run lint` → pre-existing warnings only, no errors
- `npm run build` (Next.js production) → succeeds
- `npm run build-storybook` → succeeds

## Accepted risk: `elliptic` (6 remaining low-severity entries)

`elliptic@6.6.1` (CVE-2025-14505, CVSS 2.9 low) is still present in the dev
tree because **no patched release exists** — the advisory lists "Patched
versions: None", 6.6.1 is the latest publish, and every current
`@storybook/nextjs` (including 11 alpha) still pulls it in via
`node-polyfill-webpack-plugin`. It cannot be fixed with an `overrides` pin.

Why it is accepted:

- **Dev-only**: never shipped to users; not in the Next.js production build.
- **Not executed in our pipeline**: it exists solely as a webpack polyfill
  definition for Node's `crypto`; no story or plugin requests it, so the code is
  not bundled or run.
- **Exploit preconditions are unrealistic here**: the bug requires an attacker
  to obtain both a faulty and a correct ECDSA signature from the same key/inputs.

Mitigations in place: the CI gate at `--audit-level=moderate` fails the build if
the elliptic chain is ever re-scored higher, and the audit output is re-checked
each run. **Action:** when a patched `elliptic` release (or a
`node-polyfill-webpack-plugin` that drops it) is published, re-run
`npm install` and confirm `npm audit` is fully clean.

## Ongoing hygiene

- CI runs `npm audit --audit-level=moderate` on every push/PR.
- Keep `package-lock.json` committed; never install with `--no-save`.
- Re-run `npm audit` after any dependency bump; treat new moderate+ findings as
  blocking.
- Secrets: `.env` is gitignored (only `.env.example` is committed) — keep it that
  way.

---

# Code review & engineering hardening (2026-09-10)

A manual review of the source found several real defects beyond the
dependency audit. All are fixed; the full gate (tsc, lint, unit tests,
production build) is green and the hardened endpoints were exercised against a
running `next start` instance.

## Security

| Area | Problem | Fix |
|------|---------|-----|
| `next.config.js` | No security headers at all — no CSP, no `X-Content-Type-Options`, no clickjacking protection, no referrer policy | Added `headers()`: `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'`, `Permissions-Policy`, and a **production Content-Security-Policy** (self-only by default; img/media/connect restricted to the exact hosts the site uses — Unsplash/Picsum/LoremFlickr/Twitter/YouTube images, SoundHelix podcast audio, Sentry ingest, Clerk, optional Plausible). CSP is applied in production only so `next dev` HMR is unaffected. `script-src` keeps `'unsafe-inline'` because Next's App Router inlines its RSC flight scripts and Next 15 cannot nonce framework-injected scripts; everything else is strict. |
| `src/auth.ts` | Hard-coded public fallback JWT secret (`wapo-demo-secret-change-me-in-production`) — anyone knowing the source could forge session tokens | No public constant in production: if `NEXTAUTH_SECRET` is unset at production runtime a **random per-process** secret is generated with a loud warning (sessions won't survive restarts — set the env var for real deploys). Dev keeps a fixed secret for zero-config convenience. |
| `src/auth.ts` | 1-click "demo" credentials provider signs a fixed account in **without any check** — enabled in production by default whenever Google isn't configured | Disabled in production unless `NEXT_PUBLIC_ENABLE_DEMO=1`. The `/signin` demo button mirrors the exact same condition, so button and provider can't disagree. |
| `src/middleware.ts` | The Clerk "protected API" check was **inverted and inoperative**: the handler treated `auth` (an async function in this Clerk version) as an object, and returned `next()` in the not-signed-in branch — i.e. it never blocked anything | Rewritten: `await auth()`; anonymous callers on protected API routes get a **401 JSON** response (defense in depth on top of the per-route `auth()` checks). Load-failure is now properly memoized. |
| `src/app/api/live/publish` | Public, unauthenticated, **no input limits, no slug validation** — writes into the in-memory live store; in production anyone could spam/pollute live blogs or spawn unbounded state | `devOnlyGuard`: 501 in production unless `LIVE_PUBLISH_TOKEN` is set and presented (constant-time compare). Slug must be a known live blog; title ≤200 / body ≤2000 / byline ≤100. |
| `src/app/api/push/send` | Public, unauthenticated broadcast of push notifications, no input validation (arbitrary title/body/url/image/topic) | Same `devOnlyGuard` pattern (`PUSH_SEND_TOKEN` + `x-push-send-token`). title ≤150 / body ≤400; `url`/`image` must be same-origin relative paths (no open redirects); `topic` restricted to the known set. |
| `src/app/api/push/subscribe` | Public endpoint stored **uncapped** endpoint/keys strings into an in-memory `Map` — unbounded memory growth | Field length caps (endpoint ≤2048, keys ≤256, topics ≤10×50, UA ≤256) and a **10k subscription cap with oldest-eviction** in `src/lib/push.ts`. |
| `src/app/api/analytics/collect` | Public endpoint accepted unbounded `sid`/`name`/`referrer` and arbitrary `props` objects — memory pressure + garbage in stats | Every field length-capped and type-checked; `props` sanitized to ≤12 scalar keys with bounded string values. |
| `src/lib/db.ts` | Single-shot SHA-256 password hashing + non-constant-time comparison | New passwords use **scrypt** (N=16384, r=8, p=1, 64-byte key, per-user salt, self-contained `scrypt$N$r$p$salt$hash` format); comparison via `timingSafeEqual`. Legacy SHA-256 records still verify and are **transparently upgraded** to scrypt on next sign-in. |
| `src/lib/liveData.ts` | `ensureBlog()`/`startSimulation()` accepted **any slug from HTTP input**: each unique slug created permanent store entries, and each subscriber connection leaked a self-rescheduling timer that never stopped — a slow memory/CPU DoS | `isValidLiveSlug()` allowlist (canonical + legacy aliases); per-blog store capped at 200 updates; simulation timer now starts on first subscriber and **stops when the last one disconnects**. |

## Correctness / engineering

| Area | Problem | Fix |
|------|---------|-----|
| `src/app/api/feed/route.ts` | RSS `<description>` escaped the **entire** string, so the intentionally injected `<img>` tag was emitted as literal `&lt;img …&gt;` text in every RSS reader | Escape the dek first, then append the (trusted, in-repo) `<img>` markup. Verified: feed now contains real `<img>` tags, zero escaped ones. |
| `src/app/signin/page.tsx` | `router.replace()` called **during render** (React anti-pattern / render-phase update) when already authenticated | Moved into `useEffect`. Also removed the dead `condition \|\| true` around the demo button (see security table). |
| `src/lib/useLiveUpdates.ts` | `reconnectTimer` ref was declared and read in cleanup but **never assigned** — dead code, and the source of the `react-hooks/exhaustive-deps` lint warning | Removed. |
| `src/app/author/[slug]/page.tsx` | Raw `<img>` for above-the-fold avatars (LCP) | `next/image` with `fill`/`priority`/`sizes` (host already in `remotePatterns`). ESLint is now **warning-free**. |
| `public/sw.js` | Page cache (`wapo-pages-*`) grew **unbounded** — every visited article cached forever | Bounded to 60 pages (oldest-first eviction, `/offline` always kept); cache version bumped to v3 so stale v2 caches are purged on activate. |
| `src/app/layout.tsx` | Inline theme script triggered `no-sync-scripts` when moved to a file; keeping it inline with a documented `eslint-disable` is the standard Next.js pattern for anti-FOUC head scripts | Restored inline script with an explicit, justified disable comment. |

## Verification performed

- `npx tsc --noEmit` — clean
- `npm run lint` — **no warnings or errors** (was 2 warnings)
- `npm test` — 31/31 passing (incl. new `tests/unit/db.test.ts` for scrypt +
  legacy upgrade, and rewritten `tests/unit/live.test.ts` covering the slug
  allowlist / DoS guard)
- `npm run build` (production) — succeeds
- Running `next start` (production):
  - response headers include the full CSP + hardening headers
  - `GET /api/live/updates?slug=evil` → **404**; `?slug=shutdown-deal` → SSE sync OK
  - `POST /api/live/publish` without token → **501**; with `LIVE_PUBLISH_TOKEN`
    match → **200** and update published; wrong token → 501
  - `/api/feed` → valid XML with real `<img>` tags
  - all external hosts referenced by served HTML are inside the CSP allowlist
- Playwright e2e: browser binaries are not installable in this sandbox
  (CDN blocked), so the suite runs in GitHub CI as before; it targets the dev
  server where the dev-only endpoints remain open by design.

## New environment variables (see `.env.example`)

| Var | Purpose |
|-----|---------|
| `NEXTAUTH_SECRET` | **Required for real production deploys.** Missing at prod runtime → random per-process secret + loud warning (never a public constant). |
| `NEXT_PUBLIC_ENABLE_DEMO` | `1` = keep the no-credential demo sign-in in production (default: off there, on in dev). |
| `LIVE_PUBLISH_TOKEN` | Unlocks `POST /api/live/publish` in production (header `x-live-publish-token`). Unset = endpoint disabled (501). |
| `PUSH_SEND_TOKEN` | Unlocks `POST /api/push/send` in production (header `x-push-send-token`). Unset = endpoint disabled (501). |
