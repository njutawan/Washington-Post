'use client';

import { theSeven } from '@/lib/data';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from './Icons';

export default function TheSeven() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((n: number) => {
    setActive(((n % theSeven.length) + theSeven.length) % theSeven.length);
  }, []);

  // Auto-advance every 7 seconds, pausing on hover or when paused state set
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setActive((i) => (i + 1) % theSeven.length);
    }, 7000);
    return () => clearInterval(t);
  }, [paused]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // only respond when focus is not in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') go(active + 1);
      if (e.key === 'ArrowLeft') go(active - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);

  const current = theSeven[active];

  return (
    <section
      className="border-y-2 border-wp-black bg-white my-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="The 7 developing stories"
    >
      <div className="max-w-[1280px] mx-auto">
        <div className="flex items-center justify-between px-4 py-2 border-b border-wp-border">
          <div className="flex items-center gap-3">
            <span className="masthead-title text-2xl text-wp-red">The 7</span>
            <div className="hidden sm:flex items-center gap-2 text-xs font-sans text-wp-gray">
              <span className="live-dot" />
              <span className="uppercase tracking-wider font-bold">Live</span>
              <span>· Developing stories we&rsquo;re following</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => go(active - 1)}
              aria-label="Previous story"
              className="w-11 h-11 border border-wp-border hover:bg-wp-black hover:text-white flex items-center justify-center"
            >
              <ChevronRightIcon className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => go(active + 1)}
              aria-label="Next story"
              className="w-11 h-11 border border-wp-border hover:bg-wp-black hover:text-white flex items-center justify-center"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Resume autoplay' : 'Pause autoplay'}
              className="w-11 h-11 border border-wp-border hover:bg-wp-black hover:text-white flex items-center justify-center text-xs font-sans"
              title={paused ? 'Resume' : 'Pause'}
            >
              {paused ? '▶' : '❚❚'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-wp-border flex">
          {theSeven.map((_, i) => (
            <div key={i} className="flex-1 h-full overflow-hidden">
              <div
                className={
                  'h-full bg-wp-red transition-all duration-300 ' +
                  (i < active ? 'w-full' : i === active ? (paused ? 'w-0' : 'w-full seven-progress') : 'w-0')
                }
                style={!paused && i === active ? { animation: 'sevenprog 7s linear forwards' } : undefined}
              />
            </div>
          ))}
        </div>
        <style jsx>{`
          @keyframes sevenprog { from { width: 0%; } to { width: 100%; } }
        `}</style>

        <div className="grid md:grid-cols-5 gap-0">
          {/* Featured story */}
          <div className="md:col-span-2 p-5 md:border-r border-wp-border">
            <div className="kicker text-wp-red flex items-center mb-2">
              {current.live && <span className="live-dot" />}
              {current.live ? 'Live Update' : `Story ${active + 1} of ${theSeven.length}`}
            </div>
            <h3 className="headline text-2xl md:text-3xl mb-3 hover:text-wp-link cursor-pointer leading-tight">
              <Link href={`/article/${current.slug}`}>{current.title}</Link>
            </h3>
            {(current.byline || current.time) && (
              <div className="byline flex items-center gap-2">
                {current.byline && <span>By {current.byline}</span>}
                {current.time && <span>· {current.time}</span>}
              </div>
            )}
            <p className="text-xs font-sans text-wp-gray mt-4 italic">
              Use ← and → keys to navigate
            </p>
          </div>

          {/* Numbered list */}
          <div className="md:col-span-3">
            <ul>
              {theSeven.map((item, i) => (
                <li key={item.id}>
                  <button
                    onClick={() => { setActive(i); setPaused(true); }}
                    onMouseEnter={() => setPaused(true)}
                    className={
                      'w-full text-left px-4 py-3 border-t md:border-t-0 md:border-l border-wp-border flex gap-3 items-start hover:bg-wp-light transition ' +
                      (i === active ? 'bg-wp-light' : '')
                    }
                    aria-current={i === active ? 'true' : undefined}
                  >
                    <span className={'seven-number w-8 text-center flex-shrink-0 ' + (i === active ? 'text-wp-red' : '')}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      {item.live && (
                        <div className="kicker text-wp-red flex items-center mb-0.5">
                          <span className="live-dot" /> LIVE
                        </div>
                      )}
                      <p className={
                        'headline text-sm md:text-base leading-snug ' +
                        (i === active ? 'font-black text-wp-red' : 'hover:text-wp-link')
                      }>
                        {item.title}
                      </p>
                      <p className="byline mt-0.5">{item.time}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
