'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';

const newsletters = [
  { id: 'morning-mix', name: 'The Morning Mix', frequency: 'Weekdays, 6 a.m. ET', desc: 'The day\u2019s essential news and commentary, before sunrise.', color: 'bg-wp-red', icon: '🌅' },
  { id: 'post-reports', name: 'Post Reports', frequency: 'Daily podcast', desc: 'The big story of the day, in 20 minutes.', color: 'bg-wp-black', icon: '🎧' },
  { id: 'politics-extra', name: 'Politics Extra', frequency: 'Weekdays, noon & 5 p.m.', desc: 'Campaigns, Congress, and the White House — straight to your inbox.', color: 'bg-blue-700', icon: '🏛️' },
  { id: 'wellbeing', name: 'Well+Being', frequency: 'Tuesdays & Thursdays', desc: 'Science-backed advice for body and mind.', color: 'bg-green-700', icon: '🧘' },
  { id: 'food', name: 'Voraciously', frequency: 'Wednesdays', desc: 'Recipes, cooking tips, and restaurant news.', color: 'bg-orange-600', icon: '🍳' },
  { id: 'opinion-today', name: 'Opinion Today', frequency: 'Weekdays, 7 a.m.', desc: 'The best columns and editorials from our board and contributors.', color: 'bg-purple-800', icon: '💬' },
  { id: 'tech-friending', name: 'Tech Friending', frequency: 'Mondays', desc: 'Making sense of tech and how it shapes our lives.', color: 'bg-cyan-700', icon: '📱' },
  { id: 'book-club', name: 'The Book Club', frequency: 'Monthly', desc: 'Read along with our critics and authors.', color: 'bg-amber-700', icon: '📚' },
];

export default function NewslettersPage() {
  const { data: session, status } = useSession();
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({ 'morning-mix': true });
  const [email, setEmail] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      setEmail(session.user?.email || '');
      fetch('/api/newsletters')
        .then((r) => r.json())
        .then((d) => {
          if (d.preferences && Object.keys(d.preferences).length) {
            setSubscribed((prev) => ({ ...prev, ...d.preferences }));
          }
        })
        .catch(() => {});
    }
  }, [status, session]);

  const toggle = (id: string) => {
    setSubscribed((s) => {
      const next = { ...s, [id]: !s[id] };
      if (status === 'authenticated') {
        setSavedMsg(null);
        fetch('/api/newsletters', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences: next }),
        }).then(() => {
          setSavedMsg('Preferences saved to your account.');
          setTimeout(() => setSavedMsg(null), 2500);
        });
      }
      return next;
    });
  };

  const subscribedCount = Object.values(subscribed).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6">
        <Breadcrumbs items={[{ label: 'Newsletters', href: '/newsletters' }]} />

        <div className="border-b-4 border-wp-black mb-8 pb-4">
          <p className="kicker text-wp-red mb-1">Newsletters</p>
          <h1 className="masthead-title text-4xl md:text-6xl mb-3">Find your inbox routine.</h1>
          <p className="dek text-lg max-w-2xl text-wp-gray">
            Hand-curated newsletters from our award-winning newsroom. Pick the stories you want,
            delivered on your schedule. Always free.
          </p>
          {status === 'authenticated' && (
            <p className="byline mt-3 text-wp-black">
              Signed in as <span className="font-bold">{session.user?.email}</span> — selections sync across devices.
            </p>
          )}
          {status === 'unauthenticated' && (
            <p className="byline mt-3">
              <Link href="/signin?callbackUrl=/newsletters" className="text-wp-link underline font-bold">Sign in</Link>{' '}
              to sync your newsletters across devices.
            </p>
          )}
        </div>

        {/* Email bar — hidden if signed in (we already know your email) */}
        {status !== 'authenticated' && (
          <div className="bg-wp-black text-white p-6 mb-10 flex flex-col md:flex-row items-stretch gap-4">
            <div className="flex-1">
              <p className="kicker text-wp-red mb-1 text-white">Step 1</p>
              <h2 className="headline text-xl mb-1">Enter your email</h2>
              <p className="text-sm font-sans text-gray-300">We&rsquo;ll only send you what you sign up for.</p>
            </div>
            <div className="flex-1 flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 bg-white text-wp-black font-serif outline-none"
                aria-label="Email"
              />
            </div>
          </div>
        )}

        <div className="flex items-baseline justify-between mb-6">
          <p className="kicker text-wp-black text-sm">Step 2 · Choose your newsletters</p>
          {subscribedCount > 0 && (
            <p className="text-sm font-sans font-bold text-wp-red">
              {subscribedCount} selected
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {newsletters.map((n) => (
            <div
              key={n.id}
              className={
                'border-2 p-5 flex gap-4 transition cursor-pointer ' +
                (subscribed[n.id] ? 'border-wp-black bg-wp-light' : 'border-wp-border bg-white hover:border-wp-black')
              }
              onClick={() => toggle(n.id)}
              role="checkbox"
              aria-checked={!!subscribed[n.id]}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(n.id); } }}
            >
              <div className={'w-14 h-14 ' + n.color + ' text-white flex items-center justify-center text-2xl flex-shrink-0'} aria-hidden="true">
                {n.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="headline text-lg leading-tight">{n.name}</h3>
                    <p className="byline text-wp-red mb-1">{n.frequency}</p>
                  </div>
                  <div
                    className={
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition ' +
                      (subscribed[n.id] ? 'bg-wp-red border-wp-red text-white' : 'border-wp-border')
                    }
                    aria-hidden="true"
                  >
                    {subscribed[n.id] && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                </div>
                <p className="dek text-sm mt-1">{n.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            className="bg-wp-black text-white px-10 py-4 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition disabled:opacity-40 tap-target"
            disabled={subscribedCount === 0 || (status !== 'authenticated' && !email)}
            onClick={() => {
              setSavedMsg(status === 'authenticated' ? 'Preferences saved!' : 'Subscribed! Check your inbox to confirm.');
              setTimeout(() => setSavedMsg(null), 3000);
            }}
          >
            {status === 'authenticated' ? 'Save preferences' : `Subscribe to ${subscribedCount} newsletter${subscribedCount !== 1 ? 's' : ''}`}
          </button>
          {savedMsg && <p className="text-sm font-sans text-wp-green mt-3" role="status">{savedMsg}</p>}
          <p className="text-xs font-sans text-wp-gray mt-3">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
