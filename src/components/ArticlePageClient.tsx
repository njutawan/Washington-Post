'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReading } from '@/components/ReadingProvider';
import { estimateRemaining, countWords } from '@/lib/useReadingState';
import { useReadingProgress } from '@/lib/useReadingProgress';
import ReadingProgressBar from './ReadingProgressBar';
import ShareSheet from './ShareSheet';
import BookmarkButton from './BookmarkButton';
import { ClockIcon } from './Icons';
import type { Article } from '@/lib/data';

type Props = {
  article: Article;
  /** Rendered article body + comments + related (children of the PaywallGate). */
  children: React.ReactNode;
};

/**
 * Wraps the article body in the client-side features: reading progress bar,
 * history/visit recording, remaining-time estimate, ShareSheet, and progress
 * persistence. This is split out from the server-rendered ArticlePage so the
 * rest of the page stays RSC.
 */
export default function ArticlePageClient({ article, children }: Props) {
  const { recordVisit, updateProgress, getProgress } = useReading();
  const [savedFlash, setSavedFlash] = useState(false);

  const totalWords = useMemo(() => {
    // Approximate: headline + dek + body paragraphs (we don't have body text
    // in the client, so estimate from readTime if available; otherwise ~900 words).
    if (article.readTime) {
      const m = article.readTime.match(/(\d+)/);
      if (m) return parseInt(m[1], 10) * 220;
    }
    return countWords(
      [article.title, article.dek, article.pullQuote].filter(Boolean).join(' '),
    ) + 900;
  }, [article]);

  const progress = useReadingProgress({
    selector: 'article',
    onProgress: (pct) => updateProgress(article.slug, pct),
  });

  // Record a history entry once the user has spent 3s on the page OR scrolled
  // past 5% (avoid counting bounces).
  useEffect(() => {
    let done = false;
    const record = () => {
      if (done) return;
      done = true;
      recordVisit({
        slug: article.slug,
        title: article.title,
        section: article.category,
        image: article.image,
        readTime: article.readTime,
      });
    };
    const timer = setTimeout(record, 4000);
    const onScroll = () => {
      if (window.scrollY > 300) record();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [article.slug, article.title, article.category, article.image, article.readTime, recordVisit]);

  const startingProgress = getProgress(article.slug);
  const remaining = estimateRemaining(totalWords, progress || startingProgress);

  return (
    <>
      <ReadingProgressBar progress={progress} />
      {children}
      {/* Floating "X min left" pill that sticks to the side */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
        <div className="bg-wp-black text-white text-[11px] font-sans font-bold uppercase tracking-wider px-3 py-2 shadow-lg flex items-center gap-2">
          <ClockIcon className="w-3.5 h-3.5" />
          {remaining}
        </div>
      </div>
      {savedFlash && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-wp-green text-white px-4 py-2 text-xs font-sans font-bold uppercase tracking-wider shadow-lg animate-slide-in">
          Saved to your account
        </div>
      )}
    </>
  );
}

// Share + bookmark widgets that need client state (exported so the server
// page can drop them in, replacing the old static buttons).
export function ArticleActions({ article }: { article: Article }) {
  return (
    <div className="flex items-center gap-2">
      <BookmarkButton slug={article.slug} />
      <ShareSheet url={`/article/${article.slug}`} title={article.title} text={article.dek} />
    </div>
  );
}

export function ArticleHeaderActions({ article }: { article: Article }) {
  return (
    <div className="flex items-center gap-2 mt-3">
      <button className="flex items-center gap-1 px-4 py-2.5 bg-wp-black text-white text-[11px] font-sans font-bold uppercase tracking-wider hover:bg-wp-red transition tap-target">
        Follow
      </button>
      <BookmarkButton slug={article.slug} />
      <ShareSheet url={`/article/${article.slug}`} title={article.title} text={article.dek} />
      <button className="hidden sm:inline text-[11px] font-sans uppercase tracking-wider text-wp-gray hover:text-wp-black ml-2 px-2 py-2 tap-target">
        Gift Article
      </button>
    </div>
  );
}
