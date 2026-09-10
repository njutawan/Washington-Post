'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageview, flushPageview, track } from '@/lib/track';

/**
 * Analytics script loader + pageview tracker. Loads Plausible when
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set; always loads our local tracker
 * for the editorial dashboard. Fires pageviews on route changes (App Router
 * doesn't reload the page, so we listen to pathname + searchParams).
 */
export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Load Plausible script if configured (doesn't block initial render).
  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    if (!domain) return;
    const scriptUrl =
      process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL || 'https://plausible.io/js/script.js';
    // Avoid double-injection
    if (document.querySelector(`script[data-plausible="${domain}"]`)) return;
    const s = document.createElement('script');
    s.defer = true;
    s.setAttribute('data-domain', domain);
    s.setAttribute('data-plausible', domain);
    s.src = scriptUrl;
    document.head.appendChild(s);
  }, []);

  // Pageview on route change + initial load + unload flush
  useEffect(() => {
    trackPageview();
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushPageview();
    };
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushPageview);
    // Expose track globally for ad-hoc components
    (window as any).wapoTrack = track;
    return () => {
      flushPageview();
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushPageview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()]);

  return null;
}
