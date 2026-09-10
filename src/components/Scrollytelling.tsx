'use client';

import { useEffect, useRef, useState } from 'react';
import ArticleImage from './ArticleImage';

export type ScrollStep = {
  /** Body copy to show when the step is active */
  text: string | React.ReactNode;
  kicker?: string;
  image?: string;
  imageAlt?: string;
  caption?: string;
  /** Named preset visual instead of a render function (keeps MDX serializable) */
  visual?: 'image' | 'vote-bar';
  /** Data consumed by preset visuals: vote numbers, chart values, etc. */
  data?: Record<string, number | string | boolean>;
  /** Optional fully custom render — used from TSX pages only. MDX cannot
   *  pass functions, so MDX authors must use the `visual` preset. */
  render?: (active: boolean, progress: number) => React.ReactNode;
};

type Props = {
  steps: ScrollStep[];
  title?: string;
  dek?: string;
};

/** Vote breakdown bar (Dem blue / GOP red) — used as the default preset for
 *  politics scrollytelling. */
function VoteBar({ dems = 0, gopYea = 0, gopNo = 0, final = false }: {
  dems?: number; gopYea?: number; gopNo?: number; final?: boolean;
}) {
  const total = Math.max(dems + gopYea + gopNo, 1);
  const demPct = (dems / total) * 100;
  const yeaPct = (gopYea / total) * 100;
  const noPct = (gopNo / total) * 100;
  return (
    <div className="w-full h-full flex flex-col justify-center p-6 bg-white">
      <div className="mb-6">
        <p className="kicker text-wp-red text-xs mb-2 uppercase tracking-widest">House Vote</p>
        <p className="headline text-2xl leading-tight">
          {final ? 'Final: 312–102' : 'Counting votes…'}
        </p>
        <p className="text-sm font-sans text-wp-gray mt-1">218 needed to pass</p>
      </div>
      <div className="flex h-10 w-full rounded-sm overflow-hidden mb-6">
        <div className="bg-[#1a6ec5]" style={{ width: `${demPct}%` }} />
        <div className="bg-[#b40001]" style={{ width: `${yeaPct}%` }} />
        <div className="bg-wp-border" style={{ width: `${noPct}%` }} />
      </div>
      <ul className="space-y-2 text-sm font-sans">
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#1a6ec5] inline-block" />Democrats yes</span>
          <span className="font-bold">{dems}</span>
        </li>
        <li className="flex items-center justify-between">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#b40001] inline-block" />Republicans yes</span>
          <span className="font-bold">{gopYea}</span>
        </li>
        <li className="flex items-center justify-between text-wp-gray">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-wp-border inline-block" />No votes</span>
          <span className="font-bold">{gopNo}</span>
        </li>
      </ul>
    </div>
  );
}

function renderVisual(step: ScrollStep, active: boolean, progress: number) {
  if (step.render) return step.render(active, progress);
  if (step.visual === 'vote-bar') {
    const d = step.data || {};
    return (
      <VoteBar
        dems={Number(d.dems || 0)}
        gopYea={Number(d.gopYea || 0)}
        gopNo={Number(d.gopNo || 0)}
        final={Boolean(d.final)}
      />
    );
  }
  if (step.image) {
    return (
      <ArticleImage
        src={step.image}
        alt={step.imageAlt || ''}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-opacity duration-500"
      />
    );
  }
  return null;
}

/**
 * WaPo-style "scrollytelling" graphic: as the user scrolls through paragraphs
 * of text on the left, a sticky visual on the right updates.
 *
 * Implementation: each step is a tall (70vh) spacer; IntersectionObserver
 * tracks which step is centered in the viewport and calls setState to swap
 * the sticky visual. A `progress` number (0–1) is passed to render() so
 * graphics can animate with the scroll position (e.g., a map filling in, a
 * bar chart growing).
 */
export default function Scrollytelling({ steps, title, dek }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = stepRefs.current.indexOf(entry.target as HTMLElement);
          if (idx >= 0) setActiveIdx(idx);
        });
      },
      {
        // Fire when the middle of the step crosses the middle of the viewport.
        rootMargin: '-40% 0px -50% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  // Per-step progress: 0 when step top crosses viewport bottom, 1 when step
  // top crosses viewport top. Used by render(progress) for smooth animations.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      const el = stepRefs.current[activeIdx];
      if (el) {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        // 0 at vh (just appeared), 1 at 0 (top of screen)
        const p = Math.max(0, Math.min(1, 1 - rect.top / (vh * 0.8)));
        setProgress(p);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [activeIdx]);

  const current = steps[activeIdx] || steps[0];

  return (
    <div ref={containerRef} className="my-12 not-prose">
      {(title || dek) && (
        <div className="max-w-3xl mx-auto text-center mb-8 px-4">
          {title && (
            <h2 className="headline text-2xl md:text-4xl leading-tight mb-3">{title}</h2>
          )}
          {dek && (
            <p className="dek font-serif italic text-lg text-wp-ink">{dek}</p>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
        {/* Left: text steps */}
        <div className="md:col-span-1 space-y-0">
          {steps.map((s, i) => (
            <section
              key={i}
              ref={(el) => { stepRefs.current[i] = el; }}
              className={
                'min-h-[70vh] py-16 md:py-24 transition-opacity duration-300 ' +
                (i === activeIdx ? 'opacity-100' : 'opacity-40')
              }
            >
              {s.kicker && (
                <div className="kicker text-wp-red mb-2 uppercase tracking-[0.15em] text-xs font-bold">
                  {s.kicker}
                </div>
              )}
              <div className="font-body text-lg md:text-xl leading-relaxed text-wp-ink">
                {s.text}
              </div>
            </section>
          ))}
        </div>

        {/* Right: sticky visual */}
        <div className="md:col-span-1 md:sticky md:top-24 order-first md:order-last mb-6 md:mb-0">
          <div className="relative w-full aspect-[4/3] md:aspect-[3/4] bg-wp-light border border-wp-border overflow-hidden">
            {renderVisual(current, true, progress)}
          </div>
          {current.caption && (
            <p className="text-[11px] font-sans text-wp-gray mt-2 italic leading-snug">
              {current.caption}
            </p>
          )}
          {/* Step indicator dots */}
          <div className="flex justify-center gap-2 mt-4">
            {steps.map((_, i) => (
              <span
                key={i}
                aria-hidden="true"
                className={
                  'block h-1.5 rounded-full transition-all ' +
                  (i === activeIdx ? 'w-8 bg-wp-red' : 'w-1.5 bg-wp-border')
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
