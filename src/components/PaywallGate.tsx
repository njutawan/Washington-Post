'use client';

import { useEffect, useState } from 'react';
import { usePaywall } from '@/lib/usePaywall';
import PaywallModal from './PaywallModal';
import { track } from '@/lib/track';

/**
 * Client component that, on mount of an article page, registers the view and
 * locks the article + shows the modal if the user has exceeded their free limit.
 * When locked, children after the preview paragraph count are blurred/blocked.
 */
export default function PaywallGate({
  slug,
  children,
  previewParagraphs = 2,
}: {
  slug: string;
  children: React.ReactNode;
  previewParagraphs?: number;
}) {
  const { registerArticleView, hasReachedLimit, dismissed, articlesRead } = usePaywall();
  const [blocked, setBlocked] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);

  useEffect(() => {
    try {
      setIsSubscriber(localStorage.getItem('wapo_subscriber') === '1');
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (processed) return;
    if (isSubscriber) { setProcessed(true); return; }
    const isBlocked = registerArticleView(slug);
    track('paywall_seen', { props: { slug, blocked: isBlocked } });
    if (isBlocked) {
      setBlocked(true);
      setShowModal(true);
    }
    setProcessed(true);
  }, [slug, registerArticleView, processed, isSubscriber]);

  // Track subscribe click as paywall conversion (demo: any tap on the subscribe CTA)
  useEffect(() => {
    if (!blocked) return;
    track('paywall_convert', { props: { slug, action: 'subscribe_cta' } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocked]);

  const remaining = Math.max(0, 3 - articlesRead);

  // Subscribers see full content with a small "thank you" ribbon
  if (isSubscriber) {
    return (
      <>
        <div className="flex items-center justify-between text-xs font-sans text-wp-red border-t border-wp-red/30 pt-3 mt-2 mb-6">
          <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span aria-hidden="true">★</span> Subscriber exclusive
          </span>
          <span className="text-wp-gray normal-case tracking-normal">Thank you for supporting independent journalism.</span>
        </div>
        {children}
      </>
    );
  }

  return (
    <>
      {/* Meter bar */}
      <div className="flex items-center justify-between text-xs font-sans text-wp-gray border-t border-wp-border pt-3 mt-2 mb-6">
        <span>
          {blocked ? (
            <>You\u2019ve reached your 3 free articles this month.</>
          ) : (
            <>{remaining} free article{remaining !== 1 ? 's' : ''} remaining this month</>
          )}
        </span>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={
                'w-8 h-1 ' +
                (i < articlesRead ? 'bg-wp-red' : 'bg-wp-border')
              }
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Article content — blurred out after preview when blocked */}
      <div className={blocked && !dismissed ? 'relative' : ''}>
        <div className={blocked && !dismissed ? 'article-blur' : ''}>
          {children}
        </div>
        {blocked && !dismissed && (
          <div className="absolute inset-x-0 bottom-0 h-80 paywall-fade pointer-events-none flex items-end justify-center pb-8">
            <button
              onClick={() => setShowModal(true)}
              className="pointer-events-auto bg-wp-black text-white px-8 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition"
            >
              Subscribe to keep reading
            </button>
          </div>
        )}
      </div>

      <PaywallModal open={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}
