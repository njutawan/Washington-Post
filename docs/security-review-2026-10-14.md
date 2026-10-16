# Audit 20 kontrol keamanan — 14 Oktober 2026

**Repository:** `njutawan/Washington-Post`  
**Baseline kode:** `ee07ffe9432ab953dc49c8086a48bc0f7aa2ec59`  
**Branch:** `arena/0b6b356a-washington-post`  
**Keputusan:** **belum direkomendasikan live sebagai layanan produksi dengan akun, CMS, dan langganan berbayar.**

Audit ini hanya menambahkan laporan; **tidak memperbaiki kode aplikasi, mengganti password/secret, memperbarui dependency, atau mengubah deployment**.

## Lingkup dan batas bukti

- Review source API, Server Actions, auth/role, penyimpanan, konfigurasi Next.js/Sentry, service worker, dependency lockfile, dan CI.
- Unit test, TypeScript, lint, production build; request HTTP berjumlah kecil ke `next start` lokal dalam mode production.
- Runtime lokal **tanpa kredensial Clerk, payment, email, atau layanan produksi**. Hasil fallback NextAuth tidak otomatis berlaku untuk konfigurasi Clerk/CDN produksi.
- Probe terisolasi terhadap kode CMS dengan filesystem/auth/cache/navigation yang dimock. Tidak menulis file traversal, tidak mengirim email/push sungguhan, tidak melakukan load test atau eksploitasi server publik.
- Tidak mengakses konfigurasi WAF/CDN, dashboard auth, secret manager, database/backup produksi, atau pengaturan branch protection.
- `SECURITY_AUDIT.md` dan `SECURITY_PENTEST_REPORT.md` adalah laporan terdahulu, **bukan bukti bahwa revisi ini sudah aman**. Klaim risiko rendah di laporan lama tidak boleh dijadikan persetujuan live untuk kode saat ini.

**Arti status:** “baik lokal” terbatas pada kode/artefak dan request yang diuji; “sebagian” berarti kontrol ada tetapi masih ada gap; “gagal” berarti ada kekurangan terkonfirmasi; “belum diuji” bukan lulus; “tidak tersedia” berarti implementasinya tidak ditemukan, bukan dinyatakan aman.

## Checklist 20 poin

