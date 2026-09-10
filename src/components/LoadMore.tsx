'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import type { Article } from '@/lib/data';
import { PAGE_SIZE } from '@/lib/data';
import { ArticleCard } from './ArticleCard';

/**
 * Load more list with both a "Load more" button AND an IntersectionObserver-
 * driven infinite-scroll sentinel. When the user scrolls within 200px of
 * the sentinel, another batch of articles is loaded automatically (mimicking
 * real WaPo behavior). The button remains for accessibility / keyboard users.
 */
export default function LoadMore({
  more,
  variant = 'small',
  batchSize = PAGE_SIZE,
}: {
  more: Article[];
  variant?: 'small' | 'medium';
  batchSize?: number;
}) {
  const [visible, setVisible] = useState(0);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const shown = more.slice(0, visible);
  const hasMore = visible < more.length;

  function loadMore() {
    if (!hasMore || isPending) return;
    startTransition(() => {
      setVisible((v) => Math.min(v + batchSize, more.length));
    });
  }

  // Infinite scroll: observe the sentinel div just above the "Load more"
  // button. Once it enters the viewport, load the next batch.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) loadMore();
        });
      },
      { rootMargin: '300px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isPending, more.length]);

  return (
    <>
      <div className="space-y-0" id="load-more-feed" aria-live="polite">
        {shown.map((a) => (
          <div key={a.id} className="pt-5 border-t border-wp-border first:border-t-0">
            <ArticleCard article={a} variant={variant} />
          </div>
        ))}
      </div>

      <div ref={sentinelRef} aria-hidden="true" />

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-wp-border pt-8">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="border-2 border-wp-black px-8 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-black hover:text-white transition disabled:opacity-50 tap-target"
          >
            {isPending ? 'Loading…' : `Load more (${more.length - visible} remaining)`}
          </button>
          <p className="text-[11px] font-sans uppercase tracking-wider text-wp-gray">
            Auto-loads as you scroll
          </p>
        </div>
      )}

      {!hasMore && visible > 0 && (
        <div className="mt-8 flex justify-center border-t border-wp-border pt-8">
          <p className="text-sm font-sans text-wp-gray italic">
            You&rsquo;ve reached the end of this list.
          </p>
        </div>
      )}
    </>
  );
}
