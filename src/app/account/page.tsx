'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { BellIcon } from '@/components/Icons';
import { usePushNotifications } from '@/lib/pwa';
import ReadingHistoryClient from './ReadingHistoryClient';
import { useReading } from '@/components/ReadingProvider';

const ALL_NEWSLETTERS = [
  { id: 'morning-mix', name: 'The Morning Mix', desc: 'Essential news before sunrise.' },
  { id: 'post-reports', name: 'Post Reports', desc: 'Daily podcast, 20 minutes.' },
  { id: 'politics-extra', name: 'Politics Extra', desc: 'Campaigns, Congress, White House.' },
  { id: 'wellbeing', name: 'Well+Being', desc: 'Body & mind advice.' },
  { id: 'food', name: 'Voraciously', desc: 'Recipes & cooking tips.' },
  { id: 'opinion-today', name: 'Opinion Today', desc: 'Best of our columnists.' },
  { id: 'tech-friending', name: 'Tech Friending', desc: 'Making sense of tech.' },
  { id: 'book-club', name: 'The Book Club', desc: 'Monthly read-along.' },
];

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const push = usePushNotifications(); // must be called unconditionally (before any early return)
  const { bookmarks, history, ready: readingReady } = useReading();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/signin?callbackUrl=/account');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/newsletters')
      .then((r) => r.json())
      .then((d) => setPrefs(d.preferences || {}))
      .catch(() => {});
  }, [status, session]);

  const toggle = (id: string) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    setSaving(true);
    fetch('/api/newsletters', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: next }),
    }).finally(() => setSaving(false));
  };

  if (status !== 'authenticated') {
    return (
      <div className="min-h-screen bg-wp-cream flex flex-col">
        <Masthead />
        <main id="main-content" className="wp-container py-16 text-center">
          <p className="font-sans text-wp-gray">Loading…</p>
        </main>
        <Footer />
      </div>
    );
  }

  const initials = (session.user.name || session.user.email || 'R').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="wp-container py-6 md:py-10">
        <Breadcrumbs items={[{ label: 'Account', href: '/account' }]} />
        <div className="grid md:grid-cols-3 gap-8">
          <aside aria-label="Profile" className="md:col-span-1">
            <div className="border-2 border-wp-black p-6 bg-white">
              <div className="flex items-center gap-4 mb-4">
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-wp-black text-white flex items-center justify-center font-display font-black text-2xl">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="headline text-xl leading-tight truncate">{session.user.name}</h1>
                  <p className="byline truncate">{session.user.email}</p>
                </div>
              </div>
              <div className="border-t border-wp-border pt-4 space-y-2 text-sm font-sans">
                <Link href="/account" className="block py-2 font-bold text-wp-black">Account</Link>
                <Link href="/account#alerts" className="block py-2 text-wp-gray hover:text-wp-black">Push alerts</Link>
                <Link href="#reading" className="block py-2 text-wp-gray hover:text-wp-black">Reading history ({history.length})</Link>
                <Link href="#reading" className="block py-2 text-wp-gray hover:text-wp-black">Saved stories ({bookmarks.length})</Link>
                <Link href="/newsletters" className="block py-2 text-wp-gray hover:text-wp-black">Newsletters</Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block w-full text-left py-2 text-wp-red hover:underline font-bold"
                >
                  Sign out
                </button>
              </div>
            </div>
          </aside>

          <section className="md:col-span-2 space-y-8">
            <div>
              <div className="border-b-4 border-wp-black pb-2 mb-4 flex items-baseline justify-between">
                <h2 className="headline text-2xl">Newsletter preferences</h2>
                {saving && <span className="byline text-wp-gray text-xs">Saving…</span>}
              </div>
              <p className="dek text-sm mb-5">
                Choose which newsletters land in your inbox. Changes save automatically.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {ALL_NEWSLETTERS.map((n) => (
                  <label
                    key={n.id}
                    className={
                      'border-2 p-4 flex gap-3 cursor-pointer transition ' +
                      (prefs[n.id] ? 'border-wp-black bg-wp-light' : 'border-wp-border bg-white hover:border-wp-black')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={!!prefs[n.id]}
                      onChange={() => toggle(n.id)}
                      className="mt-1 w-5 h-5 accent-wp-red"
                    />
                    <div>
                      <h3 className="headline text-base leading-tight">{n.name}</h3>
                      <p className="dek text-xs mt-0.5">{n.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div id="alerts">
              <div className="border-b-4 border-wp-black pb-2 mb-4 flex items-baseline justify-between">
                <h2 className="headline text-2xl flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-wp-red" /> Push alerts
                </h2>
                {push.supported && (
                  <span className="byline">
                    {push.subscribed ? (
                      <span className="text-wp-green">● Enabled</span>
                    ) : push.permission === 'denied' ? (
                      <span className="text-wp-gray">Blocked in browser</span>
                    ) : (
                      <span className="text-wp-gray">Off</span>
                    )}
                  </span>
                )}
              </div>
              {!push.supported ? (
                <p className="dek text-sm text-wp-gray">
                  Push notifications aren’t supported in this browser. Try again in Chrome, Edge, Safari or Firefox on a supported device.
                </p>
              ) : (
                <div>
                  <p className="dek text-sm mb-4">
                    Get breaking news, top opinions and the morning briefing sent straight to your device.
                  </p>
                  <div className="space-y-3 mb-4">
                    {[
                      { key: 'breaking', label: 'Breaking news', desc: 'Major developments as they happen' },
                      { key: 'opinions', label: 'Opinion alerts', desc: 'Top columns from our columnists' },
                      { key: 'morning', label: 'Morning briefing', desc: 'Daily digest at 7 a.m. ET' },
                    ].map((t) => {
                      const key = t.key as keyof typeof push.topics;
                      return (
                        <label key={t.key} className="flex items-start gap-3 cursor-pointer p-3 border border-wp-border hover:border-wp-black transition bg-white">
                          <input
                            type="checkbox"
                            checked={push.topics[key]}
                            disabled={!push.subscribed || push.loading}
                            onChange={(e) => push.updateTopics({ ...push.topics, [key]: e.target.checked })}
                            className="mt-1 w-5 h-5 accent-wp-red"
                          />
                          <span className="flex-1">
                            <span className="block font-sans font-bold text-sm">{t.label}</span>
                            <span className="block dek text-xs">{t.desc}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  {push.error && <p className="text-wp-red text-xs mb-3 font-sans">{push.error}</p>}
                  {push.subscribed ? (
                    <button
                      onClick={push.unsubscribe}
                      disabled={push.loading}
                      className="text-xs font-sans font-bold uppercase tracking-wider text-wp-red hover:underline tap-target"
                    >
                      {push.loading ? 'Working…' : 'Turn off all alerts'}
                    </button>
                  ) : (
                    <button
                      onClick={() => push.subscribe()}
                      disabled={push.loading || push.permission === 'denied'}
                      className="bg-wp-black text-white px-5 py-2.5 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition disabled:opacity-50 tap-target"
                    >
                      {push.permission === 'denied' ? 'Enable in browser settings' : push.loading ? 'Working…' : 'Enable alerts'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div id="reading" className="mt-10">
              <div className="border-b-4 border-wp-black pb-2 mb-4 flex items-baseline justify-between">
                <h2 className="headline text-2xl">Reading history & saved</h2>
                {readingReady && (
                  <span className="byline text-wp-gray">
                    {history.length} recent · {bookmarks.length} saved
                  </span>
                )}
              </div>
              <p className="dek text-sm text-wp-gray mb-4">
                Progress is saved automatically as you scroll. Export your library to move it between devices.
              </p>
              <ReadingHistoryClient />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
