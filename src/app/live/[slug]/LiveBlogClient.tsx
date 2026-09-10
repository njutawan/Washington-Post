'use client';

import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import Sidebar from '@/components/Sidebar';
import { ClockIcon } from '@/components/Icons';
import { useLiveUpdates } from '@/lib/useLiveUpdates';
import NewUpdatesBadge from '@/components/NewUpdatesBadge';
import type { LiveUpdate } from '@/lib/liveData';

export default function LiveBlogPageClient({
  slug,
  title,
  dek,
  initialUpdates,
}: {
  slug: string;
  title: string;
  dek: string;
  initialUpdates: LiveUpdate[];
}) {
  const { updates, pendingCount, connected, error, applyPending } = useLiveUpdates(
    slug,
    initialUpdates,
  );

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6">
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" id="live-aria-status">
          {pendingCount > 0 ? `${pendingCount} new update${pendingCount === 1 ? '' : 's'} available. Press the button to load them.` : connected ? 'Live feed connected.' : 'Connecting to live updates.'}
        </div>
        <Breadcrumbs items={[{ label: 'Politics', href: '/politics' }, { label: 'Live Updates' }]} />

        <div className="grid lg:grid-cols-3 gap-8">
          <article className="lg:col-span-2">
            <div className="kicker text-wp-red flex items-center gap-2 mb-3 text-sm">
              <span className="live-dot" />
              {connected ? 'LIVE UPDATES' : 'LIVE UPDATES · Connecting…'}
            </div>
            <h1 className="headline text-3xl md:text-5xl mb-3 leading-tight">{title}</h1>
            <p className="dek text-xl mb-4">{dek}</p>

            <div className="flex items-center gap-4 py-4 border-t-2 border-b border-wp-black mb-6 font-sans text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <ClockIcon />
                <span>
                  Last updated {updates[0]?.time || 'moments ago'}
                </span>
              </div>
              <span className="text-wp-gray">·</span>
              <span>By The Post Politics Team</span>
              {error && (
                <>
                  <span className="text-wp-gray">·</span>
                  <span className="text-wp-red text-xs">{error}</span>
                </>
              )}
              {connected && !error && (
                <>
                  <span className="text-wp-gray hidden sm:inline">·</span>
                  <span className="hidden sm:inline flex items-center gap-1 text-wp-green text-xs">
                    <span className="w-2 h-2 rounded-full bg-wp-green animate-pulse" />
                    Live
                  </span>
                </>
              )}
            </div>

            <NewUpdatesBadge count={pendingCount} onApply={applyPending} targetSelector="#live-updates" />

            <div id="live-updates" />

            <div className="relative">
              {updates.length === 0 && (
                <p className="dek text-wp-gray text-center py-10">
                  Waiting for updates…
                </p>
              )}
              {updates.map((u, i) => {
                const isNewest = i === 0;
                return (
                  <div
                    key={u.id}
                    className={
                      'relative pl-10 pb-8 ' +
                      (i < updates.length - 1 ? 'live-timeline-line' : '') +
                      (isNewest && u.live ? ' animate-slide-in' : '')
                    }
                  >
                    <div
                      className={
                        'absolute left-0 top-1 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ' +
                        (u.live
                          ? 'bg-wp-red animate-pulse ring-4 ring-wp-red/20'
                          : 'bg-wp-black')
                      }
                      aria-hidden="true"
                    >
                      {u.live ? 'NEW' : i + 1}
                    </div>
                    <div className="mb-2 flex items-center gap-3 flex-wrap">
                      <span className="kicker text-wp-black">{u.time}</span>
                      {u.live && (
                        <span className="kicker text-wp-red flex items-center gap-1">
                          <span className="live-dot" /> Live
                        </span>
                      )}
                    </div>
                    <h3 className="headline text-xl md:text-2xl leading-tight mb-2 hover:text-wp-link">
                      {u.title}
                    </h3>
                    <p className="font-body text-lg leading-relaxed text-wp-ink">{u.body}</p>
                    {u.byline && (
                      <p className="byline mt-3 text-wp-gray">— {u.byline}</p>
                    )}
                  </div>
                );
              })}

              <div className="text-center py-6">
                <p className="text-sm font-sans text-wp-gray italic mb-3">
                  Updates stream automatically — keep this tab open.
                </p>
                <Link
                  href="/politics"
                  className="inline-block border-2 border-wp-black px-6 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition tap-target"
                >
                  ← Back to Politics
                </Link>
              </div>
            </div>
          </article>

          <div className="lg:col-span-1">
            <Sidebar />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
