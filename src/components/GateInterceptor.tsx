'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePaywall } from '@/lib/usePaywall';
import PaywallModal from './PaywallModal';

/**
 * Global client-side click interceptor: when an anonymous user has exhausted
 * their free articles, clicking a link to /article/[slug] opens the paywall
 * modal instead of navigating away, so they see the subscribe offer before
 * they even reach the article page.
 *
 * Authenticated/demo subscribers pass through directly.
 */
export default function GateInterceptor() {
  const { hasReachedLimit } = usePaywall();
  const [showModal, setShowModal] = useState(false);
  const [subscriber, setSubscriber] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      setSubscriber(localStorage.getItem('wapo_subscriber') === '1');
    } catch { /* ignore */ }
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (subscriber) return;
      if (!hasReachedLimit) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href') || '';
      // Only intercept internal article links
      if (!href.startsWith('/article/') && !href.match(/^\/article\//)) return;
      // Allow new-tab / modifier clicks
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (anchor.target === '_blank') return;

      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [hasReachedLimit, subscriber]);

  return <PaywallModal open={showModal} onClose={() => setShowModal(false)} />;
}
