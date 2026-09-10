'use client';

import Link from 'next/link';
import { useReading } from '@/components/ReadingProvider';
import { HistoryIcon } from './Icons';

/**
 * Compact "Recently read" widget for the sidebar. Shows the 5 most recent
 * articles with a mini progress bar. Hidden when there's no history.
 */
export default function RecentlyReadRail({ limit = 5 }: { limit?: number }) {
  const { history, ready } = useReading();
  if (!ready || history.length === 0) return null;
  const recent = history.slice(0, limit);
  return (
    <section className="bg-white border-2 border-wp-black p-4">
      <div className="flex items-center gap-2 mb-3">
        <HistoryIcon className="w-4 h-4 text-wp-red" />
        <h3 className="headline text-lg">Recently read</h3>
      </div>
      <ul className="divide-y divide-wp-border">
        {recent.map((h) => (
          <li key={h.slug} className="py-2">
            <Link href={`/article/${h.slug}`} className="group block">
              <p className="dek text-sm group-hover:text-wp-link leading-snug line-clamp-2">
                {h.title || h.slug.replace(/-/g, ' ')}
              </p>
              {h.progress > 0.05 && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex-1 h-1 bg-wp-border rounded-sm overflow-hidden">
                    <span
                      className="block h-full bg-wp-red"
                      style={{ width: `${Math.round(h.progress * 100)}%` }}
                    />
                  </span>
                  <span className="byline text-[10px]">{Math.round(h.progress * 100)}%</span>
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/account#reading"
        className="block mt-3 text-center text-xs font-sans uppercase tracking-wider text-wp-link hover:underline tap-target py-1"
      >
        View all →
      </Link>
    </section>
  );
}
