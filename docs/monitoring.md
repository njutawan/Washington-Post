# Monitoring: Analytics & Error Reporting

## Privacy-friendly analytics (Task 14)

WaPo-clone ships with a Plausible-compatible, cookieless, DNT-respecting
analytics pipeline out of the box. **No third-party services are required.**

### How it works
- **Client** (`src/lib/track.ts`, mounted via `<Analytics />` in `layout.tsx`):
  - Fires a `pageview` event on every App Router route transition
  - Tracks **time-on-page** and **max scroll depth** via a rAF-throttled passive
    listener; sends a `pageview_end` beacon on `visibilitychange`/`pagehide`
  - Uses `navigator.sendBeacon` with a `fetch(..., keepalive: true)` fallback so
    events reliably flush when the user navigates away
  - Honors `navigator.doNotTrack === '1'`
  - Generates a 24-hour rotating random session id stored in `sessionStorage` /
    `localStorage` for "unique visitor" counting. It is never joined with PII.
  - Auto-forwards events to Plausible if `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set
- **Server collector** (`src/app/api/analytics/collect/route.ts`):
  - Accepts a Plausible-compatible payload:
    `{ n, u, r, w, d, sd, props, sid }`
  - Respects the `DNT: 1` request header (returns 204 without recording)
  - Validates URLs to block SSRF / cross-origin pollution
- **Aggregator** (`src/lib/analytics.ts`):
  - Keeps at most 10,000 events in memory, probabilistically trimming on insert
  - Exposes `getStats(sinceMinutes)` with totals, top pages, top referrers,
    paywall funnel, hour-bucket histogram, and share/bookmark/comment/newsletter/
    push counts
- **Editorial dashboard**: `/analytics` (client page at `src/app/analytics/page.tsx`)
  shows KPIs, traffic-by-hour bar chart, most-read table with avg duration/scroll,
  referrers, and the paywall conversion funnel. Time window toggle: 1h / 6h / 24h / 7d.
- **JSON API**: `GET /api/analytics/stats?since=1440` returns the same payload.

### Tracked events
| Name                  | Where fired                                  |
|-----------------------|----------------------------------------------|
| `pageview`            | `<Analytics />` on every navigation          |
| `pageview_end`        | `visibilitychange` / `pagehide`              |
| `paywall_seen`        | `PaywallGate` when blocked                   |
| `paywall_convert`     | `PaywallGate` subscribe CTA click            |
| `bookmark_toggle`     | `BookmarkButton`                             |
| `share`               | `ShareSheet` (method: native/copy/twitter/facebook/email) |
| `comment_post`        | `Comments` submit                            |
| `newsletter_subscribe`| `NewsletterSignup` submit                    |
| `push_subscribe`      | `usePushNotifications` (pwa.ts)              |

### Going to production
1. **Self-hosted / in-memory is fine** for low traffic and a single server
   instance. Restarts reset data (acceptable for editorial monitoring).
2. For persistent/serious analytics, set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com`
   and load Plausible/Umami — the client tracker forwards to their global queue
   automatically; the in-memory collector keeps running as a backup.
3. Lock down `/api/analytics/stats` and `/analytics` behind an admin role.

### Tests
`tests/unit/analytics.test.ts` covers pageview/unique counting, funnel math,
engagement buckets, and duration/scroll averages.

---

## Error monitoring (Task 15) — Sentry

Sentry is wired up per
[the Next.js guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/):

| File                                | Purpose                                           |
|-------------------------------------|---------------------------------------------------|
| `src/instrumentation-client.ts`     | Browser SDK: Replay + BrowserTracing              |
| `sentry.server.config.ts`           | Node/SSR SDK                                      |
| `sentry.edge.config.ts`             | Edge runtime (middleware, edge routes)            |
| `src/instrumentation.ts`            | Registers server/edge configs; `onRequestError`   |
| `src/instrumentation-client.ts`     | Turbopack-friendly client init; `onRouterTransitionStart` |
| `src/app/global-error.tsx`          | App Router global error boundary → `Sentry.captureException` + fallback UI |
| `next.config.js`                    | Wrapped with `withSentryConfig`                   |

### Env vars (see `.env.example`)
```
NEXT_PUBLIC_SENTRY_DSN=    # client + edge
SENTRY_DSN=                # server-side (optional, defaults to public)
SENTRY_ORG=
SENTRY_PROJECT=washington-post-clone
SENTRY_AUTH_TOKEN=         # CI-only, used for source-map upload
```

When `NEXT_PUBLIC_SENTRY_DSN` is unset (default for local dev), Sentry is
**disabled** (`enabled: false`) so no traffic leaves your machine.

### Recommended alerting
In Sentry → Alerts create two rules:
1. **Error rate**: notify #engineering when `event.type:error` exceeds ~50/hour
   (or >0 for brand-new projects).
2. **New issue**: notify on every *new* issue in production (deploys surface
   previously-unseen errors fast).

### Source maps in CI
`withSentryConfig` already sets `hideSourceMaps: true` and
`widenClientFileUpload: true`. In CI (Vercel/GitHub Actions) add:
```
SENTRY_AUTH_TOKEN=xxxx
SENTRY_ORG=your-org
SENTRY_PROJECT=washington-post-clone
```
and run `npm run build` — Sentry's webpack plugin uploads source maps
automatically. Symbols are hidden from clients (only stack-trace names are
sent to browsers), but Sentry uses them to de-minify errors.
