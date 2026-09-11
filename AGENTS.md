# AGENTS.md — Panduan untuk AI Coding Agents

File ini berisi instruksi untuk AI coding agents (Claude Code, Cursor, Codex,
opencode, Windsurf, dsb.) yang bekerja di repository ini.

## Tentang proyek

Washington Post clone — Next.js 15 (App Router) + React 18 + TypeScript strict,
Tailwind CSS 3, MDX (konten artikel di `content/articles/`), NextAuth v5 beta
(credentials + OAuth opsional), Sentry, Vitest, Playwright, Storybook.

## Perintah penting

```bash
npm run build     # validasi WAJIB setelah setiap perubahan (harus 0 error/warning)
npm test          # unit tests (Vitest)
npm run lint      # ESLint
npx tsc --noEmit  # type check strict
npm run dev       # dev server
```

## Aturan Context7

Proyek ini sudah dikonfigurasi dengan **Context7** (https://github.com/upstash/context7)
— server MCP yang mengambil dokumentasi library terkini, spesifik versi, langsung
dari sumbernya. Konfigurasi server tersedia di `.mcp.json`, `.cursor/mcp.json`,
dan `.vscode/mcp.json`.

**Always use Context7 when you need library/API documentation, code generation,
setup or configuration steps — without having to be explicitly asked.**

- Tambahkan `use context7` pada prompt untuk memaksa penggunaan.
- Jika sudah tahu library yang dituju, sebutkan Context7 library ID-nya agar
  langkah pencarian dilewati, mis. `use library /vercel/next.js`.
- Library yang paling sering dipakai di proyek ini: Next.js (`/vercel/next.js`),
  React, Tailwind CSS, Sentry, Auth.js/NextAuth, Vitest.
- Cara manual tanpa MCP: `npx ctx7 library <nama> <query>` untuk mencari ID,
  lalu `npx ctx7 docs <libraryId> <query>` untuk mengambil dokumentasi.

Detail lengkap: lihat `docs/context7.md`.

## Konvensi kode

- TypeScript strict — jangan tambahkan `any` tanpa alasan; jangan pakai
  `@ts-ignore` kecuali ada komentar justifikasi.
- Komponen server secara default; tambahkan `'use client'` hanya bila perlu.
- Jangan import modul server-only (`fs`, `src/lib/mdx.ts`) dari komponen klien.
- Komentar keamanan (CWE-…) di kode auth/API harus dipertahankan.
- Endpoint dev/test dilindungi `devOnlyGuard` — jangan buka tanpa token.
