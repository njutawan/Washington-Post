'use client';

import { useEffect, useRef, useState } from 'react';
import TableOfContents from './TableOfContents';

/**
 * Finds the #article-body element on the page and passes it to the TOC.
 * Wrapped in a client component because TOC uses refs/IntersectionObserver.
 */
export default function TOCWithRef() {
  const ref = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = document.getElementById('article-body');
    if (el) {
      ref.current = el as HTMLElement;
      setReady(true);
    }
  }, []);

  if (!ready || !ref.current) return null;
  return <TableOfContents containerRef={ref} />;
}
