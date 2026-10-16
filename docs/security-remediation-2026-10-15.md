# Implementasi prioritas keamanan — 15 Oktober 2026

Branch: `arena/0b6b356a-washington-post`. Audit awal tetap tersimpan sebagai dokumen historis di `security-review-2026-10-14.md`.

## Status enam prioritas

| Prioritas | Perubahan yang diterapkan | Batas / pekerjaan operator |
|---|---|---|
| 1. F01 / F02 | Slug schema ketat + collision check. Runtime CMS tidak lagi mengakses path/menulis MDX: publish plain text ke DB. State machine, ownership fail-closed, tenant check dan publish editor/admin di store + action. Regression positif/negatif untuk traversal, role, state, unassigned dan dua author. | Artikel CMS baru belum masuk seluruh indeks static homepage/search/RSS. Data MDX repo tetap trusted build source. |
| 2. F05 / Server Actions | Statistik API + halaman analytics harus editor/admin. Semua 11 action CMS diuji langsung sebagai anonymous/reader; guard ada di action dan invariant di store, bukan hanya UI/layout. Mutation CMS + role grant menulis audit dalam transaksi yang sama. Runtime DB role tak dapat update/delete audit; trigger tambahan diuji. | Set required checks di GitHub; archive audit immutable off-site dan log akses operator/owner DB melalui provider. |
| 3. Limit / F03 | PostgreSQL shared fixed-window limiter, scope IP/account/actor, raw streaming-body cap, deadline, strict schema dan private responses. SSE shared lease 3/client dan 100/newsroom, hard lifetime 90 detik, cleanup abort/cancel. | Trusted IP header hanya aman jika ingress overwrite dan origin tak dapat dibypass. Tanpa header semua anonymous berbagi bucket. WAF/DDoS/slow-client controls dan cron prune perlu provisioning. |
| 4. Signup / config / F04 | Password 15–128, pola lemah dasar, asynchronous scrypt, signup opt-in production, kuota signup/signin. Stable secret + HTTPS canonical origin + DB/migration/non-superuser startup checks. Log code-only, Sentry redaction dan replay off. Newsletter hanya preferensi authenticated, arbitrary recipient/HTML template/email otomatis dihilangkan. | MFA/breached-password service dan verified double-opt-in belum ditambahkan. Tidak ada rotasi secret produksi yang dilakukan dari workspace. |
| 5. Auth / tenant | **NextAuth credentials saja**; Clerk dependency/UI/provider fallback dihapus, OAuth dinonaktifkan. JWT tenant harus cocok konfigurasi server; account disabled/role dibaca ulang DB. Operator grant berdasarkan account ID, role signup selalu reader. Test role revoke, outage fail-closed, tenant mismatch, dua akun HTTP dan ownership author berbeda. | Single newsroom/deployment, bukan multi-organization SaaS. Konfigurasikan secret/tenant unik dan validasi identity staf sebelum grant; uji CDN/browser nyata. |
| 6. Storage / backup | PostgreSQL row-locked transactions menggantikan file/memory untuk akun, CMS, push dan bounded analytics. Schema migration + least-privilege runbook. Snapshot aplikasi AES-256-GCM, authenticated-before-write restore ke target kosong dalam transaksi. Restore drill PostgreSQL lokal nyata berhasil. | **Database/PITR/cron/off-site backup produksi belum diprovision. Nama backup owner/deputy belum diisi.** Usulan RPO 15 menit / RTO 60 menit belum menjadi SLA terukur. Migrasi data nyata lama perlu staging review; tidak ada import otomatis JSON lama. |

## Pengujian dan cara mengulang

```sh
npm ci --legacy-peer-deps
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:security -- --http
npm run audit:ci
```

