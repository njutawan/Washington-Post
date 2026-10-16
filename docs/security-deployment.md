# Security deployment & backup runbook

Tanggal: **2026-10-15**. Menggantikan instruksi demo/auth/deployment lama di README.
Implementasi sudah diuji lokal; **bukan sertifikat aman atau bukti provisioning produksi**.

## 1. Model yang dipilih (breaking changes)

- **NextAuth credentials saja**, satu newsroom/realm per deployment. Clerk dan fallback lintas provider dihapus. OAuth Google/Apple tidak lagi ditawarkan. `/sign-in` dan `/sign-up` redirect ke `/signin`.
- `APP_TENANT_ID` berasal dari konfigurasi server. JWT memuat tenant; session tenant asing ditolak. User ID, status disabled, dan role dibaca ulang dari database. Role tidak berasal dari email, form, JWT role lama, maupun public metadata.
- Semua pendaftaran baru adalah `reader`. Public signup **default mati di production**; aktifkan `ALLOW_SIGNUP=true` hanya setelah ingress dan kapasitas teruji. Password 15–128 karakter, pemeriksaan pola lemah dasar, scrypt asynchronous dengan salt unik. Pemeriksaan ini bukan pengganti breach-password service/MFA staf; fitur itu belum ditambahkan.
- Operator mengangkat/menurunkan role berdasarkan **account ID** yang sudah diperiksa identitasnya, bukan email signup yang belum terverifikasi: `npm run staff:grant -- <account-id> <reader|author|editor|admin>`. Jalankan di lingkungan operator dengan `DATABASE_URL` operator dan `OPERATOR_ID` yang dapat diatribusikan. Perubahan role memiliki audit event; sesi lama mengikuti role terbaru.
- Newsletter API hanya menyimpan preferensi **akun terautentikasi**. Penerima anonim/email override, cookie anonymous store, email otomatis, dan optimistic success palsu dibuang. **Tidak ada email dikirim** sampai verified double-opt-in diimplementasikan. Inline CTA mengarah ke pengaturan akun.
- `/analytics` dan `/api/analytics/stats` memerlukan editor/admin. Layout bukan satu-satunya guard: semua 11 CMS Server Actions langsung memeriksa role, ukuran form, dan kuota actor. Store memeriksa ownership/tenant/state lagi di dalam transaksi.
- Author hanya dapat mengedit artikel sendiri dengan authorId terisi. Artikel unassigned harus ditangani editor, bukan otomatis dianggap milik siapa pun. State transition author terbatas pada pitch/draft/submit-to-edit. Publish hanya melalui editor/admin pada state `ready`. Record published/killed tidak bisa diubah lewat save biasa.

## 2. Storage dan publikasi

- **PostgreSQL wajib di production**. Runtime gagal startup bila konfigurasi, migrasi, atau koneksi tidak tersedia, dan menolak DB superuser. Tidak ada fallback production ke JSON/in-memory untuk akun/CMS/limiter.
- `app_documents` menyimpan akun, bookmark, preferensi, komentar, editorial, push subscriptions, dan bounded analytics. Primary key `(tenant_id,key)`, transaksi PostgreSQL + row lock mencegah lost updates antar-instance. Ini model document-store awal yang terkoordinasi, **bukan klaim siap skala newsroom besar**; shard/normalisasi tabel dan load test sebelum trafik tinggi. Document akun/CMS yang sama menserialisasi write.
- CMS publish menyimpan **plain text** di database, bukan menulis/mengeksekusi file MDX dari input staf. Slug berformat ketat dan unik. `/article/<slug>` membaca versi published dari DB sebelum konten repo/Sanity; rendering teks React dan serializer JSON-LD menghindari eksekusi markup. Artikel CMS baru belum otomatis ditambahkan ke seluruh indeks statis homepage/search/RSS—integrasi indeks harus direncanakan jika dibutuhkan.
- MDX di `content/articles` tetap trusted source build-time di Git; hanya maintainer kode boleh mengubahnya. Jangan mengompilasi MDX kiriman user/CMS.
- Live-blog yang lama adalah **simulator read-only di production**, bukan jurnal berita produksi: simulasi timer dan helper publish production dimatikan. Durable live publishing/pubsub belum diimplementasikan. Koneksi SSE tetap dibatasi dan ditutup otomatis. Jangan menjadikan demo live-blog sebagai sumber berita otoritatif.
- JSON atomic-rename di `.local-data/<tenant>` hanya untuk dev/test satu proses. `.demo-db.json`/`.editorial-data` lama **tidak diimpor otomatis**. Arsipkan kedua lokasi secara terenkripsi sebelum upgrade. Jika ada data nyata, lakukan migrasi tervalidasi di staging terlebih dahulu, pertahankan ID/scrypt hash/bookmark, validasi slug, reset role ke reader, lalu provision role operator. Jangan menyalin JSON tak tervalidasi langsung ke DB. Tidak ada data lama yang dihapus oleh patch ini.