| # | Kontrol | Status | Bukti, gap, dan tindak lanjut |
|---|---|---|---|
| 1 | Rate limit API | **Gagal** | `src/auth.ts:25–73,88–98`: hanya login, Map per-process, key IP+email; signup melewati limiter. API analytics, newsletter, komentar, bookmark, push subscription, dan koneksi SSE tidak punya limiter aplikasi. IP berasal dari forwarding header yang harus dinormalisasi proxy terpercaya. Tambahkan limiter shared-store per-IP/per-akun/per-operasi, 429 + Retry-After, kuota email dan batas koneksi. WAF eksternal belum diketahui. |
| 2 | CORS ketat | **Baik lokal** | Tidak ditemukan wildcard/refleksi `Access-Control-Allow-Origin`. GET dari Origin asing dan OPTIONS newsletter tidak mengembalikan ACAO/ACAC; browser tidak mendapat izin membaca respons cross-origin. **CORS bukan autentikasi**, tidak memblokir curl, dan tidak menggantikan CSRF. Pastikan CDN/reverse proxy tidak menambah header permisif. |
| 3 | CSRF protection | **Sebagian** | `src/lib/csrf.ts` dipakai pada bookmark, komentar, newsletter, push, dan live publish; request cross-site bookmark teruji 403. Helper membandingkan **host**, bukan scheme+host, menerima Origin kosong, dan fail-open jika Host kosong. Auth.js/Server Actions memakai mekanisme framework yang perlu diuji terpisah. Gunakan canonical-origin allowlist, fail-closed untuk input origin invalid, dan kebijakan token untuk klien non-browser; jangan menganggap spoof header dari curl sebagai bypass browser. |
| 4 | Cegah SSRF | **Sebagian** | `src/lib/push.ts:61–79,105–111`: HTTPS + allowlist host push; test penolakan internal/host asing lulus. Fetch NewsAPI/Resend memakai base host tetap; optimizer gambar punya remotePatterns terbatas. Push validator masih mengizinkan subdomain, port nonstandar, dan URL userinfo pada host yang diizinkan. Perketat host/port/userinfo; verifikasi perilaku DNS/redirect dan egress policy produksi. **Tidak ditemukan bypass SSRF yang terbukti** pada pengujian ini. |
| 5 | Cegah path traversal | **Gagal — High** | `stories/[id]/actions.ts:21` menerima slug bebas; `src/lib/editorialStore.ts:284–313` memakainya dalam path baca/tulis MDX tanpa containment check. Probe filesystem mock membuktikan slug `../../audit-outside` keluar dari `content/articles`. Detail F01. |
| 6 | Validasi input API | **Gagal** | JSON literal `null` menghasilkan HTTP 500 pada analytics collect, newsletter PUT, dan push subscribe POST. Penangkapan syntax JSON tidak cukup untuk memvalidasi bentuk objek. Newsletter menerima preference key/email tanpa schema; signup hanya password minimal 4 karakter; slug/status/priority CMS tidak divalidasi runtime. Batas panjang field ada pada sebagian route, tetapi tidak ada batas ukuran raw body route secara eksplisit. Detail F03–F04. |
| 7 | Validasi output API | **Sebagian** | Banyak respons dibentuk eksplisit dan `getUserProfile()` membuang hash/salt (`src/lib/db.ts:267–274`), tetapi tidak ada kontrak/DTO runtime konsisten. Comments mengirim record beserta userId; push send mengembalikan URL endpoint subscription saat gagal (`push.ts:174–195`); minimalkan sesuai kebutuhan. Newsletter memasukkan key preference arbitrer langsung ke HTML email, terkonfirmasi dengan email sender mock. Validasi output tidak menggantikan otorisasi/escaping. |
| 8 | Admin route terlindungi | **Sebagian** | Settings/staff memakai `getEditorialUser('admin')`; Server Actions memakai `requireActor`, publish memerlukan editor dan delete memerlukan admin. Request anonim settings teruji 307 ke signin. Tetapi action transisi status membiarkan author menulis `published` pada artikel sendiri (F02). Middleware Clerk menangkap beberapa error dengan pass-through (`src/middleware.ts:81–93`); jangan jadikan middleware satu-satunya guard. Uji kegagalan provider dan semua role di staging. |
| 9 | Default password / titik sensitif | **Gagal kesiapan produksi** | Tidak ditemukan akun/password admin default aktif pada alur auth yang direview; `.env.example` berisi placeholder, bukan bukti secret produksi. Namun password signup hanya 4 karakter; secret NextAuth/VAPID dapat dibuat per-process saat env hilang, bukan startup fail-closed. NEXTAUTH_URL opsional saat trustHost aktif. `.gitignore` mengabaikan `.env.local`, tetapi tidak semua nama `.env`/`.env.production`. Wajib secret stabil dari secret manager, kebijakan password kuat, MFA staf, rotasi kredensial historis jika pernah bocor, dan secret scanning. **Tidak ada password/secret yang dirotasi dalam audit ini.** |
| 10 | Audit endpoint / audit trail | **Gagal** | Inventaris ada di bawah. `/api/analytics/stats` memberi 200 tanpa login, sementara datanya disebut editorial dashboard. `/analytics` juga halaman client tanpa guard. Tidak ditemukan audit trail immutable untuk publish/delete/moderasi/role changes; `createdBy`/`updatedAt` bukan audit trail. Detail F05. |
| 11 | Verifikasi webhook | **Tidak tersedia** | Tidak ditemukan handler webhook bisnis/payment di `src/app/api`. NextAuth callback bukan pengganti webhook payment. Jika ditambahkan: verifikasi signature atas raw body, toleransi timestamp, replay/dedup event ID, secret terpisah, dan idempotensi. Belum ada test signature positif/negatif. |
| 12 | Payment server | **Tidak tersedia** | Tidak ditemukan checkout, order backend, SDK payment, atau rekonsiliasi server. Halaman subscribe adalah demo. Belum ada verifikasi amount/currency/order/user, settlement, refund, idempotency, atau kredensial gateway. **Jangan menerima pembayaran nyata dengan implementasi ini.** |
| 13 | Harga anti-tamper | **Belum memenuhi untuk layanan berbayar** | Harga berada di komponen client subscribe; CTA memanggil `reset()` saja (`src/app/subscribe/page.tsx:184`), bukan checkout. Tidak ada transaksi yang terbukti menerima harga dari klien karena payment belum ada. Namun paywall hanya localStorage (`src/lib/usePaywall.tsx:25–60`) dan bukan entitlement server. Bangun katalog harga server berdasarkan plan ID + gateway price ID, validasi total/currency, serta otorisasi konten server-side. |
| 14 | IDOR / BOLA | **Sebagian** | Bookmark/newsletter memakai userId dari session, bukan body. Edit artikel milik author lain yang memiliki authorId ditolak pada probe kontrol. Namun pemeriksaan ownership CMS bersyarat `existing.authorId && ...`: author boleh mengedit artikel tanpa authorId; UI juga sengaja mengizinkannya. Itu perlu kebijakan claim/unassigned yang eksplisit dan tes lintas akun, bukan klaim blanket “bebas IDOR”. Status transition juga bermasalah (F02). Belum ada E2E dua akun/tenant Clerk. |
| 15 | Log tidak membocorkan secret | **Sebagian — belum terbukti aman** | `src/lib/email.ts:48–62` mencetak raw provider error, exception, dan alamat email; CMS juga mencetak raw exception. Sentry replay mengatur `maskAllText:false`, `blockAllMedia:false`, dan beforeSend identity (`src/instrumentation-client.ts`). Tidak ada redaction hook aplikasi yang konsisten. Ini **risiko pengungkapan/PII**, bukan bukti token produksi sudah bocor. Terapkan allowlist field log, scrub authorization/cookie/token/query sensitif, masking replay, retensi dan akses terbatas. |
| 16 | Private source map | **Baik pada build lokal; produksi belum diverifikasi** | `next.config.js` menyetel `hideSourceMaps:true`; build lokal yang diperiksa memiliki **0 file .map** dan **0 JS dengan sourceMappingURL** di `.next/static`. Build ini tanpa konfigurasi upload Sentry produksi; flag saja tidak membuktikan map tidak tersaji di deployment lain. Periksa artifact pasca-upload, hapus map publik, batasi akses Sentry dan CI artifact, uji URL map di CDN. |
| 17 | Update dependency | **Sebagian** | Audit lockfile terbaru pada sesi ini: **22 affected package entries** (13 high, 4 moderate, 5 low, 0 critical), berasal dari **4 GHSA unik**, bukan 22 celah independen. Production-only: 4 moderate entries dari 1 GHSA. Gate lulus dengan 3 pengecualian moderate/high, jadi bukan zero-vulnerability. Tidak menjalankan update/force-fix karena ini audit dulu. Detail tabel dependency. |
| 18 | Tes restore backup | **Belum diuji — blocker produksi** | Tidak ditemukan job/runbook/hasil restore. Data akun di `.demo-db.json`, editorial di `.editorial-data`, publikasi di `content/articles`; push/analytics/anonymous newsletter sebagian in-memory. Write JSON tidak memakai atomic rename; multi-instance tidak terkoordinasi. Git bukan backup data akun. Uji restore snapshot terisolasi, integritas dan login/ownership, dokumentasikan RPO/RTO, enkripsi dan akses. |
| 19 | Security header | **Sebagian** | Production HTTP lokal mengandung CSP, HSTS, nosniff, DENY, Referrer-Policy, Permissions-Policy, CORP. CSP script masih `unsafe-inline`; pertimbangkan nonce/hash dengan penyesuaian rendering. HSTS diterima di respons lokal, tetapi enforcement HTTPS/TLS/CDN belum diuji. Komentar config yang menyebut nonce tidak didukung jangan dipakai sebagai pembenaran permanen. |
| 20 | Tes security sebelum live | **Belum lengkap** | 39 unit test lulus, tsc/lint/build lulus, ditambah HTTP/probe terbatas. Belum ada security suite lengkap untuk abuse limit, cross-account/tenant, role escalation, CSRF browser, webhook/payment, restore, dan CDN. CI lint `continue-on-error:true`; CI menjalankan smoke test, bukan seluruh security checklist; status required checks di GitHub belum diperiksa. Perlu gate staging dan re-test setelah perbaikan. |

