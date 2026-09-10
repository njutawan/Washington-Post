'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Slot = 'top-banner' | 'mid-article' | 'sidebar' | 'sticky-sidebar';

type Props = {
  slot: Slot;
  label?: string;      // e.g. "Advertisement"
  width?: number;
  height?: number;
  className?: string;
};

// Fake advertiser creatives — these are clearly-demarcated demo ads so the
// page never shows empty "Ad" grey boxes. One creative is picked per slot
// instance on mount (random + slot-seeded), and rotates every 45s.
const FAKE_CREATIVES = [
  {
    advertiser: 'Acme Banking',
    headline: 'Earn 4.50% APY — no fees, no minimums',
    body: 'High-yield savings with mobile deposit and FDIC insurance.',
    cta: 'Open an account',
    bg: 'bg-blue-900',
    fg: 'text-white',
    accent: 'bg-yellow-400 text-black',
  },
  {
    advertiser: 'Capital Coffee',
    headline: 'Cold brew delivered before your alarm',
    body: 'Weekly beans, fresh-roasted in D.C. First bag free.',
    cta: 'Get started',
    bg: 'bg-[#2b1d14]',
    fg: 'text-[#f0e6d2]',
    accent: 'bg-[#c19a6b] text-black',
  },
  {
    advertiser: 'Veridian EV',
    headline: 'The new Veridian S goes 420 miles on a charge',
    body: 'Pre-order today and lock in a $7,500 tax credit.',
    cta: 'Reserve yours',
    bg: 'bg-gradient-to-br from-emerald-700 to-black',
    fg: 'text-white',
    accent: 'bg-emerald-400 text-black',
  },
  {
    advertiser: 'Georgetown Books',
    headline: 'Fall reading: 30% off all Pulitzer winners',
    body: 'In store & online. Free shipping on orders over $35.',
    cta: 'Shop now',
    bg: 'bg-amber-50',
    fg: 'text-wp-black',
    accent: 'bg-wp-red text-white',
  },
  {
    advertiser: 'MetroMobile',
    headline: 'Unlimited 5G for $25/mo — keep your phone',
    body: 'No contracts. No fine print. On the nation\u2019s fastest network.',
    cta: 'Switch today',
    bg: 'bg-purple-900',
    fg: 'text-white',
    accent: 'bg-pink-400 text-black',
  },
  {
    advertiser: 'WashPo Live',
    headline: 'Post Live: Inside the shutdown with our reporters',
    body: 'Wednesday at 7 p.m. ET — subscribers get priority questions.',
    cta: 'RSVP free',
    bg: 'bg-wp-black',
    fg: 'text-white',
    accent: 'bg-wp-red text-white',
  },
] as const;

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
  // Pick a random creative per mount, keyed by slot name, then rotate every 45s.
  const [creativeIdx, setCreativeIdx] = useState<number>(() => Math.floor(Math.random() * FAKE_CREATIVES.length));
  const creative = FAKE_CREATIVES[creativeIdx];
  useEffect(() => {
    if (blocked) return;
    const id = setInterval(() => {
      setCreativeIdx((i) => (i + 1) % FAKE_CREATIVES.length);
    }, 45000);
    return () => clearInterval(id);
  }, [blocked]);

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
            <Link
              href="/subscribe"
              className={`block w-full h-full ${creative.bg} ${creative.fg} p-3 md:p-4 flex flex-col justify-between overflow-hidden relative group`}
              aria-label={`${creative.advertiser} advertisement`}
            >
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[9px] font-sans uppercase tracking-widest opacity-75">
                {creative.advertiser}
              </span>
              <span className="text-[9px] font-sans uppercase tracking-widest opacity-50">
                Sponsored
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className={
                'font-display font-black leading-[1.05] mb-2 ' +
                (slot === 'top-banner' ? 'text-lg md:text-2xl' : 'text-lg md:text-xl')
              }>
                {creative.headline}
              </p>
              <p className={'font-serif text-[12px] md:text-sm leading-snug opacity-90 mb-3 ' + (slot === 'top-banner' ? 'line-clamp-1' : '')}>
                {creative.body}
              </p>
            </div>
            <div>
              <span className={`inline-block px-3 py-1.5 text-[10px] md:text-xs font-sans font-bold uppercase tracking-wider ${creative.accent} group-hover:underline`}>
                {creative.cta} →
              </span>
            </div>
          </Link>
        )}
        {visible && blocked && (
          <div className="p-5 text-center w-full bg-wp-light">
            <p className="kicker text-wp-red mb-1">Ads help support our newsroom</p>
            <p className="font-serif text-sm mb-3 text-wp-ink">
              We noticed you&apos;re using an ad blocker. Consider subscribing to
              support independent journalism.
            </p>
            <Link
              href="/subscribe"
              className="inline-block bg-wp-black text-white px-4 py-2 text-[11px] font-sans font-bold uppercase tracking-wider hover:bg-wp-red transition tap-target"
            >
              Subscribe
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