## 3. Provisioning PostgreSQL (operator)

1. Sediakan managed PostgreSQL yang durable/HA sesuai anggaran, enkripsi at-rest, koneksi private/allowlist, TLS verifikasi sertifikat, monitoring disk/latency, backup/PITR. **Belum dilakukan dalam workspace ini.**
2. Gunakan role migrasi/owner terpisah. Export env secara aman, lalu `npm run db:migrate` memakai URL owner. Migrasi idempotent ada di `database/001-security.sql`.
3. Buat runtime role **LOGIN non-superuser, bukan table owner**, dengan password unik dari secret manager. Jangan reuse kredensial contoh/fixture CI. Contoh privilege, ganti nama role sesuai provisioning:

```sql
GRANT CONNECT ON DATABASE your_database TO your_runtime_role;
GRANT USAGE ON SCHEMA public TO your_runtime_role;
GRANT SELECT, INSERT, UPDATE ON app_documents TO your_runtime_role;
GRANT SELECT, INSERT ON security_audit TO your_runtime_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_runtime_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON security_limits, security_leases TO your_runtime_role;
```

Jangan grant UPDATE/DELETE/TRUNCATE/DDL pada audit ke runtime. Trigger menolak UPDATE/DELETE pada audit sebagai pertahanan tambahan, tetapi owner/superuser tetap bisa mengubah schema: akses owner harus dibatasi dan dicatat di provider. Ekspor audit ke penyimpanan immutable terpisah untuk ketahanan terhadap kompromi owner DB.

4. `DATABASE_URL` runtime menunjuk role ini. Untuk DB remote gunakan TLS verify-full dengan CA/provider configuration yang benar; jangan memakai `rejectUnauthorized:false`.
5. Pool maksimal 8 per instance; batasi jumlah instance agar total pool tidak melebihi kapasitas PostgreSQL. Driver memakai connection/statement timeout. Outage menghasilkan gagal tertutup (503/ditolak), bukan downgrade ke demo storage.
6. Schedule `npm run security:maintenance` tiap 5 menit dengan role operasional yang dapat menghapus limiter/lease expired. Alarm jika gagal. Tidak ada cron managed yang diprovision otomatis di repo.

## 4. Runtime dan ingress

Isi `.env.example` sebagai referensi; simpan nilai nyata di secret manager/deployment settings, **bukan Git**.

