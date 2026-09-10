'use client';

import { useEffect, useRef, useState } from 'react';

type Slot = 'top-banner' | 'mid-article' | 'sidebar' | 'sticky-sidebar';

type Props = {
  slot: Slot;
  label?: string;      // e.g. "Advertisement"
  width?: number;
  height?: number;
  className?: string;
};

/**
 * Placeholder ad unit.
 *
 * In production this would render a GPT / Prebid / Amazon TAM tag. For this
 * demo it renders a clearly-labeled placeholder box that lazy-loads via
 * IntersectionObserver and reports a fill/fail signal to our analytics.
 *
 * If an ad blocker is detected (bait element hidden, or fetch to a known ad
 * server blocked), the slot collapses and shows a subscribe prompt instead
 * of an empty box that looks broken.
 */
export default function AdSlot({
  slot,
  label = 'Advertisement',
  width = 300,
  height = 250,
  className = '',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Sizes per slot
  const size = (() => {
    switch (slot) {
      case 'top-banner':    return { w: 970, h: 90,  label: '970×90 Leaderboard' };
      case 'mid-article':   return { w: 300, h: 250, label: '300×250 MPU' };
      case 'sidebar':       return { w: 300, h: 250, label: '300×250' };
      case 'sticky-sidebar':return { w: 300, h: 600, label: '300×600 Half-page' };
      default:              return { w: width, h: height, label: `${width}×${height}` };
    }
  })();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Simulate ad "request" + adblock detection. The bait element is a div whose
  // class/ID triggers popular filter lists; if it gets hidden, ads are blocked.
  // Also attempt a fetch to the Google Publisher Tag domain — failure = blocker.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    // Bait element
    const bait = document.createElement('div');
    bait.style.position = 'absolute';
    bait.style.left = '-9999px';
    bait.style.top = '0';
    bait.style.width = '1px';
    bait.style.height = '1px';
    bait.className = 'adsbox ad-banner text-ad pub_300x250 banner_ad';
    bait.id = 'ad-banner';
    bait.setAttribute('data-ad-client', 'ca-pub-xxx');
    document.body.appendChild(bait);
    // Check after layout
    requestAnimationFrame(() => {
      const isBlocked =
        bait.offsetParent === null ||
        getComputedStyle(bait).display === 'none' ||
        getComputedStyle(bait).visibility === 'hidden' ||
        bait.offsetHeight === 0;
      bait.remove();
      // Also try a canary fetch (best-effort; non-critical)
      fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
      }).catch(() => {
        if (!cancelled) setBlocked(true);
      });
      if (!cancelled) {
        if (isBlocked) setBlocked(true);
        // Simulate "ad fill" latency
        setTimeout(() => { if (!cancelled) setLoaded(true); }, 450);
      }
    });
    return () => { cancelled = true; };
  }, [visible]);

  // Sticky behavior: only for sticky-sidebar slot; purely CSS via position:sticky
  const stickyCls = slot === 'sticky-sidebar' ? 'sticky top-20' : '';

  return (
    <div
      ref={ref}
      data-ad-slot={slot}
      aria-label={label}
      role="complementary"
      className={`ad-slot mx-auto ${stickyCls} ${className}`}
    >
      <p className="text-[10px] font-sans uppercase tracking-widest text-wp-gray text-center mb-1">
        {label}
      </p>
      <div
        className={
          'relative overflow-hidden bg-wp-light border border-dashed border-wp-gray/40 ' +
          'flex items-center justify-center ' +
          (blocked ? 'bg-transparent border-solid border-wp-border' : '')
        }
        style={{
          width: '100%',
          maxWidth: size.w,
          height: loaded && !blocked ? size.h : blocked ? 'auto' : size.h,
          margin: '0 auto',
          minHeight: slot === 'top-banner' ? 90 : 120,
        }}
      >
        {!visible && (
          // Reserve layout space to prevent CLS before the ad loads
          <div className="text-[11px] font-sans text-wp-gray" aria-hidden="true" />
        )}
        {visible && !blocked && !loaded && (
          <div className="text-[11px] font-sans text-wp-gray animate-pulse">Loading ad…</div>
        )}
        {visible && !blocked && loaded && (
          <div className="text-center px-4">
            <p className="font-display font-black text-4xl text-wp-gray/40 leading-none mb-1">Ad</p>
            <p className="text-[11px] font-sans text-wp-gray">{size.label}</p>
            <p className="text-[10px] font-sans text-wp-gray/70 mt-1">Demo placeholder</p>
          </div>
        )}
        {visible && blocked && (
          <div className="p-5 text-center w-full bg-wp-light">
            <p className="kicker text-wp-red mb-1">Ads help support our newsroom</p>
            <p className="font-serif text-sm mb-3 text-wp-ink">
              We noticed you&apos;re using an ad blocker. Consider subscribing to
              support independent journalism.
            </p>
            <a
              href="#subscribe"
              className="inline-block bg-wp-black text-white px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-wider hover:bg-wp-red transition tap-target"
            >
              Subscribe
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