## Temuan prioritas dan kriteria perbaikan

### F01 — High: path traversal pada publish CMS (CWE-22)

**Bukti:** slug berasal dari form edit, disimpan tanpa validasi, lalu digunakan `path.join(articlesDir, slug + '.mdx')` untuk membaca/menulis. Probe menjalankan fungsi publish asli dengan filesystem mock dan field metadata terisi: target MDX keluar dari direktori artikel.

**Prasyarat/dampak:** publish action memerlukan editor/admin. Author dapat menanam slug pada artikelnya dan menunggu editor mem-publish; editor juga dapat menyalahgunakannya langsung. Dapat membaca/mengubah file target berekstensi `.mdx` di lokasi writable yang dapat dijangkau. **Tidak membuktikan anonymous arbitrary-file-write, pembacaan file sembarang berekstensi lain, atau RCE.** Konten MDX dari CMS juga perlu diperlakukan sebagai sumber kode tepercaya, bukan HTML bebas.

**Perbaikan:** validasi slug berformat ketat (misalnya huruf kecil/angka dengan hyphen, panjang terbatas, tanpa slash/backslash/dot); periksa resolved path tetap di root artikel sebelum read/write, cegah symlink escape bila relevan; cegah overwrite slug milik artikel lain. Uji di action **dan** store supaya pemanggil baru tidak melewati invariant. Pastikan metadata opsional tidak membuat serialisasi YAML gagal.