- `NEXTAUTH_SECRET`: random unik minimal 32 karakter (disarankan `openssl rand -hex 48`); stabil antar-instance/restart. Rotasi terkoordinasi mengeluarkan sesi lama. Jangan set AUTH_URL berbeda; jangan sisakan Clerk keys.
- `NEXTAUTH_URL`: origin HTTPS kanonis, tanpa userinfo/path/query/hash. `APP_TENANT_ID`: identitas newsroom tetap. `NEXT_PUBLIC_SITE_URL` harus sama dengan domain publik.
- Middleware menolak Host yang bukan origin kanonis. CDN/ingress harus meneruskan Host kanonis, menolak host palsu, dan tidak mempercayai forwarded headers dari klien. Preview domain dinamis production tidak otomatis di-allowlist; provision origin preview terpisah bila diperlukan.
- Mutating API memerlukan Origin **persis** kanonis, selain mekanisme CSRF Auth.js/Server Actions. Request tanpa Origin ditolak. Klien native/operator perlu mengirim Origin kanonis dan kredensial/token yang diwajibkan; Origin bukan autentikasi terhadap curl.
- Jangan menambah `Access-Control-Allow-Origin:*`/credential reflection di CDN. Same-origin browser clients tidak memerlukan header CORS.
- `TRUSTED_CLIENT_IP_HEADER` hanya boleh diset bila ingress **menghapus input klien dan mengisi ulang** header tersebut, dan origin tidak bisa diakses langsung melewati ingress. Tidak terkonfigurasi → satu bucket anonymous konservatif, bukan memakai XFF spoofable. Konsekuensinya banyak user dapat berbagi kuota; konfigurasi ingress wajib ditinjau sebelum trafik publik.
- Batas aplikasi: credentials 30/IP + 10/account per 15 menit; auth route 30 write/15 menit; default API 60/menit; komentar 10/IP + 10/user per menit; newsletter 10 write/jam/IP; CMS 30/actor/menit; push subscribe 10/menit; helpers 5/menit. Limiter fixed-window PostgreSQL dipakai semua instance. Tidak reset budget saat login berhasil.
- Raw JSON dibaca incremental dengan cap (analytics 8 KiB, newsletter 2 KiB, push 4 KiB, auth form 8 KiB). Content-Length bukan satu-satunya pemeriksaan. Bentuk `null`/array/malformed ditolak 400, ukuran berlebih 413, media type salah 415. Read timeout 10 detik; tetap perlu deadline/connection caps proxy untuk slow clients sebelum route berjalan.
- Server Actions: framework body cap 128 KiB + pemeriksaan form server. SSE: maksimal 3/client, 100/newsroom, lease shared 120 detik, stream maksimal 90 detik, cleanup abort/cancel. Sesuaikan reverse proxy timeout >90 detik atau gunakan polling.
- Terapkan TLS, edge request size/rate/connection caps, body read timeout, WAF/bot controls dan DDoS protection. Kontrol aplikasi tidak menggantikan network-layer protection.
- Service worker tidak lagi menyimpan/replay mutasi atau cache API; queue lama dihapus agar request akun A tidak direplay sebagai akun B. Cache pribadi disetel no-store termasuk secure/chunked session cookies.
- Sentry replay dimatikan, `sendDefaultPii:false`, sanitizer event/breadcrumb/transaction aktif; log aplikasi hanya event code generik. Redaction regex adalah defense-in-depth, bukan jaminan semua teks bebas secret: jangan memasukkan credential ke pesan/konten. Batasi akses/retensi Sentry dan log provider. Sentry build menghapus map setelah upload; verifikasi URL CDN dan akses artifact CI tetap diperlukan.

## 5. Backup owner dan service objectives

**Owner operasional yang wajib diisi oleh pemilik deployment (belum ditetapkan nama manusia di sesi ini):**

| Tanggung jawab | Penanggung jawab sebelum launch |
|---|---|
| Primary backup/restore | Named on-call operator di `BACKUP_OWNER` |
| Deputy / eskalasi | Tetapkan anggota kedua dalam jadwal on-call |
| Persetujuan integritas konten | Managing editor / product owner |
| Key custody / akses owner DB | Operator keamanan yang terpisah dari pemegang backup storage |

Usulan target **RPO ≤15 menit, RTO ≤60 menit**, disimpan sebagai `BACKUP_RPO_MINUTES=15`, `BACKUP_RTO_MINUTES=60`. Ini target yang harus disetujui/diukur pada ukuran produksi, **bukan hasil drill kecil**. `security:preflight` menolak owner kosong/TODO dan RPO/RTO tak valid.

- Aktifkan provider PITR dan base backup, off-site copy/encrypted object storage, retention (usulan 7 hari snapshot + 30 hari PITR, sesuaikan legal/privacy), versioning/immutability dan alert bila backup terakhir melebihi RPO.
- Snapshot aplikasi tambahan memakai AES-256-GCM, key 32 random byte hex via `BACKUP_ENCRYPTION_KEY`; simpan key di secret manager terpisah. Tidak boleh menyalin key ke chat/log/Git atau menyimpannya bersama file backup.
- `BACKUP_DATABASE_URL` role read-only untuk tabel documents/audit; `BACKUP_DIR` direktori operator mode terbatas. `npm run backup:create` menghasilkan file `.backup.enc` mode 0600, tidak pernah file JSON plaintext. Transfer ke storage privat off-site sesudah sukses; scheduler/transfer belum diprovision oleh repo.
- Snapshot konsisten memakai repeatable-read transaction, mencakup documents tenant dan audit berurutan. Limiter/lease transient tidak direstore. Batas snapshot 256 MiB; untuk data lebih besar gunakan native/provider backup dengan prosedur restore tervalidasi, bukan memaksa aplikasi memuat semua data ke RAM.
- Source trusted MDX dan migration schema dipulihkan dari commit Git yang sama. Sanity/private assets, secret manager, DNS/ingress dan provider configs perlu backup terpisah. Snapshot aplikasi bukan full disaster recovery semua layanan.

