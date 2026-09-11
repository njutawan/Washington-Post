# Integrasi Context7

[Context7](https://github.com/upstash/context7) (Upstash) menyediakan dokumentasi
library yang **up-to-date dan spesifik versi** langsung ke prompt AI coding
assistant — menghilangkan contoh kode usang dan API halusinasi.

Proyek ini sudah dikonfigurasi agar Context7 bekerja *out of the box* di editor
yang mendukung MCP (Model Context Protocol). Tidak ada dependensi baru yang
di-install; yang ditambahkan hanyalah file konfigurasi.

## File yang ditambahkan

| File                          | Untuk                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| `.mcp.json`                   | Claude Code & client MCP umum (project-scoped)               |
| `.cursor/mcp.json`            | Cursor (Settings → Tools & MCP akan membaca otomatis)        |
| `.vscode/mcp.json`            | VS Code Copilot (MCP)                                        |
| `AGENTS.md`                   | Aturan agen lintas-alat (berisi aturan Context7)             |
| `CLAUDE.md`                   | Memuat `AGENTS.md` untuk Claude Code                         |
| `.cursor/rules/context7.mdc`  | Auto-attached rule untuk Cursor                              |

Semua konfigurasi memakai server remote resmi `https://mcp.context7.com/mcp`.
Tanpa API key, akses anonim tetap berfungsi dengan rate limit default.

## Cara pakai

1. Buka proyek di editor (Cursor / VS Code / Claude Code). Client akan
   menemukan server `context7` dari file konfigurasi di atas — setujui/enable
   saat diminta.
2. Di prompt, cukup tanya seperti biasa. Dengan rule yang terpasang, agen akan
   otomatis memakai Context7 untuk hal-hal terkait library/dokumentasi.
   Untuk memaksa secara eksplisit:

   ```txt
   Buat Next.js 15 route handler yang me-revalidate cache ISR tiap 10 menit. use context7
   ```

3. Jika sudah tahu library-nya, sebutkan ID-nya agar lebih cepat dan akurat:

   ```txt
   Bagaimana cara kerja generateStaticParams dengan dynamicParams? use library /vercel/next.js
   ```

Library yang relevan dengan stack proyek ini: Next.js (`/vercel/next.js`),
React, Tailwind CSS, Sentry, Auth.js/NextAuth, Vitest. Cari ID library lain
dengan `npx ctx7 library <nama> <query>`.

## Alternatif tanpa MCP: CLI `ctx7`

Jika agen/editor tidak mendukung MCP, Context7 tetap bisa dipakai lewat CLI
(Node.js ≥ 18, tidak perlu install permanen):

```bash
npx ctx7 library next.js "App Router ISR"   # cari library ID
npx ctx7 docs /vercel/next.js "route segment config revalidate"
```

Atau jalankan `npx ctx7 setup` untuk setup terpandu (OAuth + skill otomatis).

## API key (opsional, rate limit lebih tinggi)

1. Buat key gratis di <https://context7.com/dashboard>.
2. Tambahkan ke file konfigurasi editor sebagai header, mis. di
   `.cursor/mcp.json`:

   ```json
   { "mcpServers": { "context7": {
       "url": "https://mcp.context7.com/mcp",
       "headers": { "Authorization": "Bearer CONTEXT7_API_KEY" } } } }
   ```

   **Jangan commit API key ke repository.** File `.mcp.json*`, `.cursor/`,
   dan `.vscode/` ikut ter-commit sebagai konfigurasi bersama; bila ingin
   memakai key, taruh di konfigurasi *user-level* editor Anda
   (`~/.cursor/mcp.json`, `claude mcp add --scope user`, dsb.) atau simpan
   perubahan lokal tanpa di-commit (`git update-index --skip-worktree`).

## Referensi

- Repo: <https://github.com/upstash/context7>
- Dokumentasi client: <https://context7.com/docs/resources/all-clients>
- CLI: <https://context7.com/docs/clients/cli>
