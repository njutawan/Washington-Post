<div align="center">

# 📰 The Washington Post — Clone

### *“Democracy Dies in Darkness”*

**Clone pengalaman membaca koran digital kelas dunia — dibangun dengan stack modern yang production-ready.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![CI](https://github.com/njutawan/Washington-Post/actions/workflows/ci.yml/badge.svg)](https://github.com/njutawan/Washington-Post/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/njutawan/Washington-Post?color=b40001)](https://github.com/njutawan/Washington-Post/releases)
[![License: Demo](https://img.shields.io/badge/license-demo%20%2F%20educational-lightgrey)](#-disclaimer)

[🚀 Mulai Cepat](#-mulai-cepat) •
[✨ Fitur Unggulan](#-fitur-unggulan) •
[🖥️ Jelajahi Halaman](#️-jelajahi-halaman) •
[📦 Rilis](https://github.com/njutawan/Washington-Post/releases) •
[🗺️ Roadmap](#️-roadmap)

</div>

---

## 📖 Tentang

Replika tampilan, nuansa, dan pengalaman membaca **The Washington Post** — dari masthead klasik berkhas serif, ticker berita breaking, sampai paywall berlangganan — namun dengan **fitur setara produk berita modern**: CMS redaksi, akun pembaca, mode offline (PWA), notifikasi push, live blog, pencarian secepat kilat, hingga mini-games.

> 🇬🇧 *A Washington Post-style digital newspaper experience — classic newsprint look on the outside, modern production-grade stack on the inside: editorial CMS, reader accounts, PWA offline mode, push notifications, live blogs, instant search, and games.*

---

## ✨ Fitur Unggulan

| ⭐ Highlight | Deskripsi |
|---|---|
| 📰 **Pengalaman Koran Otentik** | Masthead klasik + motto, tipografi serif (Playfair Display / Source Serif), aksen merah WaPo `#b40001`, divider double-rule khas koran |
| ✍️ **CMS Redaksi (`/editorial`)** | Dashboard Kanban 10 halaman: kelola stories (idea → published), assignments, moderasi komentar, liveblog, media, staff, analytics, alerts & settings + role-based access |
| 🔐 **Auth Ganda + Akun Pembaca** | NextAuth (email/password, Google, Apple) + Clerk — bookmark tersinkron, komentar persist, preferensi newsletter per-akun |
| 💳 **Metered Paywall** | 3 artikel gratis/bulan (terlacak), blur artikel + modal subscribe, progress meter di tiap cerita |
| 🔴 **Live Blog Real-Time** | Timeline reverse-chronological dengan pulse LIVE, timestamp, SSE live-updates + endpoint publish untuk redaksi |
| 📱 **PWA + Mode Offline** | Service worker (3 strategi cache), halaman `/offline`, prompt install, bottom-nav ala aplikasi berita |
| 🔔 **Push Notification** | Web Push API (subscribe/send/key) untuk breaking news |
| 🎮 **Games Corner** | Mini Crossword 5×5 interaktif (keyboard nav, check/reset, win detection), Sudoku & Tiles |
| 🎙️ **Podcast & Video** | Halaman podcast + RSS feed + mini-player persisten, video hero sinematik & halaman video |
| 🔍 **Pencarian Instan** | Fuzzy search (Fuse.js, code-split −69% bundle) + modal Command-K dengan trending terms |
| 🌓 **Dark Mode** | Tema gelap penuh yang lolos kontras WCAG AA, terverifikasi axe-core di kedua tema |
| 🔊 **Read Aloud (TTS)** | Dengarkan artikel dibacakan via SpeechSynthesis API |
| 📊 **Analytics Privat** | Kolektor lokal + dasbor `/analytics`, kompatibel Plausible — tanpa tracker invasif |

---

## 🧩 Fitur Lengkap

<details>
<summary><b>📰 Pembaca & Artikel</b></summary>

- Homepage: lead story split, rail Top Stories, “The 7” carousel auto-advance (progress bar, pause, keyboard nav), opini, photo strip, clips video
- Halaman section (`/politics`, `/sports`, `/world`, `/business`, `/tech`, `/style`, …) — hero, tagline & layout per kanal
- Halaman artikel: drop cap, pull quote, byline + share/save, related stories, komentar threaded (post, balas, recommend)
- Reading progress bar, daftar isi (TOC) dengan scroll-spy, scrollytelling, Recently Read rail, riwayat baca di akun
- Halaman author, arsip bookmarks, Most Read, Election widget, Editorial cartoon, Breaking banner, Live ticker (marquee, pause on hover, hormat `prefers-reduced-motion`)
- Photo essay + lightbox fullscreen (keyboard ←/→/Esc), “Load more” pagination, skeleton loader, 404 & error boundary bergaya editorial
</details>

<details>
<summary><b>✍️ Redaksi / Editorial CMS</b> — <code>/editorial</code></summary>

- 📊 Dashboard Kanban: pitched → assigned → drafting → in-edit → ready → published (+ spiked)
- 📝 Stories: buat/edit (server actions), status & prioritas (breaking/urgent/routine)
- 🗂️ Assignments, 💬 moderasi komentar (pending/flagged), 📡 liveblog publisher, 🖼️ media library
- 👥 staff & roles, 🔔 alerts, 📈 analytics redaksi, ⚙️ settings — dengan proteksi role (`no-access` guard)
</details>

<details>
<summary><b>🔐 Auth, Akun & Personalisasi</b></summary>

- NextAuth 5: Credentials (salted SHA-256), Google & Apple OAuth
- Clerk (sign-in/sign-up catch-all routes) sebagai penyedia auth modern
- `/account`: profil, saved stories tersinkron lintas-device, toggle newsletter auto-save, riwayat baca
- API terproteksi via middleware: `/api/bookmarks`, `/api/comments`, `/api/newsletters`, `/api/me`
- Newsletter center multi-pilihan + signup inline/footer, Edition switcher, widget cuaca D.C. (Open-Meteo, gratis tanpa key)
</details>

<details>
<summary><b>🎙️ Multimedia: Video, Podcast, Live</b></summary>

- Video: halaman indeks + detail, hero autoplay-on-click (play/pause/mute + headline overlay), clips grid dengan durasi
- Podcast “Post Reports”: player (play/pause, progress, timer), provider + mini-player persisten, RSS feed di `/api/podcasts/rss`
- Live blog template `/live/[slug]` + SSE `/api/live/updates` & publish endpoint bertoken
- Breaking news ticker + banner, “New updates” badge
</details>

<details>
<summary><b>🎮 Games</b> — <code>/games</code></summary>

- Mini Crossword 5×5: navigasi keyboard penuh (panah/spasi/backspace), check/reset, deteksi menang, clue bernomor — juga tertanam di homepage
- Sudoku & Tiles — promo bar Games + Newsletters di homepage
</details>

<details>
<summary><b>📱 Mobile, PWA & Offline</b></summary>

- Service worker: HTML → network-first (fallback cache → `/offline`), aset → stale-while-revalidate, API → network-only
- Install prompt, Apple PWA meta, webmanifest + ikon adaptif, bottom navigation mobile (Home/Sections/Search/Saved/Subscribe)
- Container responsif `.wp-container` (mobile → 2xl), sidebar muncul sejak tablet, touch target ≥44px, safe-area notch iPhone
</details>

<details>
<summary><b>🔍 Search, SEO & Distribusi</b></summary>

- Fuse.js fuzzy search (judul/dek/kategori/byline) + fallback substring saat chunk dimuat, halaman `/search`, Command-K modal
- Metadata terpusat (`src/lib/seo.ts`): Open Graph, Twitter cards, canonical, robots
- JSON-LD: `NewsMediaOrganization` + `WebSite` (+`SearchAction`), `NewsArticle` + `BreadcrumbList` per artikel
- `sitemap.ts`, `robots.ts` dinamis (semua artikel & section), RSS 2.0 di `/api/feed` (+ feed per author), hero image preload untuk LCP
</details>

<details>
<summary><b>⚡ Performa</b></summary>

- `next/image` di semua gambar via wrapper `ArticleImage` (blur placeholder + shimmer, anti-CLS, format AVIF/WebP adaptif)
- Font self-contained (tanpa request pihak ketiga), top-loader + view-transitions 280ms, code-split Fuse.js (search −69% JS)
- 28+ halaman ter-prerender statis, zero third-party request saat first paint
</details>

<details>
<summary><b>🧪 Testing & Kualitas</b></summary>

- Vitest + jsdom + Testing Library (7 suite unit: data, SEO, analytics, db, live, push, reading)
- Playwright: smoke, paywall, visual regression, aksesibilitas (axe-core)
- Storybook + Chromatic visual review, TypeScript strict, ESLint `next/core-web-vitals`, `npm audit` gate di CI
</details>

<details>
<summary><b>🔒 Keamanan & ♿ Aksesibilitas</b></summary>

- Security headers + CSP produksi ketat (lihat `next.config.js`), token untuk endpoint dev-only, audit di `SECURITY_AUDIT.md` & `SECURITY_PENTEST_REPORT.md`, monitoring Sentry (client/edge/server)
- Skip-to-content link, landmark ARIA, role/label di lightbox/carousel/paywall, `:focus-visible` ring, live regions, kontras AA — checklist di `docs/a11y-checklist.md`
</details>

---

## 🖥️ Jelajahi Halaman

Jalankan dev server, lalu buka:

| Halaman | URL | Halaman | URL |
|---|---|---|---|
| 🏠 Homepage | `/` | ✍️ Editorial CMS | `/editorial` |
| 📄 Artikel | `/article/<slug>` | 🔴 Live blog | `/live/shutdown-countdown` |
| 🗂️ Section | `/politics` `/sports` … | 🎙️ Podcasts | `/podcasts` |
| 💬 Opinions | `/opinions` | 🎬 Video | `/video` |
| 🔍 Search (⌘K) | `/search` | 🎮 Games | `/games` |
| 📬 Newsletters | `/newsletters` | 👤 Akun | `/account` |
| 🔖 Tersimpan | `/bookmarks` | 💳 Subscribe | `/subscribe` |
| 📊 Analytics | `/analytics` | ✈️ Mode offline | `/offline` |

> 💡 **Tanpa API key pun situs tetap hidup** — otomatis fallback ke 45+ artikel MDX kurasi lokal (`content/articles/`) + adapter NewsAPI & Sanity yang opsional.

---

## 🚀 Mulai Cepat

```bash
# 1. Clone & masuk ke repo
git clone https://github.com/njutawan/Washington-Post.git
cd Washington-Post

# 2. Install & jalankan
npm install
npm run dev
```

Buka **http://localhost:3000** 🎉

### 🔐 Akun

1. Klik ikon 👤 di masthead → **Sign in**
2. Buat akun baru dengan email/password, atau login via Google/Apple jika sudah dikonfigurasi
3. Bookmark artikel 💾, posting komentar 💬, atur newsletter 📬, lalu lihat semuanya di `/account`

---

## ⚙️ Konfigurasi

Salin `.env.example` → `.env.local`. Semua opsional — situs tetap jalan tanpa satupun key:

| Variabel | Fungsi | Wajib? |
|---|---|---|
| `NEWS_API_KEY` | Live headline dari [NewsAPI.org](https://newsapi.org/) | ❌ Opsional |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` | CMS Sanity (fallback ke konten lokal) | ❌ Opsional |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Auth modern via Clerk | ❌ Opsional |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login Google (NextAuth) | ❌ Opsional |
| `APPLE_ID` / `APPLE_SECRET` | Login Apple (NextAuth) | ❌ Opsional |
| `NEXTAUTH_SECRET` + `NEXTAUTH_URL` | Session production yang stabil | ✅ Produksi |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | Monitoring error Sentry | ❌ Opsional |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Forward analytics ke Plausible | ❌ Opsional |
| `LIVE_PUBLISH_TOKEN` / `PUSH_SEND_TOKEN` | Kunci endpoint live/push di produksi | ✅ Produksi |
| `NEXT_PUBLIC_SITE_URL` | Canonical URL situs | ✅ Produksi |

---

## 📁 Struktur Proyek

```
src/
├── app/                    # Next.js App Router
│   ├── [section]/          # Halaman kanal dinamis
│   ├── article/[slug]/     # Detail artikel
│   ├── editorial/          # CMS redaksi (10 halaman + actions)
│   ├── live/[slug]/        # Live blog real-time
│   ├── api/                # REST: bookmarks, comments, newsletters,
│   │                       # live, push, podcasts/rss, analytics, feed
│   ├── games/ podcasts/ video/ newsletters/ search/
│   ├── account/ bookmarks/ author/ subscribe/ analytics/
│   ├── sitemap.ts robots.ts  # SEO dinamis
│   └── layout.tsx          # JSON-LD, provider, PWA, analytics
├── components/             # 70+ komponen (Masthead, Footer, Paywall,
│                           # MiniCrossword, VideoHero, PodcastPlayer, …)
├── lib/                    # Data, CMS, SEO, store editorial,
│                           # hooks (paywall, bookmarks, live, reading…)
├── auth.ts middleware.ts   # NextAuth config + proteksi API
content/articles/           # 45+ artikel MDX kurasi lokal
e2e/ tests/unit/            # Playwright + Vitest
.storybook/                 # Design system (lihat DESIGN_SYSTEM.md)
public/sw.js                # Service worker PWA
```

---

## 🧪 Scripts

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Build & serve produksi |
| `npm run lint` | ESLint (Next.js) |
| `npm test` | Unit test (Vitest) |
| `npm run e2e` | Playwright E2E |
| `npm run test:visual` / `test:a11y` | Visual regression / aksesibilitas |
| `npm run storybook` | Design system di `:6006` |
| `npm run chromatic` | Publish Storybook ke Chromatic |

CI (`.github/workflows/ci.yml`) mengotomatiskan: **audit keamanan → type-check → lint → unit test → build → Playwright → deploy Vercel.**

---

## 🚢 Deploy

**Vercel (disarankan)** — workflow CI sudah menyiapkan deploy otomatis dari `main`. Siapkan secrets:

```
VERCEL_TOKEN · VERCEL_ORG_ID · VERCEL_PROJECT_ID
```

Lalu setiap push ke `main` → build → tes → deploy produksi. ✨

Alternatif: deploy manual ke platform Node.js mana pun:

```bash
npm run build && npm start
```

---

## 📦 Rilis

Proyek ini memakai **GitHub Releases** dengan versioning `vMAJOR.MINOR.PATCH`:

- 📥 Lihat semua rilis & changelog: **[Releases](../../releases)**
- 🆕 Rilis terbaru: **[v1.0.0](../../releases/latest)** — CMS redaksi, PWA offline, push notification, games, podcast RSS & lainnya
- 🤖 Membuat rilis baru semudah push tag — workflow [release.yml](.github/workflows/release.yml) otomatis me-build, mengetes, lalu mempublish release + catatan rilis:

```bash
git tag v1.1.0 && git push origin v1.1.0
```

Lihat [CHANGELOG.md](CHANGELOG.md) untuk riwayat perubahan lengkap.

---

## 🗺️ Roadmap

- [ ] Migrasi database file-JSON → Postgres + Prisma/Drizzle
- [ ] Komentar real-time (WebSocket) + moderasi AI-assisted
- [ ] Mode “e-paper” / edisi cetak harian (PDF)
- [ ] Rekomendasi artikel berbasis riwayat baca
- [ ] Internasionalisasi (ID/EN) penuh
- [ ] Visual regression baselines ter-commit + E2E blocking gate di CI

Punya ide? Buka **[Issues](../../issues)** atau kirim PR! 💡

---

## 🤖 AI-Assisted Development (Context7)

Repo ini sudah terintegrasi dengan **[Context7](https://github.com/upstash/context7)** —
server MCP dari Upstash yang menyuntikkan dokumentasi library terkini (Next.js 15,
React, Tailwind, Sentry, dst.) langsung ke prompt AI coding assistant Anda.

- Konfigurasi siap pakai: `.mcp.json` (Claude Code), `.cursor/mcp.json` (Cursor),
  `.vscode/mcp.json` (VS Code Copilot) — tanpa API key pun langsung berfungsi.
- Aturan agen ada di `AGENTS.md` / `CLAUDE.md` / `.cursor/rules/`.
- Cukup tulis `use context7` di prompt, atau `use library /vercel/next.js` untuk
  dokumentasi Next.js yang presisi versi.

Panduan lengkap: [docs/context7.md](docs/context7.md).

---

## 🤝 Kontribusi

1. Fork repo & buat branch (`git checkout -b fitur/keren`)
2. Pastikan `npx tsc --noEmit`, `npm test`, dan `npm run build` hijau ✅
3. Commit dengan pesan jelas → push → buka Pull Request

---

## 🛠️ Dibangun Dengan

`Next.js 15` · `React 18` · `TypeScript 5` · `Tailwind CSS` · `MDX` · `NextAuth` · `Clerk` · `Sanity` · `Fuse.js` · `Web Push` · `Sentry` · `Vitest` · `Playwright` · `Storybook` · `Vercel`

---

## 📄 Disclaimer

> Proyek demo/klon untuk **tujuan edukasi**. Tidak berafiliasi dengan The Washington Post.

<div align="center">

**⭐ Kalau proyek ini bermanfaat, beri Star ya! ⭐**

*“Democracy Dies in Darkness”* 🕯️

</div>
