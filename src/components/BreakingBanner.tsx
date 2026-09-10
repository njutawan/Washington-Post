'use client';

import { useEffect, useState } from 'react';
import { CloseIcon } from './Icons';

const KEY = 'wapo_breaking_dismissed_v1';

type Banner = {
  id: string;
  /** HTML-free plain text for the urgent line */
  headline: string;
  /** Optional link to a live blog or article */
  href?: string;
  /** Optional tag override, default "BREAKING" */
  tag?: string;
};

// The currently-featured breaking banner. Update id when news changes so it
// re-surfaces even after dismissal of prior items.
const BANNER: Banner = {
  id: 'shutdown-2026-09-10-1200',
  tag: 'BREAKING',
  headline:
    'House passes short-term spending bill, sending it to the Senate as midnight shutdown deadline looms — follow live updates.',
  href: '/live/shutdown-countdown',
};

/**
 * Full-width dismissible red breaking-news bar that sits ABOVE the masthead
 * (stacked directly above the LiveTicker). After the user dismisses it, the
 * banner stays hidden for the given banner id (so new stories re-surface).
 */
export default function BreakingBanner() {
  // Render visible on first paint so SSR/first paint never hides the banner.
  // On mount, check localStorage; if user has dismissed THIS banner id, hide.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    try {
      const dismissed = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, number>;
      if (dismissed[BANNER.id]) setVisible(false);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, number>;
      raw[BANNER.id] = Date.now();
      localStorage.setItem(KEY, JSON.stringify(raw));
    } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  const Tag = BANNER.href ? 'a' : 'div';

  return (
    <div
      className="bg-wp-red text-white border-b-4 border-black relative"
      role="alert"
      aria-live="assertive"
    >
      <div className="wp-container !max-w-none px-3 sm:px-6 py-2.5 flex items-start md:items-center gap-3">
        <span className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="hidden sm:inline font-sans font-black uppercase text-[11px] tracking-[0.2em] whitespace-nowrap">
            {BANNER.tag || 'BREAKING'}
          </span>
        </span>

        <Tag
          href={BANNER.href}
          className="flex-1 min-w-0 font-sans font-bold text-sm md:text-base leading-snug hover:underline"
        >
          {BANNER.headline}
        </Tag>

        <button
          onClick={dismiss}
          aria-label="Dismiss breaking news"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-black/20 rounded tap-target"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