**Acceptance test:** traversal `../`, separator encoded/backslash, absolute path, collision, slug kosong/panjang, dan symlink ditolak tanpa read/write; publish slug valid tetap berhasil.

### F02 — High untuk integritas workflow: author bisa menulis status terlarang (CWE-862 / CWE-20)

**Bukti:** `src/app/editorial/stories/[id]/actions.ts:34–45` meng-cast form status `as any`; hanya transisi ke `editing` yang diblokir untuk author. Probe actor author pada artikel sendiri dengan status `published` berhasil memanggil upsert dengan status tersebut. String status lain juga tidak mempunyai enum guard.

**Batas dampak:** perubahan ini menandai record sebagai published; **tidak memanggil `publishStory()` dan tidak membuktikan artikel langsung terbit di situs**. Ownership untuk authorId kosong juga fail-open secara kebijakan, sedangkan edit artikel author lain dengan authorId terisi ditolak.

**Perbaikan:** state machine server-side untuk pasangan role × status awal × status tujuan, enum runtime, kontrol ownership/claim eksplisit, dan audit event setiap perubahan. Gunakan satu jalur publish yang selalu memerlukan editor/admin.

**Acceptance test:** reader/anonymous ditolak; author tidak boleh ready→published melalui action alternatif; editor publish valid; admin delete valid; lintas author/tenant dan unassigned diuji sesuai kebijakan.

### F03 — Medium: validasi request tidak konsisten dan input invalid memicu 500

**Bukti HTTP lokal:** body JSON `null` menghasilkan 500 pada tiga route publik/fallback (lihat matriks verifikasi). Newsletter dan komentar juga memakai destructuring JSON tanpa handler error konsisten. Batas field sesudah parsing tidak membatasi raw request allocation.

**Perbaikan:** schema object runtime dengan allowlist key, enum, tipe, format dan panjang; malformed JSON/shape → 400, payload terlalu besar → 413; batasi body di edge dan route. Validasi email serta identitas artikel/slug; jangan menelan error penyimpanan atau mengirim internal exception ke klien.

### F04 — Medium: abuse newsletter, HTML injection email, dan pengamanan akun lemah

