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
