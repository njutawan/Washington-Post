'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { getAllArticles, type Article } from '@/lib/data';
import { ArticleCard } from '@/components/ArticleCard';
import { BookmarkIcon } from '@/components/Icons';

const KEY = 'wapo_bookmarks_v1';

export default function BookmarksPage() {
  const [slugs, setSlugs] = useState<string[] | null>(null);
  const [savedArticles, setSavedArticles] = useState<Article[]>([]);

  useEffect(() => {
    function readSlugs(): string[] {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : [];
      } catch {
        return [];
      }
    }
    const list = readSlugs();
    setSlugs(list);
    const bySlug = new Map(getAllArticles().map((a) => [a.slug, a]));
    setSavedArticles(list.map((s) => bySlug.get(s)).filter(Boolean) as Article[]);

    function onStorage() {
      const next = readSlugs();
      setSlugs(next);
      const by = new Map(getAllArticles().map((a) => [a.slug, a]));
      setSavedArticles(next.map((s) => by.get(s)).filter(Boolean) as Article[]);
    }
    window.addEventListener('storage', onStorage);
    // Listen to in-app bookmark toggles from other tabs/components via storage event
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function remove(slug: string) {
    const next = (slugs || []).filter((s) => s !== slug);
    setSlugs(next);
    setSavedArticles((prev) => prev.filter((a) => a.slug !== slug));
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function clearAll() {
    if (!confirm('Remove all saved stories?')) return;
    setSlugs([]);
    setSavedArticles([]);
    try { localStorage.setItem(KEY, '[]'); } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6 md:py-10">
        <Breadcrumbs items={[{ label: 'Saved stories' }]} />

        <div className="border-b-4 border-wp-black pb-5 mb-6 md:mb-8">
          <div className="flex items-baseline justify-between gap-4 flex-wrap">
            <div>
              <p className="kicker text-wp-red mb-2">For you</p>
              <h1 className="masthead-title text-4xl md:text-6xl leading-none">Saved for later</h1>
              <p className="dek text-base mt-2 text-wp-gray max-w-2xl">
                Stories you bookmarked to read another time. Saved articles are
                stored on this device; subscribers get cross-device sync.
              </p>
            </div>
            {savedArticles.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-sans uppercase tracking-wider text-wp-gray hover:text-wp-red underline py-2 tap-target"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {slugs === null ? (
          <p className="byline">Loading saved stories…</p>
        ) : savedArticles.length === 0 ? (
          <div className="bg-white border-2 border-wp-black p-8 md:p-12 text-center max-w-2xl mx-auto">
            <BookmarkIcon className="w-10 h-10 mx-auto text-wp-gray mb-4" />
            <h2 className="headline text-2xl mb-2">No saved stories yet</h2>
            <p className="font-serif text-wp-ink mb-5 leading-relaxed">
              Tap the bookmark icon on any story to save it here. Great for
              commutes, long flights, or &ldquo;read later this weekend.&rdquo;
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className="border-2 border-wp-black px-5 py-2.5 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition tap-target">
                Browse today&rsquo;s paper
              </Link>
              <Link href="/signin" className="px-5 py-2.5 font-sans font-bold uppercase text-xs tracking-wider text-wp-link hover:underline tap-target">
                Sign in to sync across devices →
              </Link>
            </div>
          </div>
        ) : (
          <>
            <p className="byline mb-4">
              {savedArticles.length} saved article{savedArticles.length === 1 ? '' : 's'}
            </p>
            <div className="divide-y divide-wp-border">
              {savedArticles.map((a) => (
                <div key={a.id} className="py-5 relative">
                  <ArticleCard article={a} variant={a.image ? 'large' : 'small'} />
                  <button
                    onClick={() => remove(a.slug)}
                    className="absolute top-5 right-0 text-[11px] font-sans uppercase tracking-wider text-wp-gray hover:text-wp-red underline py-2 tap-target"
                    aria-label={`Remove ${a.title} from saved stories`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
