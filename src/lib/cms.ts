/**
 * CMS adapter layer (Task 23 — Sanity integration).
 *
 * In production the site pulls articles, authors and sections from Sanity via
 * @sanity/client. The queries below use GROQ. If the following env vars are
 * not set (i.e. local dev without a Sanity project), the adapter falls back
 * to the static, built-in article data so the site keeps working offline.
 *
 * Required env vars (see .env.example):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_READ_TOKEN   (optional, for drafts/private datasets)
 */
import { createClient, type SanityClient } from '@sanity/client';
import { getAllArticles as getLocalArticles, type Article } from './data';

let _client: SanityClient | null | undefined = undefined;

function getClient(): SanityClient | null {
  if (_client !== undefined) return _client;
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
  if (!projectId || !dataset) {
    _client = null;
    return null;
  }
  _client = createClient({
    projectId,
    dataset,
    apiVersion: '2024-09-01',
    useCdn: true,
    perspective: 'published',
    token: process.env.SANITY_API_READ_TOKEN,
  });
  return _client;
}

const ARTICLE_PROJECTION = `{
  _id,
  "id": _id,
  "slug": slug.current,
  title,
  dek,
  kicker,
  category,
  "categorySlug": select(defined(categorySlug) => categorySlug.current, lower(category)),
  body,
  "image": image.asset->url,
  "caption": image.caption,
  "credit": image.credit,
  byline,
  "authorSlugs": authors[]->slug.current,
  time,
  readTime,
  live,
  "publishedAt": _createdAt,
  pullQuote
}`;

export async function fetchArticles(limit = 50): Promise<Article[]> {
  const c = getClient();
  if (!c) return getLocalArticles().slice(0, limit);
  try {
    const docs = await c.fetch<Array<Record<string, unknown>>>(
      `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) [0...$limit] ${ARTICLE_PROJECTION}`,
      { limit }
    );
    return docs.map(normalizeArticle);
  } catch (e) {
    console.warn('[cms] Sanity fetch failed, falling back to local data:', e);
    return getLocalArticles().slice(0, limit);
  }
}

export async function fetchArticleBySlug(slug: string): Promise<Article | null> {
  const c = getClient();
  if (!c) return getLocalArticles().find((a) => a.slug === slug) || null;
  try {
    const doc = await c.fetch<Record<string, unknown> | null>(
      `*[_type == "post" && slug.current == $slug][0] ${ARTICLE_PROJECTION}`,
      { slug }
    );
    return doc ? normalizeArticle(doc) : null;
  } catch (e) {
    console.warn('[cms] Sanity fetch by slug failed, falling back to local data:', e);
    return getLocalArticles().find((a) => a.slug === slug) || null;
  }
}

export function isSanityConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID && process.env.NEXT_PUBLIC_SANITY_DATASET);
}

function normalizeArticle(d: Record<string, unknown>): Article {
  // Map Sanity doc shape to the local Article interface. Missing fields fall
  // back to reasonable defaults so the rendering components don't crash.
  return {
    id: String(d._id || d.id || ''),
    slug: String(d.slug || ''),
    title: String(d.title || ''),
    dek: d.dek ? String(d.dek) : undefined,
    kicker: d.kicker ? String(d.kicker) : undefined,
    category: d.category ? String(d.category) : undefined,
    categorySlug: d.categorySlug ? String(d.categorySlug) : undefined,
    image: d.image ? String(d.image) : undefined,
    caption: d.caption ? String(d.caption) : undefined,
    credit: d.credit ? String(d.credit) : undefined,
    byline: d.byline ? String(d.byline) : undefined,
    time: d.time ? String(d.time) : 'Today',
    readTime: d.readTime ? String(d.readTime) : undefined,
    live: Boolean(d.live),
    pullQuote: d.pullQuote ? String(d.pullQuote) : undefined,
    body: Array.isArray(d.body) ? (d.body as string[]) : undefined,
    // The following fields aren't yet modeled in Sanity and fall back to defaults.
  } as Article;
}
