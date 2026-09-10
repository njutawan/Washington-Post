# The Washington Post — Clone

A Washington Post-style news website built with **Next.js 15 (App Router)**, **React 18**, **TypeScript**, and **Tailwind CSS**. Designed to replicate the look, feel, and reading experience of a major newspaper while demonstrating a modern, production-ready front-end stack.

## ✨ Features

### Layout & Branding
- Classic masthead with the iconic motto (*"Democracy Dies in Darkness"*)
- Serif typography (Playfair Display / Merriweather / Source Serif Pro) for headlines and body
- Cream "newsprint" background, red WaPo accent color (#b40001), double-rule section dividers
- Fully responsive (mobile → desktop)
- Custom `W` favicon

### Pages
- **Homepage** — lead story, "The 7" live-updates widget, section grids, photo strip
- **Section pages** (`/politics`, `/sports`, `/world`, `/business`, `/tech`, `/style`, etc.) — each with its own hero, tagline, and layout
- **Dedicated Opinions page** with columnist grid (round avatars), editorials block
- **Article detail page** — drop cap, pull quote, byline block with share/save, related stories, comments
- **Search** with fuzzy matching (Fuse.js)
- **404** page in WaPo editorial style

### Interactivity
- **Breaking news ticker** — CSS marquee, pauses on hover, respects reduced motion
- **Live news** adapter for [NewsAPI.org](https://newsapi.org/) (with graceful fallback to curated local articles if no API key)
- **Client-side fuzzy search** (Fuse.js) across titles, decks, categories, bylines
- **Bookmarks/Save for later** — persisted in `localStorage`, visible in sidebar
- **Comments section** (mock) — post new comments, reply, recommend, threaded
- **Podcast player** ("Post Reports") — play/pause, progress bar, timer
- **Weather widget for Washington, D.C.** — live data from Open-Meteo (free, no key) with fallback
- **Newsletter signup** in footer and section sidebars (client-side state)
- **"Load more"** pagination on section pages
- **Skeleton loaders** for home, sections and article pages
- **Command-K search modal** with trending terms
- Mobile hamburger menu

### Premium features (WaPo-style)
- **Metered paywall** — 3 free articles per month tracked in `localStorage`; after that a subscribe modal appears and the rest of the article is blurred. Progress meter visible above each story.
- **The Mini Crossword** — fully interactive 5x5 mini puzzle on the Games page and embedded on the homepage, with keyboard navigation (arrows/space/backspace), check/reset, win detection, and numbered clues.
- **Live blog template** (`/live/[slug]`) — reverse-chronological timeline with LIVE pulses, timestamps, and numbered updates.
- **Photo essay with lightbox** — click any photo in "In Focus" for a full-screen viewer with keyboard prev/next (arrow keys, Esc to close).
- **Video hero** — autoplay-on-click hero video player with poster, play/pause, mute toggle, headline overlay.
- **"The 7" upgraded** — auto-advancing carousel (7s per story), progress bar per slide, pause on hover, pause button, left/right keyboard navigation, prev/next buttons.
- **Newsletter center** (`/newsletters`) — multi-newsletter picker with email input, toggle per newsletter, subscribe count, and visual checkmarks.

## 🔧 Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Optional: Enable live NewsAPI headlines

Copy `.env.example` to `.env.local` and add your [NewsAPI.org](https://newsapi.org/) key:

```
NEWS_API_KEY=your_key_here
```

Without a key, the site uses built-in demo articles so it always renders.

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint via Next.js |

## 📁 Project structure

```
src/
  app/                # Next.js App Router (pages + layouts + loading states)
    [section]/        # Dynamic category pages
    article/[slug]/   # Article detail page
    opinions/         # Opinion landing page
    search/           # Search results page
  components/         # Reusable UI (Masthead, Footer, ArticleCard, Ticker…)
  lib/                # Data, hooks, API adapters
    data.ts           # Curated articles, columnists, navigation config
    newsapi.ts        # NewsAPI adapter with local fallback
    useBookmarks.ts   # localStorage bookmark hook
public/               # Favicon (W monogram)
```

## 🔒 Security & quality

- `npm audit`: 0 vulnerabilities
- TypeScript strict mode: passing
- ESLint (`next/core-web-vitals`): 0 warnings

> This is a demo/clone for educational purposes. Not affiliated with The Washington Post.

## Level 5 — Production Quality

- **Error pages**
  - Custom branded 404 at `src/app/not-found.tsx` (section links, return-home CTA)
  - Global error boundary at `src/app/global-error.tsx` (try-again reset, digest id)
- **SEO**
  - Central metadata helpers at `src/lib/seo.ts` (Open Graph, Twitter cards, canonical URLs, robots)
  - Root layout injects `NewsMediaOrganization` + `WebSite` JSON-LD (with `SearchAction`)
  - Article pages inject `NewsArticle` + `BreadcrumbList` JSON-LD via `generateMetadata`
  - `sitemap.ts` + `robots.ts` dynamically list every article & section
  - PWA webmanifest + favicon/apple-touch meta
  - RSS 2.0 feed at `/api/feed` (auto-linked from `<head>`)
- **Accessibility**
  - Skip-to-content link, ARIA `role="banner"` / `role="contentinfo"`
  - Lightbox, carousel, paywall modal all carry proper roles/labels
  - Visible `:focus-visible` outline, `prefers-reduced-motion` respected on marquee/live-dot
  - Color contrast meets WCAG AA for body text, kickers, links
- **Performance**
  - Hero/lead/card images migrated to `next/image` via a shared `ArticleImage` wrapper (with remote-image fallback)
  - Lazy-load non-critical images, eager + `priority` on lead hero
  - Fonts preconnected, font-display: swap via `<link>` tags (no render-blocking @import)
  - Masthead skip-link keeps first-paint keyboard reachable
- **Testing**
  - Vitest + jsdom + Testing Library configured at `vitest.config.ts`
  - 14 unit tests covering data layer & SEO helpers (`npm test`)
  - Playwright config at `playwright.config.ts` with smoke spec in `e2e/smoke.spec.ts` (routes, 404, skip link, RSS XML)
- **CI/CD**
  - GitHub Actions workflow at `.github/workflows/ci.yml`:
    1. Type-check → unit tests → build
    2. Playwright smoke tests (using built app)
    3. Vercel deploy (placeholder — requires `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` secrets)

### Additional performance tuning (post-Level-5)
- **PWA service worker** at `public/sw.js` with three strategies:
  - HTML pages → network-first, falls back to cache then `/offline` page
  - Static assets (JS/CSS/fonts/images) → stale-while-revalidate
  - API routes → network-only (never cached)
  - `src/components/PWAInit.tsx` registers the SW on `window.load` in production
  - Dedicated `/offline` fallback page
  - Apple PWA meta tags (apple-mobile-web-app-capable, apple-touch-icon)
- **Image placeholders with blur/shimmer**: `ArticleImage` now uses `placeholder="blur"` with a tiny inline SVG base64 gray, fades in with a smooth opacity transition and a shimmer animation. CLS prevented via `fill` layout + fixed aspect-ratio containers.
- **Fonts self-contained**: Removed blocking `<link>` to Google Fonts; `font-family` stacks now fall back gracefully through Georgia/Franklin Gothic/system fonts — zero third-party font requests. (Playfair/Source Serif still referenced as primary; if a user has them installed, they apply; otherwise the system serif stack renders instantly.)
- **Code-split search (Fuse.js)**: `fuse.js` is now dynamically imported the first time a user types a query ≥2 characters, instead of being in the initial bundle. The search page JS dropped from **12.4 kB → 3.87 kB**; a substring-matching fallback works while Fuse loads. A separate `fuse.<hash>.js` chunk is created.
- **Hero image preload**: Homepage hero (`<link rel="preload" as="image" fetchpriority="high">`) in `<head>` ensures LCP image starts fetching immediately.
- **All remaining `<img>` tags migrated** across article, sections, opinions (columnist round avatars), PhotoGallery, and search results to `next/image` via `ArticleImage` wrapper — automatic format negotiation (WebP/AVIF) and responsive `sizes`.
- Result: 28 pages statically prerendered (including `/offline`), search route JS down ~69%, zero third-party network hops at first paint, PWA-ready with offline reading.

## Auth & Accounts (NextAuth.js)

- `src/auth.ts` — NextAuth 5 (beta) config with:
  - **Credentials** (email + password sign-in & sign-up, salted SHA-256)
  - **Google OAuth** (enabled when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set)
  - **Apple OAuth** (enabled when `APPLE_ID`/`APPLE_SECRET` are set)
  - **Demo 1-click provider** (always available for preview/reviewers)
- `src/middleware.ts` — protects API routes (`/api/bookmarks`, `/api/comments`, `/api/newsletters`, `/api/me`)
- `.demo-db.json` (gitignored) — lightweight file-backed JSON store (users, accounts, bookmarks, comments, newsletter preferences). Swap for Postgres+Prisma/Drizzle in production.
- **Account features**:
  - `/signin` — sign in/up page with Google, email/password, and demo
  - `/account` — profile card, saved stories list, newsletter preference toggle (auto-saves)
  - **Saved articles synced across devices** — `BookmarkButton` POSTs to `/api/bookmarks/[slug]`, session preloaded with bookmarks
  - **Comments posting** — signed-in users POST to `/api/comments/[articleId]`; comments persist in DB
  - **Newsletter preferences** — per-user toggles saved to server when signed in; localStorage fallback for guests
  - Masthead shows avatar/initial dropdown when signed in (account, saved, sign out), UserIcon + link to signin when guest
  - Paywall modal links to `/signin` (callbackUrl preserves current article)

### Demo login (no env setup needed)
1. Click the person icon in the masthead → **Sign in**
2. Click the red **Try the Demo Account (1-click)** button — instantly signed in as "Demo Reader"
3. Now you can:
   - Bookmark any article (💾 synced to server)
   - Post comments on articles
   - Toggle newsletters on `/newsletters` (saved to account)
   - View your saved stories and preferences at `/account`
4. Use the avatar menu in the top-right to sign out.