**Bukti:** newsletter menerima preference key bebas lalu menginterpolasikannya di HTML (`src/app/api/newsletters/route.ts:64–87`); probe key `<b>audit-markup</b>` muncul tanpa escaping pada email mock. Anonymous caller dapat memberikan recipient email pada mode tanpa Clerk. Pengiriman authenticated memakai semua preference true, bukan hanya subscription baru (`:52–57`). Tidak ada kuota/rate limit/double opt-in; anonymousStore dan outbox stub tidak mempunyai cap. Signup tidak dibatasi limiter dan menerima password empat karakter.

**Prasyarat/dampak:** email nyata hanya terkirim bila provider dikonfigurasi; konfigurasi Clerk normal memagari newsletter lewat middleware. Request non-browser tetap dapat menjangkau alur anonymous ketika Clerk tidak aktif. Risiko email bombing, biaya, memory exhaustion, dan manipulasi tampilan email; **bukan bukti JavaScript dapat berjalan di email client**.

**Perbaikan:** allowlist newsletter ID, email format/size, escape template, recipient verification/double opt-in, diff subscription idempotent, limiter shared store, cap/TTL storage, hentikan fallback email stub yang tampak sukses di produksi. Terapkan kebijakan password kuat (misalnya minimum 15 karakter untuk password-only) dan deteksi password bocor; gunakan KDF asynchronous agar signup tidak memblokir event loop. Hash scrypt + salt sudah ada dan test lulus.

### F05 — Medium: data analytics editorial terbuka dan belum ada audit trail

**Bukti HTTP:** anonymous GET `/api/analytics/stats` → 200 berisi totals/top pages/referrers/funnel; route tidak memanggil auth/role guard dan tidak termasuk matcher proteksi Clerk. `/analytics` client mengambil endpoint tersebut. Tidak ditemukan riwayat immutable actor/target/action/outcome untuk perubahan sensitif.

**Perbaikan:** auth editor/admin langsung di handler dan halaman; respons private/no-store; audit trail append-only dengan actor ID, object ID, action, result, timestamp, correlation ID, tanpa secret atau isi sensitif. Jika dashboard sengaja publik, dokumentasikan keputusan dan batasi dataset secara eksplisit.

## Inventaris endpoint HTTP

**15 route files, 20 handler methods yang diekspor.** NextAuth route bersifat catch-all; jumlah sub-endpoint framework tidak dihitung sebagai file terpisah. Server Actions CMS diaudit terpisah dan tetap merupakan permukaan HTTP yang harus dianggap dapat dipanggil langsung.

| Route | Method | Kontrol aktual / perhatian |
|---|---|---|
| `/api/analytics/collect` | POST | Publik; beberapa field dicap, tanpa limiter/CSRF guard; `null` → 500. CSRF di sini terkait integritas telemetry, bukan pengambilalihan akun. |
| `/api/analytics/stats` | GET | Publik; perlu keputusan akses editorial (F05). |
| `/api/auth/[...nextauth]` | GET, POST | Framework auth/CSRF; limiter custom hanya credentials signin, signup lemah. |
| `/api/bookmarks` | GET | NextAuth session; anonymous mengembalikan array kosong. |
| `/api/bookmarks/[slug]` | POST | NextAuth session + CSRF; slug tanpa schema, tanpa limiter. |
| `/api/comments/[articleId]` | GET, POST | GET publik; POST NextAuth + CSRF; body dipotong 1000 di store, parsing/ukuran raw body belum kuat. |
| `/api/feed` | GET | RSS publik, static, escaping XML ada. |
| `/api/feed/author/[slug]` | GET | RSS publik, escaping metadata ada; beberapa interpolasi URL/image perlu kontrak URL/escaping konsisten. Tidak dibuktikan sebagai exploit pada data saat ini. |
| `/api/podcasts/rss` | GET | RSS publik, escaping metadata ada; site base berasal dari env terpercaya. |
| `/api/live/updates` | GET | Publik SSE/poll; slug allowlist ada, belum ada kuota koneksi/per-IP. |
| `/api/live/publish` | POST | CSRF + shared token di production; token kosong → 501. Dev terbuka: jangan expose next dev ke internet. |
| `/api/newsletters` | GET, PUT | NextAuth atau anonymous cookie; Clerk middleware memerlukan login jika aktif. CSRF PUT ada, schema/rate limit/cookie anonymous perlu hardening. |
| `/api/push/key` | GET | Publik; VAPID public key memang boleh terbuka. |
| `/api/push/subscribe` | POST, DELETE | Publik + CSRF + push host allowlist pada add; DELETE tidak membuktikan ownership. Endpoint URL bertindak sebagai capability; batasi akses/mutasi jika diketahui pihak lain. |
| `/api/push/send` | POST | CSRF + shared token di production; token kosong → 501; respons failures berisi endpoint subscription, perlu redaksi. |

