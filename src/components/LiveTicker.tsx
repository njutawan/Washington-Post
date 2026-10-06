'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { breakingNews } from '@/lib/data';

/**
 * Breaking/live news ticker that runs across the TOP of the masthead.
 * - Seamless CSS marquee using two duplicated tracks and a measured width
 *   (avoids the common "jitter when content is longer/shorter than 50%" bug).
 * - Pauses on hover and with an explicit pause button (reduced-motion aware).
 */
export default function LiveTicker() {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [paused, setPaused] = useState(false);

  // Measure the width of ONE copy of the content and set the animation
  // duration proportionally so speed is constant (~60px/sec) regardless of
  // how many items are in the ticker.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const first = el.firstElementChild as HTMLElement | null;
    if (!first) return;
    const w = first.offsetWidth;
    if (w > 0) {
      // Two copies; translate by -w to loop seamlessly.
      const duration = Math.max(20, w / 60);
      el.style.setProperty('--ticker-w', `-${w}px`);
      el.style.setProperty('--ticker-duration', `${duration}s`);
      el.classList.add('ticker-track-measured');
    }
  }, []);

  return (
    <div className="bg-wp-black text-white border-b-2 border-wp-red">
      <div className="wp-container flex items-stretch overflow-hidden px-0 !max-w-none">
        <div className="flex items-center gap-2 bg-wp-red text-white px-3 md:px-4 py-2 font-sans font-bold uppercase text-[10px] md:text-xs tracking-wider flex-shrink-0">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          <span className="hidden sm:inline">Breaking</span>
        </div>
        <div
          className="flex-1 overflow-hidden relative scroll-fade scroll-fade-dark"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div
            ref={trackRef}
            className={
              'ticker-track flex items-center whitespace-nowrap h-full py-2 ' +
              (paused ? 'ticker-paused' : '')
            }
            aria-live="off"
          >
            {/* Copy A */}
            <div className="flex items-center ticker-copy">
              {breakingNews.map((item) => (
                <span key={item.id} className="flex items-center pr-10">
                  <Link href={item.href} className="text-sm font-sans text-white hover:text-red-300 transition flex items-center gap-2">
                    {item.live && <span className="inline-block w-2 h-2 bg-wp-red rounded-full animate-pulse flex-shrink-0" aria-label="LIVE" />}
                    <span className="truncate max-w-[60ch]">{item.text}</span>
                  </Link>
                  <span className="text-wp-gray/40 ml-10" aria-hidden="true">•</span>
                </span>
              ))}
            </div>
            {/* Copy B — duplicate for seamless loop */}
            <div className="flex items-center ticker-copy" aria-hidden="true">
              {breakingNews.map((item) => (
                <span key={item.id} className="flex items-center pr-10">
                  <Link href={item.href} tabIndex={-1} className="text-sm font-sans text-white flex items-center gap-2 pointer-events-auto">
                    {item.live && <span className="inline-block w-2 h-2 bg-wp-red rounded-full animate-pulse flex-shrink-0" />}
                    <span className="truncate max-w-[60ch]">{item.text}</span>
                  </Link>
                  <span className="text-wp-gray/40 ml-10" aria-hidden="true">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="hidden md:flex items-center justify-center w-10 flex-shrink-0 border-l border-white/10 hover:bg-white/5 text-xs font-sans uppercase"
          aria-label={paused ? 'Resume ticker' : 'Pause ticker'}
          title={paused ? 'Resume' : 'Pause'}
        >
          {paused ? '▶' : '❚❚'}
        </button>
      </div>
    </div>
  );
}
