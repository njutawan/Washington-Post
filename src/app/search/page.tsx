'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchIcon } from '@/components/Icons';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import ArticleImage from '@/components/ArticleImage';
import { getAllArticles, columnists, type Article } from '@/lib/data';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'stories', label: 'Stories' },
  { id: 'video', label: 'Video' },
  { id: 'photos', label: 'Photos' },
  { id: 'opinions', label: 'Opinions' },
] as const;
type TabId = typeof TABS[number]['id'];

const DATE_OPTIONS = [
  { id: 'any', label: 'Any time' },
  { id: 'day', label: 'Past 24 hours' },
  { id: 'week', label: 'Past week' },
  { id: 'month', label: 'Past month' },
  { id: 'year', label: 'Past year' },
] as const;
type DateId = typeof DATE_OPTIONS[number]['id'];

type SearchHit = Article & { _score?: number; _matched?: 'title' | 'dek' | 'body' | 'byline' };

const fuseOpts = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'dek', weight: 2 },
    { name: 'category', weight: 1.5 },
    { name: 'byline', weight: 1 },
    { name: 'kicker', weight: 1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  minMatchCharLength: 2,
};

/**
 * Normalize the "time" string ("3 hours ago", "1 day ago", "12 minutes ago"…)
 * into approximate age in hours. Used for date filtering.
 */
function ageHours(time?: string): number {
  if (!time) return 100_000;
  const t = time.toLowerCase();
  const m = t.match(/(\d+)\s*(minute|min|hour|hr|day|week|month|year)s?/);
  if (!m) return 100_000;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  if (unit.startsWith('min')) return n / 60;
  if (unit.startsWith('hour') || unit.startsWith('hr')) return n;
  if (unit.startsWith('day')) return n * 24;
  if (unit.startsWith('week')) return n * 24 * 7;
  if (unit.startsWith('month')) return n * 24 * 30;
  if (unit.startsWith('year')) return n * 24 * 365;
  return 100_000;
}

function matchesTab(a: Article, tab: TabId): boolean {
  if (tab === 'all') return true;
  if (tab === 'stories') return !a.opinion;
  if (tab === 'opinions') return Boolean(a.opinion);
  if (tab === 'video') {
    // Heuristic: kicker "Visual Investigation" / "Video" / headline containing "video"
    return /video|watch|visual/i.test(`${a.kicker || ''} ${a.title}`);
  }
  if (tab === 'photos') {
    return /photo|in focus|gallery|images/i.test(`${a.kicker || ''} ${a.title}`) || Boolean(a.image);
  }
  return true;
}

function withinDate(a: Article, date: DateId): boolean {
  if (date === 'any') return true;
  const h = ageHours(a.time);
  if (date === 'day') return h <= 24;
  if (date === 'week') return h <= 24 * 7;
  if (date === 'month') return h <= 24 * 31;
  if (date === 'year') return h <= 24 * 365;
  return true;
}

function SearchInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = (params.get('q') || '').trim();
  const initialTab = ((params.get('type') as TabId) || 'all');
  const initialDate = ((params.get('date') as DateId) || 'any');

  const [input, setInput] = useState(initialQ);
  const [query, setQuery] = useState(initialQ);
  const [tab, setTab] = useState<TabId>(TABS.find((t) => t.id === initialTab) ? initialTab : 'all');
  const [date, setDate] = useState<DateId>(DATE_OPTIONS.find((d) => d.id === initialDate) ? initialDate : 'any');
  const [fuse, setFuse] = useState<{ search: (q: string) => Array<{ item: Article; score?: number }> } | null>(null);
  const [page, setPage] = useState(0);
  const PAGE = 10;

  const allArticles = useMemo(() => getAllArticles(), []);

  useEffect(() => {
    setInput(initialQ); setQuery(initialQ); setPage(0);
  }, [initialQ]);
  useEffect(() => { setPage(0); }, [tab, date]);

  // Lazy-load Fuse.js
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (fuse) return;
      if (query.length < 2 && !initialQ) return;
      const mod = await import(/* webpackChunkName: "fuse" */ 'fuse.js');
      if (cancelled) return;
      setFuse(new mod.default(allArticles, fuseOpts));
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, initialQ]);

  const results: SearchHit[] = useMemo(() => {
    const q = query.trim();
    let hits: SearchHit[];
    if (!q) {
      hits = allArticles.slice(0, 30);
    } else if (fuse) {
      hits = fuse.search(q).map((r, i) => ({ ...r.item, _score: r.score, _matched: 'title' as const }));
      if (hits.length === 0) {
        // Substring fallback
        const lower = q.toLowerCase();
        hits = allArticles.filter((a) =>
          a.title.toLowerCase().includes(lower) ||
          (a.dek || '').toLowerCase().includes(lower) ||
          (a.category || '').toLowerCase().includes(lower) ||
          (a.byline || '').toLowerCase().includes(lower),
        );
      }
    } else {
      const lower = q.toLowerCase();
      hits = allArticles.filter((a) =>
        a.title.toLowerCase().includes(lower) ||
        (a.dek || '').toLowerCase().includes(lower) ||
        (a.category || '').toLowerCase().includes(lower) ||
        (a.byline || '').toLowerCase().includes(lower),
      );
    }
    return hits
      .filter((a) => matchesTab(a, tab))
      .filter((a) => withinDate(a, date))
      .slice(0, 60);
  }, [query, fuse, allArticles, tab, date]);

  const visible = results.slice(0, (page + 1) * PAGE);

  const apply = (patch: { q?: string; type?: TabId; date?: DateId }) => {
    const url = new URL('/search', window.location.origin);
    const q = patch.q ?? query;
    const t = patch.type ?? tab;
    const d = patch.date ?? date;
    if (q) url.searchParams.set('q', q);
    if (t && t !== 'all') url.searchParams.set('type', t);
    if (d && d !== 'any') url.searchParams.set('date', d);
    router.push(url.pathname + url.search, { scroll: false });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    apply({ q: input });
    setQuery(input);
  };

  const didYouMean = useMemo(() => {
    if (!query || fuse || results.length > 0) return null;
    // Tiny typo hint: check if a known columnist/term matches within edit distance.
    const lower = query.toLowerCase();
    const name = columnists.find((c) => c.name.toLowerCase().includes(lower.slice(0, 3)));
    return name ? name.name : null;
  }, [query, fuse, results.length]);

  const suggestions = ['Government shutdown', 'Election 2026', 'Federal Reserve', 'NFL', 'Oil prices', 'Artificial Intelligence'];

  return (
    <>
      <div className="mb-6">
        <p className="kicker text-wp-red mb-3">Search</p>
        <form onSubmit={onSubmit} className="flex items-center border-b-2 border-wp-black">
          <SearchIcon className="w-5 h-5 text-wp-gray" aria-hidden="true" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search stories, topics, writers, video…"
            className="flex-1 bg-transparent px-3 py-3 text-lg font-serif outline-none placeholder:text-wp-gray"
            autoFocus
            aria-label="Search query"
          />
          <button type="submit" className="px-4 py-2 bg-wp-black text-white font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition">
            Search
          </button>
        </form>
      </div>

      {/* Filter row: tabs + date */}
      {query && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6 pb-3 border-b border-wp-border">
          <div role="tablist" aria-label="Search filters" className="flex gap-1 overflow-x-auto no-scrollbar">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => { setTab(t.id); apply({ type: t.id }); }}
                className={
                  'px-3 py-1.5 text-xs font-sans font-bold uppercase tracking-wider whitespace-nowrap transition ' +
                  (tab === t.id
                    ? 'bg-wp-black text-white'
                    : 'text-wp-gray hover:text-wp-black border border-transparent hover:border-wp-border')
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-wp-gray">
            <span>Date</span>
            <select
              value={date}
              onChange={(e) => { const d = e.target.value as DateId; setDate(d); apply({ date: d }); }}
              className="border border-wp-border bg-white px-2 py-1 text-wp-black text-xs font-sans normal-case tracking-normal tap-target"
            >
              {DATE_OPTIONS.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {query ? (
        <>
          <p className="byline mb-6 text-sm">
            <span className="font-bold">{results.length}</span> result{results.length !== 1 ? 's' : ''} for{' '}
            <span className="font-bold italic">&ldquo;{query}&rdquo;</span>
            {tab !== 'all' && <span className="ml-1">in <span className="font-bold">{TABS.find((t) => t.id === tab)?.label}</span></span>}
            {date !== 'any' && <span className="ml-1">· {DATE_OPTIONS.find((d) => d.id === date)?.label}</span>}
            {results.length === 0 && didYouMean && (
              <>
                {' — '}did you mean{' '}
                <Link href={`/search?q=${encodeURIComponent(didYouMean)}`} className="text-wp-link underline font-bold">{didYouMean}</Link>?
              </>
            )}
          </p>

          {visible.length > 0 ? (
            <ul className="divide-y divide-wp-border border-t-2 border-b border-wp-black">
              {visible.map((a) => (
                <li key={a.id} className="py-5">
                  <Link href={`/article/${a.slug}`} className="group block">
                    <div className="flex gap-4">
                      {a.image && (
                        <div className="hidden sm:block w-36 h-24 flex-shrink-0 overflow-hidden bg-wp-light relative">
                          <ArticleImage
                            src={a.image}
                            alt={a.title}
                            fill
                            sizes="144px"
                            className="object-cover group-hover:opacity-95 transition"
                          />
                          {/video|watch/i.test(`${a.kicker || ''} ${a.title}`) && (
                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] font-sans font-bold px-1.5 py-0.5 uppercase">Video</span>
                          )}
                        </div>
                      )}
                      <div className="flex-1">
                        {a.category && <div className="kicker text-wp-red mb-1">{a.category}</div>}
                        <h3 className="headline text-xl md:text-2xl mb-1 group-hover:text-wp-link leading-tight">{a.title}</h3>
                        {a.dek && <p className="dek text-sm md:text-base mb-2">{a.dek}</p>}
                        {(a.byline || a.time) && (
                          <div className="byline flex items-center gap-2 text-xs">
                            {a.byline && <span>{a.byline}</span>}
                            {a.time && <span>· {a.time}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <p className="font-sans text-wp-gray mb-4 italic">No results match your filters.</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((t) => (
                  <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="topic-chip">{t}</Link>
                ))}
              </div>
            </div>
          )}

          {visible.length < results.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-2 border-2 border-wp-black font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition"
              >
                Load more results
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="border-t-2 border-wp-black pt-8">
          <h2 className="headline text-xl mb-4">Trending searches</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {suggestions.map((term) => (
              <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} className="topic-chip">{term}</Link>
            ))}
          </div>
          <h2 className="headline text-xl mb-4">Search tips</h2>
          <ul className="space-y-2 text-sm font-sans text-wp-ink max-w-xl">
            <li>• Try full names or exact phrases (e.g., &ldquo;Mike Johnson&rdquo;).</li>
            <li>• Our search is fuzzy — small typos are forgiven.</li>
            <li>• Use the tabs above to narrow by Stories / Video / Photos / Opinions.</li>
            <li>• Filter by date to see recent coverage.</li>
          </ul>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6">
        <Suspense fallback={<div role="status" className="p-8 font-sans text-wp-gray">Loading…</div>}>
          <SearchInner />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

