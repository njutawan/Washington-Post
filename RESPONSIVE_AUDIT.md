# Audit Tampilan Responsif — Desktop, Tablet, Mobile

## Breakpoint yang digunakan Tailwind
- `sm`: ≥ 640px (mobile landscape / small tablet)
- `md`: ≥ 768px (tablet portrait / iPad Mini)
- `lg`: ≥ 1024px (tablet landscape / small desktop)
- `xl`: ≥ 1280px (desktop)
- `2xl`: ≥ 1536px (large desktop)

## Temuan Audit Saat Ini

| # | Area | Status | Catatan |
|---|------|--------|---------|
| 1 | Distribusi breakpoint | ⚠️ | Hanya 5 `sm:`, 26 `md:`, 6 `lg:`, 0 `xl:`/`2xl:` — terlalu lompat dari mobile ke desktop, **tablet kurang perhatian**. |
| 2 | Container max-width `[1280px]` | ⚠️ | Di layar >1500px konten mulai terasa "mengambang" karena terlalu lebar; baris artikel bisa >90 karakter (melebihi ideal 60-75 ch). |
| 3 | Gutter/kanvas `px-4` di 34 tempat | ✅ Baik | Tetapi di layar xl/2xl padding tak bertambah — whitespace di pinggir terasa sempit. |
| 4 | Masthead title `text-5xl md:text-7xl lg:text-8xl` | ⚠️ | Di iPhone SE (375px) `text-5xl` cukup besar; di Galaxy S23 Ultra (500px+) masih 5xl, bisa di-`sm:text-6xl`. Tanggal hari ini `hidden md:inline` — sembunyi di mobile (bagus), tapi "Edition: U.S." juga tersembunyi. |
| 5 | Primary nav `overflow-x-auto no-scrollbar` | ⚠️ | Sudah horizontal-scroll di mobile, tapi **tidak ada indikator visual** bahwa nav bisa di-swipe. Di tablet (768-1023px) nav link bisa terpotong karena `justify-center` + `gap-5` — user harus tahu bahwa mereka bisa scroll. |
| 6 | Secondary nav (subNav) `hidden md:block` | ❌ | Hilang total di mobile — akses ke Newsletters/Games/Well+Being cuma lewat hamburger. |
| 7 | Touch targets (Bookmark, share, icon buttons) `w-4 h-4` / `p-1` / `py-1.5` | ❌ | Beberapa tombol (BookmarkIcon 16px, "Follow" py-1.5 = 24px total) **di bawah standar WCAG 48×48px** untuk mobile. |
| 8 | Mini Crossword `.x-cell` 36px | ⚠️ | Ok di desktop, tapi 5×36=180px + padding = fit di mobile (375-32=343px sisa ~160px untuk klue). Tapi di layar kecil klue panel terhimpit — sebaiknya grid jadi `32px` di mobile. |
| 9 | VideoHero `aspect-video md:aspect-[21/9]` | ✅ | 16:9 di mobile sudah benar; 21:9 cinemascope di desktop. Cuma overlay teks: `p-6 md:p-10` bagus, tapi dek `hidden md:block` — user mobile tidak melihat deskripsi video. |
| 10 | Article body `lg:col-span-2` + `max-w-none` | ⚠️ | Di desktop (1280px) 2/3 dari 1280 ≈ 850px → lebar baris ~110 karakter, **terlalu lebar untuk membaca** (ideal 60-75 ch). Perlu `max-w-prose` atau inner wrapper. |
| 11 | Homepage grid (promo cards, The Seven, PhotoGallery) | ⚠️ | `grid md:grid-cols-2` — di tablet (768px) kolom 2 mulai aktif, padahal 768px 2 kolom bisa terasa sempit untuk card dengan gambar+headline. `md:grid-cols-2` bisa ditunda ke `lg`. |
| 12 | Lead story hero height `h-[360px] md:h-[480px]` | ⚠️ | Di mobile 360px = hampir seluruh viewport (sebelah headline jadi ter-scroll jauh). Ideal 240-280px di mobile. |
| 13 | TheSeven carousel autoplay | ✅ | Sudah `pause-on-hover`, keyboard nav, prev/next, dan menghargai `prefers-reduced-motion`. Tombol pause perlu diperbesar (touch target). |
| 14 | Lightbox nav buttons `w-10 h-10 p-3` | ⚠️ | 40px mendekati tapi di bawah 48px; di mobile close/next/prev susah ditekan. |
| 15 | LiveTicker marquee | ✅ | Sudah `truncate max-w-[60ch]` dan mencegah teks keluar. Tapi badge "Breaking" mengambil 100+px di mobile yang memotong area baca. |
| 16 | Search overlay `fixed inset-0 z-50 ... pt-20 px-4` | ✅ | Sudah full-screen mobile modal. Input py-4 = 48px+ (bagus). Keyboard shortcuts `⌘K` hanya terlihat di layar md+. |
| 17 | Newsletter signup forms | ✅ | Input py-3 + button py-3 = ~44-48px (oke). Di mobile susunan form stack (bagus). |
| 18 | Footer grid `grid-cols-2 md:grid-cols-5` | ⚠️ | 2 kolom di mobile bagus; tapi "Morning Mix" band di mobile akan menumpuk vertikal (belum dicek). |
| 19 | `-webkit-tap-highlight-color` & overscroll | ❌ | Tidak diatur — tap highlight abu-abu default iOS merusak feel. |
| 20 | Safe-area insets (notch/home indicator) | ❌ | Belum `viewport-fit=cover` + `env(safe-area-inset-*)` — di iPhone dengan notch, konten bisa tertutup. |
| 21 | Tablet (768-1023px) specifically | ⚠️ | Tidak ada penyesuaian spesifik tablet. Misal sidebar masih tersembunyi sampai `lg` (1024px) — di iPad portrait (768-820px) layout full-width satu kolom tanpa sidebar, terasa "stretched". |
| 22 | Font sizes pada article `text-lg md:text-[1.15rem]` | ⚠️ | 18px di mobile oke, 1.15rem (~18.4px) di desktop agak kecil untuk pembaca berita. WaPo biasanya 19-20px untuk body desktop. |
| 23 | Paywall meter bar & subscribe modal | ⚠️ | Modal di mobile belum dicek padding-nya; kemungkinan full-width ok. |
| 24 | Opinion lead (columnist avatar) `w-28 h-28 md:w-36 md:h-36` | ⚠️ | 112px bulat di mobile mengambil 1/3 lebar layar, headline terhimpit. |
| 25 | Photo gallery feature tile `col-span-2 row-span-2` | ✅ | Sudah bagus — tile besar 2x2 di semua layar, thumbnail grid 2 kolom mobile / 4 kolom desktop. |

