// This file sets Next.js config, wraps MDX, and wraps with Sentry's withSentryConfig.
// Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/

// @next/mdx exports the factory directly (CJS). Some rehype/remark plugins
// ship as ESM-only; require their default export when present.
const createMDX = require('@next/mdx');
const remarkFrontmatter = require('remark-frontmatter');
const remarkGfm = require('remark-gfm');
const rehypeSlug = require('rehype-slug');
const rehypeAutolinkHeadings = require('rehype-autolink-headings');
const _rf = remarkFrontmatter.default || remarkFrontmatter;
const _rg = remarkGfm.default || remarkGfm;
const _rs = rehypeSlug.default || rehypeSlug;
const _rah = rehypeAutolinkHeadings.default || rehypeAutolinkHeadings;

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'loremflickr.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 480, 640, 768, 828, 1080, 1200, 1440, 1920],
    imageSizes: [96, 128, 256, 384, 512, 768],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

// Wrap with MDX support.
// NOTE: we intentionally use Next.js's built-in `next-mdx-import-source-file`
// as the provider import source so MDX compiles as a React Server Component
// (no createContext at import time). @next/mdx auto-discovers
// `src/mdx-components.tsx` and wires useMDXComponents() into the compiled
// output.
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [_rf, _rg],
    rehypePlugins: [
      _rs,
      [_rah, { behavior: 'wrap', properties: { className: ['header-anchor'] } }],
    ],
    providerImportSource: 'next-mdx-import-source-file',
  },
});

// Wrap with Sentry (same as before)
let withSentry;
try {
  withSentry = require('@sentry/nextjs/config').withSentryConfig;
} catch {
  try {
    withSentry = require('@sentry/nextjs').withSentryConfig;
  } catch {
    withSentry = (c) => c;
  }
}

module.exports = withSentry(withMDX(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT || 'washington-post-clone',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
});
