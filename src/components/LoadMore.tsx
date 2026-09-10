'use client';

import { useState, useTransition } from 'react';
import type { Article } from '@/lib/data';
import { PAGE_SIZE } from '@/lib/data';
import { ArticleCard } from './ArticleCard';

/**
 * Client-side "Load more" button that reveals batches of articles.
 * Works for any initial list; you pass remaining articles as `more`.
 */
export default function LoadMore({ more, variant = 'small' }: { more: Article[]; variant?: 'small' | 'medium' }) {
  const [visible, setVisible] = useState(0);
  const [isPending, startTransition] = useTransition();
  const shown = more.slice(0, visible);
  const hasMore = visible < more.length;

  return (
    <>
      <div className="space-y-0">
        {shown.map((a) => (
          <div key={a.id} className="pt-5">
            <ArticleCard article={a} variant={variant} />
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex justify-center border-t border-wp-border pt-8">
          <button
            onClick={() => {
              startTransition(() => {
                setVisible((v) => Math.min(v + PAGE_SIZE, more.length));
              });
            }}
            disabled={isPending}
            className="border-2 border-wp-black px-8 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-black hover:text-white transition disabled:opacity-50"
          >
            {isPending ? 'Loading…' : `Load more (${more.length - visible} remaining)`}
          </button>
        </div>
      )}

      {!hasMore && visible > 0 && (
        <div className="mt-8 flex justify-center border-t border-wp-border pt-8">
          <p className="text-sm font-sans text-wp-gray italic">
            You\u2019ve reached the end of this list.
          </p>
        </div>
      )}
    </>
  );
}