## Rekomendasi Optimisasi (Dampak Tertinggi)

### 🔥 P1 — Mobile critical
1. **Perbesar touch target** semua tombol ikon (Bookmark, Share, Lightbox prev/next/close, carousel pause) jadi minimal 44×44px, ideal 48×48px (tambah `p-2.5` atau bikin wrapper 12×12).
2. **Mini crossword**: kecilkan cell jadi 32px di mobile (`w-8 h-8 sm:w-9 h-9`) supaya klue pas.
3. **Kurangi hero height di mobile**: 360→260px, headline text-3xl saja, dek hidden diganti dengan 1 baris.
4. **Opinion lead avatar**: 112→80px di mobile, biar headline punya ruang.
5. **-webkit-tap-highlight-color transparent** + **overscroll-behavior** untuk lightbox/modal.
6. **Safe-area insets** di viewport meta + padding bawah untuk home indicator.
7. **Sub-nav** tampil 1 baris scrollable di mobile (bukan hidden) untuk quick access Newsletters/Games.

### 📱 P1 — Tablet-specific
8. **Sidebar muncul di `md`** (768px+) dengan grid `md:col-span-1`, bukan nunggu `lg`. Gunakan `md:grid-cols-3` alih-alih `lg:grid-cols-3`.
9. **Container max-width** per breakpoint:
   - `sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] xl:max-w-[1200px] 2xl:max-w-[1280px]`
   - Tambah padding: `px-4 sm:px-6 lg:px-8`.
