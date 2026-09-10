'use client';

import { useEffect, useRef, useState } from 'react';

type Options = {
  /** Selector for the main article content element to measure against. */
  selector?: string;
  /** Callback fired when progress changes (throttled). */
  onProgress?: (pct: number) => void;
  /** Update interval in ms while scrolling (default 200). */
  throttleMs?: number;
  /** Don't track if false. */
  enabled?: boolean;
};

/**
 * Track reading progress (0-1) of the main article by comparing the viewport's
 * scroll position to the top/bottom of the article element. Updates the URL
 * hash bar component and a ReadingProgressBar. Fires onProgress at most every
 * `throttleMs` while scrolling.
 */
export function useReadingProgress({
  selector = 'article',
  onProgress,
  throttleMs = 200,
  enabled = true,
}: Options = {}) {
  const [progress, setProgress] = useState(0);
  const lastFired = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      // When the article top is still below viewport: 0. When the article
      // bottom is above viewport bottom: 1.
      const articleTop = rect.top + window.scrollY;
      const articleBottom = articleTop + rect.height;
      const viewportBottom = window.scrollY + viewportH;
      const scrolledPast = viewportBottom - articleTop - viewportH * 0.2;
      const totalReadable = Math.max(1, articleBottom - articleTop - viewportH * 0.5);
      let pct = scrolledPast / totalReadable;
      pct = Math.max(0, Math.min(1, pct));
      setProgress(pct);
      const now = Date.now();
      if (onProgress && now - lastFired.current > (throttleMs || 200)) {
        lastFired.current = now;
        onProgress(pct);
      }
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        measure();
      });
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [selector, enabled, throttleMs, onProgress]);

  return progress;
}
