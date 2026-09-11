# Changelog

Semua perubahan penting proyek ini dicatat di file ini.
Format mengikuti [Keep a Changelog](https://keepachangelog.com/id/1.0.0/),
dengan versioning [Semantic Versioning](https://semver.org/lang/id/).

## [1.0.0] - 2026-09-11

Rilis perdana 🎉 — pengalaman koran digital lengkap yang production-ready.

### ✨ Ditambahkan
- **CMS Redaksi** (`/editorial`): dashboard Kanban + 10 halaman (stories, assignments,
  moderasi komentar, liveblog, media, staff, analytics, alerts, settings) dengan role-based access.
- **Auth & Akun**: NextAuth (credentials, Google, Apple, Demo 1-klik) + Clerk;
  bookmark tersinkron, komentar persist, preferensi newsletter per-akun, halaman `/account`.
- **Metered Paywall**: 3 artikel gratis/bulan, blur + modal subscribe, progress meter.
- **Live Blog real-time** (`/live/[slug]`): timeline LIVE + SSE updates & endpoint publish bertoken.
- **PWA + Offline**: service worker 3 strategi, halaman `/offline`, install prompt, bottom-nav mobile.
- **Push Notification**: Web Push API (`subscribe`/`send`/`key`) untuk breaking news.
- **Games** (`/games`): Mini Crossword 5×5 interaktif, Sudoku & Tiles.
- **Podcast & Video**: halaman podcast + RSS feed + mini-player persisten; video hero & halaman video.
- **Pencarian instan**: Fuse.js code-split + modal Command-K dengan trending terms.
- **Personalisasi**: dark mode (AA di kedua tema), Read Aloud TTS, reading progress, TOC scroll-spy,
  Recently Read, riwayat baca, Most Read, Edition switcher, widget cuaca D.C.
- **SEO & distribusi**: metadata terpusat, JSON-LD (Organization/WebSite/NewsArticle/Breadcrumb),
  sitemap + robots dinamis, RSS 2.0 (+ feed per author), hero preload LCP.
- **Konten**: 45+ artikel MDX kurasi lokal + adapter opsional NewsAPI & Sanity CMS.
- **Kualitas**: Vitest (7 suite unit), Playwright (smoke/paywall/visual/a11y),
  Storybook + Chromatic, TypeScript strict, ESLint, audit keamanan di CI.
- **Keamanan & Aksesibilitas**: CSP produksi ketat, security headers, Sentry,
  skip-link, ARIA, kontras WCAG AA (laporan: `SECURITY_AUDIT.md`, `SECURITY_PENTEST_REPORT.md`, `docs/a11y-checklist.md`).
- **Rilis otomatis**: workflow `release.yml` — push tag `v*` → build → tes → publish GitHub Release.

### 📚 Dokumentasi
- README baru yang menarik (ID + ringkasan EN), CHANGELOG ini, DESIGN_SYSTEM.md,
  RESPONSIVE_AUDIT.md, docs monitoring & a11y checklist.

[1.0.0]: https://github.com/njutawan/Washington-Post/releases/tag/v1.0.0