10. **Article body wrapper**: baca enak — capai `max-w-[65ch]` (~680px) dengan `mx-auto`, sidebar terpisah.
11. **Promo cards 2 kolom** mulai dari `lg` bukan `md`.

### 🖥️ P2 — Desktop polish
12. **Body font-size** desktop naikkan ke 19-20px (`lg:text-lg lg:text-[1.2rem]`).
13. **Line-height** 1.7-1.8 untuk body desktop.
14. **Scroll-hint nav** (gradien kiri-kanan) di primary/secondary nav untuk indikasi horizontal scroll.
15. **Desktop hover states** sudah ada (`hover:text-wp-red`) — tambah `focus-visible` underline pada link.

### ♿ P2 — Accessibility mobile
16. **`scroll-padding-top`** saat skip-to-content agar masthead fixed tidak menutupi.
17. **Lightbox** — tambah geser (swipe) left/right di mobile.

### ✨ P3 — Nice-to-have
18. **Bottom nav bar** fixed untuk mobile (Home / Sections / Search / Saved / Subscribe) — pola umum app berita.
19. **Pull-to-refresh** di live blog.
20. **Adaptive typography** dengan `clamp()` untuk headline agar tak perlu 3 breakpoint.
21. **Dark mode** (opsional, WaPo ada tema gelap).

---

## Perubahan yang Sudah Diterapkan (setelah audit)

1. **Container responsif `.wp-container`** — class utility menggantikan semua `max-w-[1280px] mx-auto px-4` dengan breakpoint bertahap:
   - Mobile: padding 1rem
   - sm (640px+): padding 1.5rem, max-width 640px
   - md (768px+): max-width 768px
   - lg (1024px+): padding 2rem, max-width 1024px
   - xl (1280px+): max-width 1200px
   - 2xl (1536px+): max-width 1280px

2. **Sidebar muncul di tablet (`md`)** — semua grid `lg:grid-cols-3` + `lg:col-span-2/1` diubah menjadi `md:grid-cols-3`, jadi di iPad portrait (768px+) sidebar sudah tampil (2:1) daripada harus menunggu layar desktop 1024px+.

3. **Touch target 44px di mobile** — class `.tap-target` memberikan min 44×44px untuk semua tombol ikon (Bookmark, Share, Lightbox prev/next/close, VideoHero play/mute, Masthead hamburger & account). BookmarkButton dan Lightbox buttons di-upgrade ke w-10/w-12.

4. **Masthead sticky** — header sekarang `sticky top-0 z-40` dengan shadow tipis + `padding-top: env(safe-area-inset-top)` untuk mendukung iPhone notch. Tanggal hanya tersembunyi di layar paling kecil (`hidden sm:inline`); Subscribe button full width saat `sm` ke atas, hanya icon di layar terkecil.

5. **Navigasi sekunder (subNav)** — tadinya `hidden md:block`, sekarang selalu tampil sebagai baris horizontal-scrollable dengan gradient-fade indikator (`.scroll-fade`) di kedua breakpoint mobile dan desktop. Primary nav juga selalu tampil (scrollable di mobile), hamburger tetap ada untuk top-level lengkap.

6. **Responsive hero heights**:
   - Article hero: `h-[240px] sm:h-[320px] md:h-[420px] lg:h-[480px]` (fullbleed edge-to-edge di mobile dengan `-mx-4 sm:mx-0`)
   - Section hero banner: dari fixed `h-[360px] md:h-[440px]` menjadi `h-[240px] sm:h-[320px] md:h-[400px] lg:h-[440px]`
   - VideoHero aspect ratio: `aspect-[16/10] sm:aspect-video md:aspect-[21/9]` (lebih tinggi di mobile untuk menampung overlay text)

7. **VideoHero teks & kontrol mobile**:
   - Play button 64px di mobile, 80px di desktop
   - Mute button 44px selalu
   - Badge "Video" sembunyi di mobile untuk hemat ruang
   - Dek video tampil mulai `sm` (landscape mobile 640px+), bukan `md` (768px+)
   - Text container `right-16 md:right-28` agar tidak tertutup tombol mute