**Auth/cache tambahan:** route akun di atas memakai NextAuth meskipun middleware bisa memakai Clerk. Uji perilaku dual-provider agar sesi satu provider tidak dipercaya secara keliru oleh provider lain. `markNoStoreIfSignedIn()` hanya memeriksa cookie `authjs.session-token` dan `__session`, bukan varian `__Secure-authjs.session-token`/chunked; dampak cache aktual perlu diuji dengan cookie production. Next.js juga mengirim no-store pada beberapa route dinamis, jadi belum terbukti ada cache leak. Service worker mempunyai queue mutation dengan credentials saat replay; uji pergantian akun/logout agar request lama tidak dijalankan sebagai akun baru dan jangan persist header/body sensitif tanpa kebijakan.

## Hasil pengujian yang benar-benar dijalankan

| Pengujian | Hasil |
|---|---|
| Install reproducible | `npm ci --legacy-peer-deps --ignore-scripts --no-audit --no-fund` sukses; lockfile tidak diubah. Lifecycle scripts sengaja tidak dijalankan. |
| Unit test | `npm test`: **8 files / 39 tests lulus**. Coverage security masih terbatas; ada warning kompatibilitas config Vite native loader. |
| Type check | `npx tsc --noEmit`: exit 0. |
| Lint | `npm run lint`: tidak ada ESLint warning/error; ada pemberitahuan deprecation `next lint`. |
| Production build | `NEXT_TELEMETRY_DISABLED=1 npm run build`: exit 0, 148 static pages. Ada warning performa serialisasi cache webpack, bukan temuan security. |
| Dependency audit | `npm audit --json` dan `npm audit --omit=dev --json`: ada vulnerability sesuai tabel di bawah. |
| Gate dependency | `npm run audit:ci`: PASS dengan **3 acknowledged advisories**, bukan zero findings. |
| Anonymous stats | GET `/api/analytics/stats`: **200** dengan data summary. |
| Anonymous admin | GET `/editorial/settings`: **307** ke `/signin?callbackUrl=%2Feditorial`. |
| Anonymous mutation | POST `/api/bookmarks/demo`: **401**. |
| CSRF cross-site | POST bookmark dengan Origin asing + Sec-Fetch-Site cross-site: **403**. |
| Dev helpers production | POST `/api/live/publish` dan `/api/push/send` tanpa token/env: **501**, tidak menjalankan publish/broadcast. |
| CORS | GET stats dari Origin asing: 200 **tanpa ACAO/ACAC**; OPTIONS newsletter: 204 **tanpa ACAO/ACAC**. Ini deny browser CORS, bukan pembatasan curl. |
| Invalid JSON shape | POST analytics collect, PUT newsletter, POST push subscribe dengan body `null`: masing-masing **500**. |
| Probe rate limit kecil | 25 GET stats berurutan: semuanya **200**, tidak ada 429. Tidak membuktikan threshold WAF produksi atau ketahanan beban. |
| Source map build lokal | `.next/static`: **0 .map**, **0 JS sourceMappingURL**. Tidak memeriksa konfigurasi upload Sentry/CDN produksi. |
| Probe CMS terisolasi | Fungsi publish asli + mocked fs: target keluar direktori. Author+status published: upsert diterima. Edit missing authorId: diterima; authorId pihak lain: ditolak. Ini bukan login/E2E Clerk. |
| Probe helper CSRF | Origin `http://example.test` + Host `example.test` + same-site diterima; membuktikan perbandingan host-only, bukan eksploit browser. |
| Probe email terisolasi | Key preference HTML masuk template tanpa escaping; sendEmail dimock sehingga tidak ada email terkirim. |

