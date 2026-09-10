'use client';

/**
 * View Transitions API wrapper for the App Router (Task 16).
 *
 * Why this file is short on purpose:
 *   - `document.startViewTransition(updateCallback)` expects `updateCallback`
 *     to *kick off* the DOM change synchronously and then resolve as soon as
 *     the new state has been committed. Returning a long-running Promise
 *     (like the earlier pathname-polling loop) causes Chrome to abort with
 *     "Transition was aborted because of timeout in DOM update" after ~2–5s.
 *   - The browser automatically watches the next render and snapshots the
 *     new "after" state when the frame commits. We don't need to detect it.
 *
 * Behavior:
 *   - Intercepts in-app <a> clicks and, in supporting browsers, wraps
 *     router.push() inside startViewTransition so the UA cross-fades.
 *   - Tags the clicked card's hero + title with view-transition-name so the
 *     image/headline morph into the article page (shared-element transition).
 *   - Falls back to a plain router.push in browsers without the API.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

function isSameOrigin(href: string) {
  try {
    const u = new URL(href, window.location.origin);
    return u.origin === window.location.origin;
  } catch { return false; }
}

function clearVtStyles() {
  document.querySelectorAll<HTMLElement>('[data-vt-active="1"]').forEach((el) => {
    el.dataset.vtActive = '0';
    el.style.viewTransitionName = '';
  });
}

export default function PageTransitions() {
  const router = useRouter();

  useEffect(() => {
    // Clean up on unmount / new transition
    const onClick = (e: MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.defaultPrevented) return;
      const a = (e.target as HTMLElement | null)?.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href) return;
      if (a.hasAttribute('download') || a.getAttribute('target') === '_blank') return;
      if (href.startsWith('http') && !isSameOrigin(href)) return;
      if (href.startsWith('#')) return;
      const url = href.startsWith('/') ? new URL(href, window.location.origin).toString() : href;
      if (!isSameOrigin(url)) return;

      // Tag the clicked card so its hero/title participate in the shared-
      // element transition.
      const card = a.closest('[data-vt-card]') as HTMLElement | null;
      const heroEl = card?.querySelector('[data-vt-hero]') as HTMLElement | null;
      const titleEl = card?.querySelector('[data-vt-title]') as HTMLElement | null;
      if (card) card.dataset.vtActive = '1';
      if (heroEl) heroEl.style.viewTransitionName = 'vt-hero';
      if (titleEl) titleEl.style.viewTransitionName = 'vt-title';

      const go = () => router.push(href, { scroll: true });

      const startVT = (document as any).startViewTransition;
      if (typeof startVT !== 'function') {
        e.preventDefault();
        go();
        return;
      }
      e.preventDefault();
      try {
        // Kick the transition. The callback must return a Promise that
        // resolves once the DOM has updated, but returning an already-
        // resolved promise works because the browser delays the "new"
        // snapshot until the next frame the router commits.
        const t = startVT.call(document, () => {
          go();
          // Flush a microtask so React's state update has been scheduled;
          // the UA takes over from here and animates once paint commits.
          return new Promise<void>((r) => requestAnimationFrame(() => r()));
        });
        // Swallow "Transition was aborted" — expected when a second nav
        // interrupts the first, or when the user hits Esc, etc.
        t.finished.catch(() => { /* expected */ });
        // Clean up inline styles after transition ends (success or abort)
        t.ready.finally(() => {
          setTimeout(clearVtStyles, 500);
        }).catch(() => { /* expected */ });
      } catch {
        clearVtStyles();
        go();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