8. **Article body readability**:
   - Class `.article-prose` membatasi lebar 65ch (~680px), auto-centered di mobile dan kiri-aligned di desktop
   - Font size 17px mobile → 18px sm → 1.2rem (19.2px) desktop, line-height 1.7 mobile → 1.75 desktop
   - Drop cap menyesuaikan (`text-5xl sm:text-6xl`)
   - Pull-quote padding lebih kecil di mobile (`px-4 md:px-6`)

9. **Mini Crossword cell** 32px di mobile (turun dari 36px) — 5×32=160px + klue lebih pas di 375px.

10. **Opinion page**: avatar lead 80px mobile → 112px sm → 144px md; columnist grid 2 kolom mobile / 3 sm / 4 md; grid 3-kolom editorial mulai sm, bukan md.

11. **Homepage**:
    - Lead+sidebar mulai di `md` (bukan `lg`) dengan sidebar border kiri
    - Promo cards (Games/Newsletters) split mulai `sm` (640px) bukan `md` (768px)
    - Semua section grid (Business, Wellbeing, Style, Sports) 2-kolom mulai `sm` bukan `md`
    - Padding vertical berkurang di mobile (`py-4 md:py-6`, `mb-6 md:mb-8`)
    - Live-updates link `py-2` agar mudah ditekan
    - Emoji promo mengecil di mobile

12. **Games/Newsletters pages**:
    - Games split 2 kolom mulai `md`
    - Newsletter cards grid mulai `sm` (bukan `md`)

13. **LiveTicker**:
    - Badge "Breaking" mengecil di mobile (`px-3 py-2 text-[10px]`), label teks hanya tampil di `sm+`
    - Ticker gradient-fade indikator horizontal scroll

14. **Footer**: `pb-[env(safe-area-inset-bottom)]` untuk iPhone home indicator.

15. **Global CSS**:
    - `-webkit-tap-highlight-color: transparent` (menghilangkan flash abu-abu saat tap di iOS)
    - `-webkit-text-size-adjust: 100%` (mencegah iOS Safari zoom-in otomatis ke input)
    - Safe-area env vars (--sat, --sar, --sal, --sab)
    - `.wp-container`, `.tap-target`, `.article-prose`, `.scroll-fade`, `.img-placeholder` utility classes
    - `body.no-scroll` overscroll-behavior: contain untuk Lightbox/modal

16. **Image optimization config**: AVIF + WebP, expanded deviceSizes/imageSizes, minimumCacheTTL 30 hari — mengurangi ukuran gambar yang dikirim ke perangkat mobile.

## Kualitas hasil per breakpoint (setelah optimisasi)

| Breakpoint | Rating | Catatan |
|---|---|---|
| <640px (mobile portrait) | ⭐⭐⭐⭐⭐ | 1 kolom, hero 240px, tombol 44px, tap highlight hilang, safe area, sticky header, nav scrollable dengan fade indicator, deks video disederhanakan |
| 640-767px (mobile landscape / small tablet) | ⭐⭐⭐⭐ | 2 kolom promo/related/newsletter, video 16:9, tampilan tanggal hari ini, badge Video muncul |
| 768-1023px (tablet portrait) | ⭐⭐⭐⭐ | Sidebar muncul (grid 3 kolom), avatar opinion 112px, columnist 4 kolom, container 768px |
| 1024-1279px (tablet landscape / small desktop) | ⭐⭐⭐⭐⭐ | 2-kolom article+sidebar, hero 420px, body 1.2rem / 1.75 line-height, container 1024px |
| 1280-1535px (desktop) | ⭐⭐⭐⭐⭐ | Container 1200px, hero cinemascope 21:9, 3-kolom sections, article prose 65ch |
| ≥1536px (large desktop) | ⭐⭐⭐⭐ | Container cap 1280px, tidak melebar terlalu jauh; bisa di-extend dengan content well kosong |
