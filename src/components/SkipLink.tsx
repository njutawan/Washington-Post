'use client';

import { useCallback, useEffect } from 'react';

/**
 * Skip-to-content link. Visible only when focused (SR + keyboard users).
 * Uses an onClick handler to move focus programmatically to <main>, which
 * is required for screen readers to actually enter the main landmark when
 * activating a same-page anchor (without this, NVDA/VO sometimes stay on
 * the link after the hash jumps).
 */
export default function SkipLink() {
  // Ensure the skip target is programmatically focusable from first paint
  // (tabindex="-1" never enters the Tab order). The click handler below
  // re-applies it defensively for pages that render their own <main>.
  useEffect(() => {
    const main = document.getElementById('main-content');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
  }, []);
  const onClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById('main-content');
    if (!main) return;
    // Ensure main is programmatically focusable (without polluting the tabindex in markup)
    if (!main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
      main.addEventListener(
        'blur',
        () => { main.removeAttribute('tabindex'); },
        { once: true }
      );
    }
    main.focus({ preventScroll: false });
    history.replaceState(null, '', '#main-content');
  }, []);

  return (
    <a
      href="#main-content"
      onClick={onClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:bg-wp-black focus:text-white focus:px-4 focus:py-2 focus:font-sans focus:font-bold focus:text-sm focus:outline-none focus:ring-2 focus:ring-wp-red"
    >
      Skip to main content
    </a>
  );
}
