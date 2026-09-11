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
    /**
     * Dev-only: skip the server-side optimizer. When the dev server runs in an
     * environment with no outbound network (CI sandboxes, agent workspaces),
     * `/_next/image` cannot fetch remote hosts and 500s on every remote photo.
     * Letting the browser load the source URL directly keeps images working,
     * while production builds keep full optimization.
     */
    unoptimized: process.env.NODE_ENV !== 'production',
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
  async headers() {
    /**
     * Security headers.
     *
     * The hardening headers below are always on. The full CSP is applied in
     * production only so `next dev`'s HMR websockets and tooling are never
     * interfered with.
     *
     * CSP notes:
     *  - Next.js App Router inlines its RSC flight scripts, so `script-src`
     *    must keep 'unsafe-inline' here (per-request nonces are not
     *    supported for framework-injected scripts in Next 15). Everything
     *    else stays strict: no remote scripts except Clerk (when configured),
     *    no objects/plugins, self-only forms, clickjacking denied, and
     *    image/media/connect sources limited to the hosts the site actually
     *    uses (Unsplash/Picsum/LoremFlickr/Twitter/YouTube images, SoundHelix
     *    podcast audio, Sentry ingest, optional Plausible domain).
     */
    const always = {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    };

    const productionCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev",
      "style-src 'self' 'unsafe-inline'",
      // img.clerk.com serves user avatars; instance domains serve them too when
      // a custom frontend API is in play. Without these the CSP silently kills
      // every avatar in <UserButton/> / <Show when="signed-in">.
      "img-src 'self' data: blob: https://images.unsplash.com https://picsum.photos https://loremflickr.com https://i.ytimg.com https://pbs.twimg.com https://img.clerk.com https://*.clerk.com https://*.clerk.accounts.dev",
      "font-src 'self' data:",
      "media-src 'self' https://www.soundhelix.com",
      // wss:// is required for Clerk's realtime session syncing — an https://
      // source does NOT match a websocket handshake, so sessions would go stale.
      `connect-src 'self' https://www.soundhelix.com https://*.ingest.sentry.io https://*.clerk.com https://*.clerk.accounts.dev wss://*.clerk.com wss://*.clerk.accounts.dev${
        process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? ` https://${process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}` : ''
      }`,
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.youtube.com https://platform.twitter.com https://*.clerk.com https://*.clerk.accounts.dev",
      "worker-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

    const headers = [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: always['X-Content-Type-Options'] },
          { key: 'Referrer-Policy', value: always['Referrer-Policy'] },
          { key: 'X-Frame-Options', value: always['X-Frame-Options'] },
          { key: 'Permissions-Policy', value: always['Permissions-Policy'] },
          // Long-lived immutable hashed assets — belt-and-braces on top of
          // Next's own headers for /_next/static chunks.
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      headers[0].headers.push({ key: 'Content-Security-Policy', value: productionCsp });
    }

    return headers;
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
