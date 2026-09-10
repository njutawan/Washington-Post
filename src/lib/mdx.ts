/**
 * MDX article loader (Task 25).
 *
 * Loads articles from /content/articles/*.mdx via webpack's
 * `require.context` (build-time) and reads frontmatter with Node's `fs`
 * (server-only). `data.ts` accesses this module through an eval("require")
 * behind a server-environment check so webpack never bundles it into the
 * client graph.
 *
 * Articles live in /content/articles/[slug].mdx with frontmatter:
 *   ---
 *   title: ...
 *   dek: ...
 *   kicker: ...
 *   category: Politics
 *   categorySlug: politics
 *   byline: By ...
 *   authorSlug: ...
 *   image: https://...
 *   caption: ...
 *   credit: ...
 *   time: 3 hours ago
 *   readTime: 5 min read
 *   live: false
 *   publishedAt: 2026-09-10
 *   ---
 *
 * The compiled MDX default export becomes the article body component.
 * We merge results with the legacy in-memory data.ts articles so existing
 * stub articles still render while editors migrate content to .mdx.
 */
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import type { Article } from './data';
// We pull local articles via a private getter to break a circular import
// (data.ts → mdx.ts at getAllArticles, and mdx.ts → data.ts for types).
import { _LOCAL_ARTICLES_FOR_MDX } from './data';
const getLocalArticles = _LOCAL_ARTICLES_FOR_MDX;

const CONTENT_DIR = path.join(process.cwd(), 'content', 'articles');

type MdxSource = {
  default: React.ComponentType;
  frontmatter: Record<string, unknown>;
};

// Cache imported MDX modules between requests in dev/prod
const moduleCache = new Map<string, MdxSource>();
let frontmatterCache: Map<string, Omit<Article, 'body'>> | null = null;

function getSlugFromFilename(filename: string) {
  return filename.replace(/\.mdx?$/, '');
}

function listArticleFiles(): string[] {
  try {
    if (!fs.existsSync(CONTENT_DIR)) return [];
    return fs.readdirSync(CONTENT_DIR).filter((f) => /\.mdx?$/.test(f));
  } catch {
    return [];
  }
}

function readFrontmatter(slug: string): Omit<Article, 'body'> | null {
  try {
    const file = listArticleFiles().find((f) => getSlugFromFilename(f) === slug);
    if (!file) return null;
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const rt = readingTime(content);
    const meta: Record<string, unknown> = {
      id: slug,
      slug,
      title: String(data.title || slug),
      dek: data.dek ? String(data.dek) : undefined,
      kicker: data.kicker ? String(data.kicker) : undefined,
      category: data.category ? String(data.category) : undefined,
      categorySlug: data.categorySlug ? String(data.categorySlug) : data.category ? String(data.category).toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined,
      image: data.image ? String(data.image) : undefined,
      caption: data.caption ? String(data.caption) : undefined,
      credit: data.credit ? String(data.credit) : undefined,
      byline: data.byline ? String(data.byline) : undefined,
      time: data.time ? String(data.time) : 'Today',
      readTime: data.readTime ? String(data.readTime) : `${Math.max(1, Math.ceil(rt.minutes))} min read`,
      live: Boolean(data.live),
      pullQuote: data.pullQuote ? String(data.pullQuote) : undefined,
      wordCount: rt.words,
    };
    // Pass through any additional frontmatter fields (updatedAt, correction,
    // image2, videoUrl, topics, …) so pages/components can consume them.
    for (const [k, v] of Object.entries(data)) {
      if (!(k in meta)) meta[k] = v;
    }
    return meta as any;
  } catch {
    return null;
  }
}

async function loadMdxModule(slug: string): Promise<MdxSource | null> {
  if (moduleCache.has(slug)) return moduleCache.get(slug)!;
  try {
    // Use webpack's require.context so MDX files are bundled as their own
    // chunks at build time, keyed by './[slug].mdx' paths. Declaring the
    // type inline avoids needing @types/webpack globally.
    interface WebpackRequireContext {
      keys(): string[];
      (id: string): MdxSource;
    }
    const ctx = (require as unknown as {
      context: (path: string, deep: boolean, re: RegExp) => WebpackRequireContext;
    }).context('/content/articles', false, /\.mdx$/);
    const key = ctx.keys().find((k) => k.replace('./', '').replace(/\.mdx$/, '') === slug);
    if (!key) {
      console.error('[mdx] no MDX file matched slug=', slug, 'keys=', ctx.keys());
      return null;
    }
    const mod = ctx(key);
    if (!mod || typeof mod.default !== 'function') {
      console.error('[mdx] loaded module has no default export for slug=', slug, 'key=', key, mod);
      return null;
    }
    moduleCache.set(slug, mod);
    return mod;
  } catch (err) {
    console.error('[mdx] failed to import MDX for slug=', slug, err);
    return null;
  }
}

/** Walk the content/ folder (build-time-safe) and return frontmatter for all
 *  MDX articles. */
export function getAllMdxArticlesMeta(): Omit<Article, 'body'>[] {
  if (frontmatterCache) return Array.from(frontmatterCache.values());
  frontmatterCache = new Map();
  for (const file of listArticleFiles()) {
    const slug = getSlugFromFilename(file);
    const meta = readFrontmatter(slug);
    if (meta) frontmatterCache.set(slug, meta);
  }
  return Array.from(frontmatterCache.values());
}

export function getMdxArticleMeta(slug: string): Omit<Article, 'body'> | null {
  if (!frontmatterCache) getAllMdxArticlesMeta();
  return frontmatterCache?.get(slug) || readFrontmatter(slug);
}

export async function getMdxArticle(slug: string): Promise<(Omit<Article, 'body'> & { Content: React.ComponentType }) | null> {
  const meta = getMdxArticleMeta(slug);
  if (!meta) return null;
  const mod = await loadMdxModule(slug);
  if (!mod) return { ...meta, Content: () => null };
  return { ...meta, Content: mod.default };
}

/** Merge MDX articles with legacy local articles (MDX wins when slug matches) */
export function getAllArticlesMerged(): Article[] {
  const mdx = getAllMdxArticlesMeta();
  const mdxSlugs = new Set(mdx.map((a) => a.slug));
  const legacy = getLocalArticles().filter((a) => !mdxSlugs.has(a.slug));
  return [...mdx, ...legacy];
}

// Invalidate cache on module reload (dev HMR)
if (process.env.NODE_ENV !== 'production') {
  // noop — next HMR handles reloads via require.context
}
