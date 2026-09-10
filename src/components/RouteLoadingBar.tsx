'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * In-route suspense loading indicator. The global TopLoader handles the very
 * first navigation (App Router uses RSC streaming); this component shows a
 * thin pulse bar while child Suspense boundaries are resolving after the
 * shell has painted — useful for search results, live blog, author pages.
 */
export default function RouteLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className={
        'fixed top-0 left-0 h-[2px] z-[90] pointer-events-none transition-opacity duration-200 ' +
        (loading ? 'opacity-100' : 'opacity-0')
      }
    >
      <div className="h-full bg-wp-red animate-pulse" style={{ width: '40vw' }} />
    </div>
  );
}