## 6. Restore drill (target TERPISAH dan kosong)

1. Catat operator, waktu awal, commit/schema, snapshot timestamp, RPO/RTO target. Jangan matikan/hapus data live untuk menguji restore.
2. Provision database terisolasi baru; jalankan schema migration yang sama. Gunakan `RESTORE_DATABASE_URL` untuk target, **bukan** URL source/live. Tidak boleh ada documents/audit di target.
3. Pada terminal operator dengan secret manager injection: set `APP_TENANT_ID`, key yang benar, `RESTORE_DATABASE_URL`, dan `CONFIRM_EMPTY_RESTORE=yes`; jalankan `npm run backup:restore -- /private/path/snapshot.backup.enc`. CLI menolak URL source/live yang sama, tenant mismatch dan target tidak kosong. Jangan mengandalkan pemeriksaan URL saja bila ada alias DNS: isolasi permission/network wajib.
4. Dekripsi/authentication GCM dan schema snapshot selesai sebelum write. Restore atomic dalam transaksi dengan exclusive lock. Audit dipulihkan sebagai insert event dengan actor/action/target/timestamp, bukan update/delete trail lama. Tabel schema/grants harus sudah tersedia; app pool tetap dimatikan saat restore.
5. Jalankan aplikasi staging memakai target, lakukan login password, baca bookmark/preferensi/komentar, validasi ownership/role/tenant, cek artikel published dan jumlah/urutan audit. Uji rejected write untuk akun lain. Verifikasi wrong key/tamper ditolak.
6. Ukur RTO sampai aplikasi usable dan RPO dari snapshot terakhir ke waktu insiden simulasi. Simpan laporan tanpa PII/secret, minta sign-off managing editor. Restore bulanan dan setelah perubahan schema/storage; uji provider PITR/base backup juga, bukan hanya snapshot aplikasi.
7. Hapus fixture dan revoke kredensial sementara setelah bukti aman disimpan. Perubahan endpoint produksi saat insiden harus melalui approval, bukan dilakukan otomatis oleh drill.

## 7. Bukti lokal dan gate rilis

Perintah reproducible:

```sh
npm ci --legacy-peer-deps
npm run lint
npx tsc --noEmit
npm test
npm run build
npm run test:security -- --http
npm run audit:ci
# Dengan konfigurasi produksi nyata, role least privilege, owner dan RPO/RTO:
npm run security:preflight
```

`test:security` menjalankan PostgreSQL native terisolasi (bundled dev dependency), dua proses Node terpisah untuk limiter/concurrent writes, pemeriksaan role/state, tenant, audit immutable, backup terenkripsi dan restore ke DB baru. `--http` juga menjalankan build Next produksi dengan DB role non-superuser dan menguji credentials session nyata, cookie secure, dua akun, stats 401/403/200, input 400/413, CSRF 403, Host 421 dan CORS deny. Ini **bukan penetration test browser/CDN produksi**. Jika install memakai `--ignore-scripts`, hydrate symlink binari test dengan `npm rebuild @embedded-postgres/linux-x64 --ignore-scripts=false` pada Linux x64.

CI kini mewajibkan lint, unit tests, build, dan integration/restore regression sebelum deploy; Playwright smoke memakai DB runtime fixture non-superuser. Pengaturan required branch checks di GitHub tetap harus dikonfigurasi maintainer. Advisory dependency lama yang di-allowlist tetap ada; PASS audit gate bukan zero-vulnerability.

**Belum terselesaikan oleh patch:** provisioning DB/secret manager/cron/PITR, owner manusia dan deputy, migrasi data nyata lama, restore ukuran produksi dan penandatanganan RPO/RTO, validasi browser/TLS/CDN asli, MFA/breach-password service, checkout/payment/webhook/entitlement, integrasi indeks artikel CMS baru dan durable live publishing. Jangan mengklaim semuanya siap live hanya karena test lokal hijau.
