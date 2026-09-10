'use client';

import { useState } from 'react';
import { useReading } from '@/components/ReadingProvider';
import { BookmarkIcon } from './Icons';
import { track } from '@/lib/track';

export default function BookmarkButton({ slug, className = '', onToggle }: {
  slug: string;
  className?: string;
  /** Optional callback fired after toggle with the new saved state. */
  onToggle?: (saved: boolean) => void;
}) {
  const { isBookmarked, toggleBookmark, ready } = useReading();
  const saved = ready ? isBookmarked(slug) : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newVal = toggleBookmark(slug);
    setOptimistic(newVal);
    onToggle?.(newVal);
    track('bookmark_toggle', { props: { slug, added: newVal } });
  };

  // Optimistic update before ready (avoids flicker when returning to a page)
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const displayed = optimistic ?? saved;

  return (
    <button
      onClick={handleClick}
      aria-label={displayed ? 'Remove from saved' : 'Save article'}
      title={displayed ? 'Saved' : 'Save for later'}
      aria-pressed={displayed}
      className={
        'w-10 h-10 flex items-center justify-center rounded-full transition tap-target ' +
        (displayed ? 'bg-wp-red text-white hover:bg-wp-black' : 'hover:bg-wp-light') +
        ' ' + className
      }
    >
      <BookmarkIcon className="w-4 h-4" filled={displayed} />
    </button>
  );
}
