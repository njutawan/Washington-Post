import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo';

export const runtime = 'edge';
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/search', '/editorial/', '/api/live/publish', '/account', '/bookmarks'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: absoluteUrl('/'),
  };
}
