import type { MetadataRoute } from 'next';
import { getAllArticlesMerged } from '@/lib/mdx';
import { topNav, subNav, getAllAuthors } from '@/lib/data';
import { getAllVideos } from '@/lib/videoData';
import { LIVE_BLOG_CANONICAL_SLUGS } from '@/lib/liveData';
import { absoluteUrl, articleDateModified, articleDatePublished } from '@/lib/seo';

export const runtime = 'nodejs';
export const dynamic = 'force-static';
export const revalidate = 600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const base: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'always', priority: 1 },
    { url: absoluteUrl('/opinions'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: absoluteUrl('/video'), lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/podcasts'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: absoluteUrl('/games'), lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: absoluteUrl('/newsletters'), lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: absoluteUrl('/about'), lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
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

  // NOTE: getAllArticlesMerged (not getAllArticles) — the eval-require merge
  // inside getAllArticles() silently falls back to dateless legacy stubs in
  // bundled server routes; importing the MDX merge directly keeps real dates.
  const articles = getAllArticlesMerged();
  for (const a of articles) {
    const modified = articleDateModified(a);
    const published = articleDatePublished(a);
    base.push({
      url: absoluteUrl(`/article/${a.slug}`),
      lastModified: modified ? new Date(modified) : published ? new Date(published) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  for (const v of getAllVideos()) {
    base.push({
      url: absoluteUrl(`/video/${v.slug}`),
      lastModified: v.publishedAt ? new Date(v.publishedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  for (const slug of LIVE_BLOG_CANONICAL_SLUGS) {
    base.push({
      url: absoluteUrl(`/live/${slug}`),
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.9,
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
