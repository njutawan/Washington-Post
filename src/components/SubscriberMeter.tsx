'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePaywall } from '@/lib/usePaywall';

const FREE_LIMIT = 3;

/**
 * Compact subscriber-benefit meter that lives in the Masthead top bar.
 * Shows how many free articles remain this month, and links to /subscribe.
 * Subscribers (session authenticated, or "unlocked" via demo) see a crown + "Sub".
 */
export default function SubscriberMeter() {
  const { articlesRead } = usePaywall();
  const [subscriber, setSubscriber] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('wapo_subscriber');
      setSubscriber(s === '1');
    } catch { /* ignore */ }
  }, []);

  const remaining = Math.max(0, FREE_LIMIT - articlesRead);
  const used = Math.min(articlesRead, FREE_LIMIT);

  if (subscriber) {
    return (
      <Link
        href="/account"
        className="hidden md:flex items-center gap-1.5 px-2 py-1 text-[11px] font-sans font-bold uppercase tracking-wider text-wp-red hover:bg-wp-red/10 transition"
        aria-label="Subscriber benefits"
      >
        <span aria-hidden="true" className="text-wp-red">★</span>
        Subscriber
      </Link>
    );
  }

  return (
    <Link
      href="/subscribe"
      className="hidden sm:flex items-center gap-2 px-2 py-1 text-[11px] font-sans text-wp-black hover:bg-wp-light tap-target group"
      title={`${remaining} free article${remaining === 1 ? '' : 's'} remaining this month. Subscribe for unlimited access.`}
    >
      <span className="sr-only">Free articles remaining this month</span>
      <span aria-hidden="true" className="flex gap-0.5 items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={
              'w-1.5 h-3 border border-wp-black ' +
              (i < used ? 'bg-wp-red' : 'bg-transparent')
            }
          />
        ))}
      </span>
      <span className="font-bold uppercase tracking-wider group-hover:text-wp-red">
        {remaining === 0 ? 'Subscribe' : `${remaining} free`}
      </span>
    </Link>
  );
}