Server audit lokal dihentikan setelah pengujian. Data test lokal bukan backup dan tidak diikutkan sebagai deliverable.

### Snapshot dependency audit

| Lingkup | Critical | High | Moderate | Low | Total package entries | GHSA unik |
|---|---:|---:|---:|---:|---:|---:|
| Semua dependency lockfile | 0 | 13 | 4 | 5 | 22 | 4 |
| `--omit=dev` | 0 | 0 | 4 | 0 | 4 | 1 |

Advisory unik dari registry npm pada sesi audit:

- `GHSA-vfj7-8cjw-p6xm`: braces, high; build/dev dependency chain; di-allowlist gate.
- `GHSA-g84c-rxfj-3j2c`: webpack-dev-middleware, high; Storybook dev chain; di-allowlist gate. Jangan expose Storybook/dev server ke jaringan tidak tepercaya.
- `GHSA-hp3w-g68c-fv3c`: sprintf-js, moderate; gray-matter → js-yaml → argparse chain; di-allowlist gate. Parser frontmatter hanya seharusnya mengonsumsi konten tepercaya; production-only audit tetap melaporkannya.
- `GHSA-848j-6mx2-7j84`: elliptic, low; tooling/polyfill chain; di bawah threshold gate moderate.

Audit menghitung paket terdampak transitif juga, sehingga 13 high bukan 13 advisory high independen. Tidak ada kesimpulan bahwa setiap advisory reachable dari request publik. Review fix upstream dan jalur pemakaian sebelum upgrade/migrasi; **jangan `npm audit fix --force` tanpa regression test**. Pengecualian harus punya owner, batas waktu review, dan pembuktian exposure; saran downgrade/major dari npm bukan otomatis solusi aman.

## Gate sebelum live

### Prioritas pertama — sebelum membuka CMS/akun ke publik

1. Perbaiki F01 containment/slug dan F02 role-state authorization, tambahkan regression test positif/negatif.
2. Tutup atau sengaja dokumentasikan endpoint analytics publik (F05); audit semua Server Actions langsung, bukan hanya menu/UI.
3. Shared rate limiting + request/body/connections cap; perbaiki schema dan handling `null`/malformed JSON (F03).
4. Perkuat signup, secret startup validation, canonical origin, log/replay redaction; batasi newsletter/email abuse (F04).
5. Tentukan model auth tunggal atau integrasi Clerk–NextAuth yang eksplisit; uji fail-closed, per-role, dua akun, dan tenant boundary.
6. Gunakan storage produksi yang durable dan terkoordinasi. Tetapkan owner backup, RPO/RTO, lalu restore drill yang benar-benar berhasil.

### Wajib tambahan sebelum menjual langganan

7. Implementasi checkout server, server-owned plan/price mapping dan entitlement server-side. Tidak boleh mengandalkan tombol reset/localStorage.
8. Webhook signature raw-body, timestamp window, replay/dedup, idempotency; uji amount/currency/user/order mismatch, refund, double delivery dan gagal settlement.

### Verifikasi staging/deployment

9. Uji origin/CORS/CSRF browser di domain asli; header HTTPS/TLS dan cache lewat CDN; source map publik harus tidak tersedia dengan isi map.
10. Jalankan security regression suite (401/403/429/413, IDOR/role/state, SSRF/path traversal, output/PII/log), full smoke/E2E relevan, dependency review, dan secret scanning. Jadikan status keamanan required check; lint tidak boleh diabaikan untuk rilis.
11. Catat bukti restore, hasil payment sandbox bila fitur ada, penanggung jawab dan penerimaan residual risk tertulis. Setelah perbaikan, lakukan re-audit terhadap commit dan artefak deployment yang akan dirilis.

**Kesimpulan:** ada kontrol dasar yang baik (guard auth per action, CSRF pada banyak mutation, host allowlist push, password hashing scrypt, header security, dan unit test). Namun temuan baru CMS, kurangnya pembatasan abuse/validasi, analytics terbuka, serta ketiadaan payment dan restore verification membuat label “aman untuk live” belum dapat diberikan.
