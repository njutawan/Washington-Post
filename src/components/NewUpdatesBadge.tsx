'use client';

import { useEffect, useState } from 'react';

type Props = {
  count: number;
  onApply: () => void;
  label?: string;
  /** DOM selector of the target container to scroll to on click */
  targetSelector?: string;
};

/**
 * Sticky "X new updates" pill that drops down from under the masthead when
 * there are unseen items. Used on live blogs (and optionally on article
 * pages when a breaking update arrives after load).
 */
export default function NewUpdatesBadge({
  count,
  onApply,
  label = 'New updates',
  targetSelector = '#live-updates',
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(count > 0);
  }, [count]);

  if (!show || count === 0) return null;

  return (
    <div className="new-updates-badge -mt-2 mb-4">
      <button
        onClick={() => {
          onApply();
          setShow(false);
          const el = document.querySelector(targetSelector);
          if (el) {
            const top = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        }}
        className="bg-wp-red text-white px-5 py-3 font-sans font-bold uppercase text-xs tracking-wider shadow-xl hover:bg-wp-black transition flex items-center gap-3 animate-slide-in"
        aria-live="polite"
      >
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-wp-red text-[12px] font-black">
          {count > 99 ? '99+' : count}
        </span>
        {label}
        <span aria-hidden="true">↓</span>
      </button>
    </div>
  );
}
