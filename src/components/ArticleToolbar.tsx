'use client';

import { useEffect, useState } from 'react';
import BookmarkButton from './BookmarkButton';
import ShareSheet from './ShareSheet';
import type { Article } from '@/lib/data';

type Props = {
  article: Article;
  audio?: React.ReactNode;
};

/**
 * Sticky sub-toolbar that slides under the masthead once the reader scrolls
 * past the byline. Contains: gift, print, text-size, share, bookmark.
 */
export default function ArticleToolbar({ article, audio }: Props) {
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');

  useEffect(() => {
    const body = document.getElementById('article-body');
    if (!body) return;
    body.dataset.textSize = textSize;
  }, [textSize]);

  const cycleSize = () => {
    setTextSize((s) => (s === 'sm' ? 'md' : s === 'md' ? 'lg' : 'sm'));
  };

  return (
    <div className="article-toolbar-sticky hidden md:block">
      <div className="wp-container py-2 flex items-center justify-between gap-3 text-[11px] font-sans uppercase tracking-wider">
        <div className="flex items-center gap-4 min-w-0">
          <span className="font-bold text-wp-black truncate">
            {article.category || 'News'}
          </span>
          <span className="text-wp-gray truncate hidden lg:inline">
            {article.title.length > 70 ? article.title.slice(0, 70) + '…' : article.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {audio}
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="px-2 py-2 text-wp-gray hover:text-wp-black tap-target"
            aria-label="Print this article"
            title="Print"
          >
            Print
          </button>
          <button
            onClick={cycleSize}
            className="px-2 py-2 text-wp-gray hover:text-wp-black tap-target"
            aria-label={`Text size: ${textSize}`}
            title={`Text size (${textSize})`}
          >
            Text {textSize === 'sm' ? 'A' : textSize === 'md' ? 'A' : 'A'}
            <sub>{textSize === 'sm' ? '-' : textSize === 'lg' ? '+' : ''}</sub>
          </button>
          <a
            href="#"
            className="px-2 py-2 text-wp-gray hover:text-wp-black tap-target"
            aria-label="Gift this article"
            title="Gift article"
          >
            Gift
          </a>
          <BookmarkButton slug={article.slug} />
          <ShareSheet url={`/article/${article.slug}`} title={article.title} text={article.dek} />
        </div>
      </div>
    </div>
  );
}
