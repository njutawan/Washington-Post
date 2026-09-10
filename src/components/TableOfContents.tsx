'use client';

import { useEffect, useState, useRef } from 'react';

type Section = { id: string; text: string; level: 2 | 3 };

type Props = {
  /** CSS selector for the article body container */
  containerRef: React.RefObject<HTMLElement | null>;
};

/**
 * Sticky table-of-contents that auto-generates from h2/h3 in the article and
 * highlights the currently-visible section via IntersectionObserver
 * ("scroll-spy"). Classic longform-news pattern.
 */
export default function TableOfContents({ containerRef }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const clickRef = useRef(false);

  // Extract headings once the article mounts
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const gather = () => {
      const nodes = container.querySelectorAll<HTMLHeadingElement>('h2, h3');
      const list: Section[] = [];
      nodes.forEach((h) => {
        if (!h.id) return;
        list.push({
          id: h.id,
          text: h.textContent?.trim() || '',
          level: h.tagName === 'H3' ? 3 : 2,
        });
      });
      setSections(list);
    };

    gather();

    // Re-gather if the DOM mutates (MDX hydration can insert content async)
    const mo = new MutationObserver(gather);
    mo.observe(container, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [containerRef]);

  // IntersectionObserver for scroll-spy
  useEffect(() => {
    const container = containerRef.current;
    if (!container || sections.length === 0) return;

    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickRef.current) return;
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) {
            visible.set(id, entry.intersectionRatio);
          } else {
            visible.delete(id);
          }
        });
        if (visible.size === 0) return;
        // Pick the heading closest to the top
        let best: string = '';
        let bestTop = Infinity;
        visible.forEach((_, id) => {
          const el = document.getElementById(id);
          if (!el) return;
          const top = el.getBoundingClientRect().top;
          if (top < bestTop && top < window.innerHeight * 0.4) {
            bestTop = top;
            best = id;
          }
        });
        if (best) setActiveId(best);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections, containerRef]);

  if (sections.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    clickRef.current = true;
    setActiveId(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
    setTimeout(() => { clickRef.current = false; }, 800);
  };

  return (
    <nav aria-label="Table of contents" className="hidden lg:block">
      <div className="sticky top-24 py-4 pl-4 border-l-2 border-wp-border max-w-[240px]">
        <p className="kicker text-wp-black text-[10px] mb-3">In this article</p>
        <ul className="space-y-2 text-[13px] font-sans leading-snug">
          {sections.map((s) => (
            <li key={s.id} className={s.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${s.id}`}
                onClick={(e) => handleClick(e, s.id)}
                aria-current={activeId === s.id ? 'location' : undefined}
                className={
                  'block transition-colors ' +
                  (activeId === s.id
                    ? 'text-wp-red font-bold border-l-2 -ml-[18px] pl-4 border-wp-red'
                    : 'text-wp-gray hover:text-wp-black border-l-2 -ml-[18px] pl-4 border-transparent')
                }
              >
                {s.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
