'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePaywall } from '@/lib/usePaywall';

type PlanId = 'digital' | 'allaccess' | 'student' | 'gift';

const PLANS: Array<{ id: PlanId; name: string; price: string; period: string; tag: string; accent: 'red' | 'black' }> = [
  { id: 'digital', name: 'Digital', price: '$1', period: '/ week', tag: 'Most popular', accent: 'red' },
  { id: 'allaccess', name: 'All-Access', price: '$2', period: '/ week', tag: 'Print + digital', accent: 'black' },
  { id: 'student', name: 'Student', price: '$1', period: '/ month', tag: 'With .edu', accent: 'black' },
];

export default function PaywallModal({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const { dismiss, articlesRead } = usePaywall();
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState<PlanId>('digital');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setMounted(true));
    } else {
      document.body.style.overflow = '';
      setMounted(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const remaining = Math.max(0, 3 - articlesRead);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <div
        className={
          'bg-wp-cream w-full max-w-3xl border-t-4 border-wp-black md:border-2 md:border-wp-black shadow-2xl transition-all duration-300 overflow-y-auto max-h-[95vh] ' +
          (mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0')
        }
      >
        <div className="p-6 md:p-8">
          <div className="text-[11px] font-sans uppercase tracking-[0.3em] text-wp-gray mb-3 text-center">
            Democracy Dies in Darkness
          </div>
          <h2 id="paywall-title" className="masthead-title text-3xl md:text-5xl mb-3 text-center leading-none">
            {remaining === 0 ? 'You\u2019ve read your free stories this month.' : 'Continue reading with a subscription.'}
          </h2>
          <div className="w-16 h-0.5 bg-wp-black mx-auto mb-4" />
          <p className="dek text-center max-w-xl mx-auto mb-6">
            Support independent journalism and unlock every story, podcast,
            game, and award-winning investigation.
          </p>

          {/* Plan tiles (compact) */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPlan(p.id)}
                className={
                  'p-3 md:p-4 text-left border-2 transition ' +
                  (plan === p.id
                    ? 'border-wp-black bg-white shadow-[3px_3px_0_0_rgba(0,0,0,1)]'
                    : 'border-wp-border bg-white/60 hover:border-wp-black')
                }
                aria-pressed={plan === p.id}
              >
                <p className="text-[9px] md:text-[10px] font-sans uppercase tracking-widest text-wp-gray mb-1">{p.tag}</p>
                <p className="font-display font-black text-lg md:text-xl leading-none mb-1">{p.name}</p>
                <p className="font-sans text-sm">
                  <span className={p.accent === 'red' ? 'text-wp-red font-bold' : 'text-wp-black font-bold'}>{p.price}</span>
                  <span className="text-wp-gray text-xs">{p.period}</span>
                </p>
              </button>
            ))}
          </div>

          {/* Benefits */}
          <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-5 text-sm font-serif text-wp-ink">
            {[
              'Unlimited access to washingtonpost.com',
              'Subscriber-exclusive newsletters',
              'All podcasts & narrated articles',
              'Daily games, crosswords & puzzles',
              'Comment on any story',
              'Cancel anytime',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="text-wp-red font-bold mt-0.5 leading-none">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link
            href={`/subscribe?plan=${plan}`}
            onClick={() => { dismiss(); onClose?.(); }}
            className="block w-full bg-wp-red text-white px-6 py-4 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-black transition mb-2 tap-target text-center"
          >
            Subscribe now — {PLANS.find(p => p.id === plan)?.price}{PLANS.find(p => p.id === plan)?.period}
          </Link>
          <Link
            href="/subscribe?plan=gift"
            onClick={() => { dismiss(); onClose?.(); }}
            className="block w-full text-center text-xs font-sans uppercase tracking-wider text-wp-gray hover:text-wp-black py-2 tap-target"
          >
            Or give a gift subscription →
          </Link>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-x-5 gap-y-2 text-xs font-sans text-wp-gray border-t border-wp-border pt-4 mt-2">
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(pathname)}`}
              className="hover:text-wp-black underline py-1 tap-target"
              onClick={() => { dismiss(); onClose?.(); }}
            >
              Already a subscriber? Sign in
            </Link>
            <span className="hidden sm:inline text-wp-border">|</span>
            <button
              onClick={() => {
                // Demo: mark as subscriber for session and continue
                try { localStorage.setItem('wapo_subscriber', '1'); } catch { /* ignore */ }
                dismiss();
                onClose?.();
                router.refresh();
              }}
              className="hover:text-wp-black underline py-1 tap-target"
            >
              Activate demo access
            </button>
            {onClose && (
              <>
                <span className="hidden sm:inline text-wp-border">|</span>
                <button onClick={() => { dismiss(); onClose(); }} className="hover:text-wp-black underline py-1 tap-target">
                  Read one more free article
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
