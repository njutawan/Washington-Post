'use server';

// -----------------------------------------------------------------------------
// NewsAPI.org adapter with graceful fallback to local hardcoded data.
// Set NEWS_API_KEY in .env.local to enable real fetching. If no key is set,
// if the request fails, or if the response is malformed we fall back to the
// built-in curated articles so the site always renders.
// -----------------------------------------------------------------------------

import { getAllArticles, type Article } from './data';

type NewsAPIArticle = {
  title: string;
  description?: string;
  author?: string;
  source?: { id?: string; name?: string };
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
};

type NewsAPIResponse = {
  status: string;
  totalResults?: number;
  articles?: NewsAPIArticle[];
  message?: string;
};

const API_KEY = process.env.NEWS_API_KEY;
const BASE_URL = 'https://newsapi.org/v2';
const PAGE_SIZE = 12;

function timeAgo(publishedAt?: string): string {
  if (!publishedAt) return 'Recently';
  const diff = Date.now() - new Date(publishedAt).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function categoryToNewsAPIQ(cat?: string): string {
  const map: Record<string, string> = {
    Politics: 'politics US government congress white house',
    Business: 'business economy markets',
    Tech: 'technology AI silicon valley apple google microsoft',
    World: 'world news international',
    Sports: 'sports NFL MLB NBA soccer',
    Style: 'culture movies music arts entertainment',
    Food: 'food restaurants cooking',
    Travel: 'travel tourism vacations',
    'Well+Being': 'health wellness fitness science medicine',
    Climate: 'climate environment energy',
    'U.S. News': 'US news domestic',
  };
  return map[cat || ''] || 'news';
}

function mapArticle(a: NewsAPIArticle, idx: number, category?: string): Article {
  const slugBase = (a.title || 'story')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return {
    id: `newsapi-${idx}-${slugBase}`,
    slug: `live-${slugBase}-${idx}`,
    category: a.source?.name || category || 'News',
    categorySlug: 'us-news',
    title: a.title || 'Untitled',
    dek: a.description || '',
    byline: a.author ? `By ${a.author}` : a.source?.name ? `By ${a.source.name}` : undefined,
    time: timeAgo(a.publishedAt),
    readTime: `${Math.max(2, Math.round(((a.content?.split(' ').length || 200) / 250)))} min read`,
    image: a.urlToImage || undefined,
    body: a.content ? [a.content.replace(/\[\+\d+ chars\]$/, '')] : undefined,
  };
}

async function fetchNews(path: string, params: Record<string, string>): Promise<NewsAPIResponse | null> {
  if (!API_KEY) return null;
  const url = new URL(BASE_URL + path);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('pageSize', String(PAGE_SIZE));
  url.searchParams.set('language', 'en');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(url.toString(), { next: { revalidate: 300 }, signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = (await res.json()) as NewsAPIResponse;
    if (data.status !== 'ok') return null;
    return data;
  } catch {
    return null;
  }
}

export async function fetchTopHeadlines(category?: string): Promise<Article[]> {
  const q = categoryToNewsAPIQ(category);
  const data = await fetchNews('/top-headlines', { country: 'us', q });
  if (data?.articles?.length) {
    return data.articles
      .filter((a) => a.title && !a.title.includes('[Removed]'))
      .map((a, i) => mapArticle(a, i, category));
  }
  // Fallback: curated local articles (first 12)
  return getAllArticles().slice(0, PAGE_SIZE);
}

export async function fetchSearch(query: string): Promise<Article[]> {
  const data = await fetchNews('/everything', { q: query, sortBy: 'relevancy' });
  if (data?.articles?.length) {
    return data.articles
      .filter((a) => a.title && !a.title.includes('[Removed]'))
      .slice(0, 20)
      .map((a, i) => mapArticle(a, i));
  }
  return [];
}

export const isNewsAPIConfigured = Boolean(API_KEY);
