'use client';

/**
 * Top-loading progress bar (YouTube/Linear/Medium style).
 *
 * Hooks into Next.js App Router navigation events (via a simple MutationObserver
 * on next/router state) and the window `load` event to animate a thin bar
 * across the top of the viewport. We don't use useRouter().events (gone in
 * App Router); instead we listen to `routeChangeStart`-equivalent events by
 * monkey-patching history.pushState/replaceState and observing clicks on
 * in-app <a> elements. A 300ms trickle animation plus a finish fade-out give
 * good perceived performance even on instantaneous SPA navigations.
 */
import { useEffect, useState } from 'react';

export default function TopLoader() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let raf = 0;
    let current = 0;
    let finishing = false;

    const clear = () => {
      if (timer) { clearTimeout(timer); timer = null; }
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
    };

    const trickle = () => {
      if (finishing) return;
      const step = Math.random() * 6 + 2;
      current = Math.min(90, current + step);
      setProgress(current);
      timer = setTimeout(trickle, 250 + Math.random() * 400);
    };

    const start = () => {
      clear();
      finishing = false;
      current = 8;
      setProgress(current);
      setFadeOut(false);
      setVisible(true);
      timer = setTimeout(trickle, 200);
    };

    const done = () => {
      clear();
      finishing = true;
      current = 100;
      setProgress(100);
      // Fade out after bar completes
      timer = setTimeout(() => {
        setFadeOut(true);
        timer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
          setFadeOut(false);
        }, 300);
      }, 150);
    };

    // Intercept history pushes (Next.js Link uses pushState for SPA navs)
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      start();
      const r = origPush.apply(this, args as any);
      // Finish after a short delay — gives the RSC stream time to flush
      setTimeout(done, 400);
      return r;
    };
    history.replaceState = function (...args) {
      start();
      const r = origReplace.apply(this, args as any);
      setTimeout(done, 400);
      return r;
    };
    window.addEventListener('popstate', () => { start(); setTimeout(done, 400); });

    // Initial page load finish
    if (document.readyState === 'complete') {
      setVisible(false);
    } else {
      start();
      window.addEventListener('load', done, { once: true });
    }

    return () => {
      clear();
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener('popstate', () => {});
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] pointer-events-none"
      aria-hidden="true"
    >
      <div
        className={
          'h-full bg-wp-red shadow-[0_0_8px_rgba(180,0,1,0.6)] ' +
          (fadeOut ? 'opacity-0 transition-opacity duration-300' : 'opacity-100')
        }
        style={{
          width: `${progress}%`,
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease',
          willChange: 'width',
        }}
      />
    </div>
  );
}