- **112 unit tests lulus**, lint/type-check/build lulus, integration + restore + production HTTP lulus pada sesi ini.
- Unit suite mencakup schema/body, canonical CSRF, CMS store policy, seluruh action CMS, analytics role guard, telemetry redaction, konfigurasi production, scrypt/legacy hash, push endpoint/proof-of-removal.
- Integration menjalankan PostgreSQL native di direktori sementara, **dua proses Node** menerima tepat 30/40 request di shared budget dan mempertahankan 20 concurrent bookmark updates tanpa lost update.
- Lease test menolak koneksi keempat client yang sama dan koneksi ke-101 newsroom; release memungkinkan koneksi baru.
- Audit permissions/trigger diuji; data tenant lain tidak terlihat pada scoped document read.
- Snapshot terenkripsi direstore ke database **berbeda**, lalu login password, bookmark, profile, published article dan jumlah audit diuji lewat fungsi aplikasi. Wrong key, ciphertext tamper, tenant mismatch dan target non-empty ditolak. Dataset kecil (2 documents, 4 audit events); **bukan ukuran produksi**. Restore + pemeriksaan pada run lokal berlangsung sekitar 0,1–0,2 detik, bukan janji RTO.
- `--http` menjalankan build Next production memakai role DB non-superuser: signup/credentials session nyata, secure cookie, dua akun bookmark terisolasi, analytics 401/403/200 setelah role berubah, JSON null/malformed 400, raw bytes 413, cross-origin 403, Host palsu 421 dan tidak ada ACAO untuk origin asing.
- Startup negatif memeriksa error konfigurasi yang diharapkan (secret hilang, HTTP canonical origin dan provider Clerk yang sudah dipensiunkan), bukan sekadar exit code sembarang.
- Lint tetap mengeluarkan pemberitahuan deprecation `next lint`; Vitest memberi warning native config-loader; webpack build dapat memberi warning performa cache. Itu bukan klaim bebas warning tooling maupun zero-vulnerability.
- Dependency gate masih memiliki **3 acknowledged advisories** yang diwarisi. Tidak menjalankan major upgrade/force-fix sebagai bagian remediasi ini.

CI dan release workflow diperbarui agar lint tidak diabaikan dan menjalankan integration/restore regression sebelum deploy/release. Browser Playwright smoke fixture PostgreSQL disiapkan di CI; hasil workflow remote belum diperiksa/dijalankan dari sesi ini.

## Breaking changes / deployment checklist

1. Baca [runbook deployment](security-deployment.md), jalankan migrasi memakai owner, kemudian runtime memakai non-owner/non-superuser role. `npm start` tanpa konfigurasi production yang benar akan gagal—ini disengaja.
2. Hapus Clerk env; isi secret baru yang unik, canonical HTTPS origin, tenant tetap, dan URL PostgreSQL. Review semua ingress headers dan pool sizing.
3. Arsipkan data demo lama terenkripsi; **jangan menganggap `.demo-db.json` dan `.editorial-data` otomatis terbaca**. Jika ada data nyata, buat migrasi tervalidasi, pertahankan ID/hash dan uji staging sebelum cutover. Patch tidak menghapus data lama.
4. Tentukan manusia nyata untuk `BACKUP_OWNER` + deputy. Setujui RPO/RTO, jadwalkan backup/maintenance, aktifkan provider PITR, dan lakukan restore produksi terisolasi. `security:preflight` menolak owner kosong/TODO dan target waktu tak valid.
5. Gunakan operator CLI untuk grant staf setelah identitas account ID diverifikasi. Browser tidak dapat mengubah role lewat roster demo.
6. Newsletter delivery tetap off; live-blog simulator hanya read-only production. Fitur pembayaran/webhook/entitlement tetap belum ada dan **tidak dinyatakan siap jual**.

**Keputusan:** perbaikan kode dan bukti lokal tersedia; **belum memberikan persetujuan live produksi** sebelum konfigurasi, owner backup, migrasi/cutover bila ada data nyata, restore ukuran produksi, dan verifikasi jaringan/CDN/browser diselesaikan.
