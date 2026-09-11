import type { MetadataRoute } from 'next';
import { getAllArticles, topNav, subNav, getAllAuthors } from '@/lib/data';
import { absoluteUrl } from '@/lib/seo';

// No edge runtime: edge disables static generation for this route and
// getAllArticles() needs Node `fs` so all MDX articles appear in the sitemap.
export const dynamic = 'force-static';
export const revalidate = 600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'always', priority: 1 },
    { url: absoluteUrl('/opinions'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/games'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: absoluteUrl('/newsletters'), lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: absoluteUrl('/search'), lastModified: now, changeFrequency: 'weekly', priority: 0.3 },
  ];

  for (const s of [...topNav, ...subNav]) {
    if (s.slug === 'opinions') continue;
    base.push({
      url: absoluteUrl(`/${s.slug}`),
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.85,
    });
  }

  const articles = getAllArticles();
  for (const a of articles) {
    base.push({
      url: absoluteUrl(`/article/${a.slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  const authors = getAllAuthors();
  for (const author of authors) {
    base.push({
      url: absoluteUrl(`/author/${author.slug}`),
      lastModified: now,
      changeFrequency: author.isColumnist ? 'daily' : 'weekly',
      priority: author.isColumnist ? 0.7 : 0.4,
    });
  }

  return base;
}
