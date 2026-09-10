'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { showToast } from '@/components/Toaster';

type Newsletter = {
  id: string;
  name: string;
  frequency: string;
  desc: string;
  color: string;
  icon: string;
  category: string;
  preview: {
    subject: string;
    lede: string;
  };
};

const CATEGORIES = ['News', 'Opinion', 'Life & Style', 'Advice', 'Special'] as const;

const newsletters: Newsletter[] = [
  { id: 'morning-mix', name: 'The Morning Mix', frequency: 'Weekdays · 6 a.m. ET', desc: 'The day\u2019s essential news and commentary, before sunrise.', color: 'bg-wp-red', icon: '🌅', category: 'News',
    preview: { subject: 'The shutdown deadline is here. Here\u2019s what you need to know.', lede: 'House Republicans scrambled overnight to pass a short-term CR as a midnight shutdown loomed — here are the four things to watch today.' } },
  { id: 'evening-update', name: 'The Evening Update', frequency: 'Weekdays · 5 p.m. ET', desc: 'What happened today and what to expect tomorrow.', color: 'bg-slate-800', icon: '🌆', category: 'News',
    preview: { subject: 'Tonight\u2019s must-reads', lede: 'From the campaign trail to the latest jobs numbers, catch up on every major story in under five minutes.' } },
  { id: 'post-reports', name: 'Post Reports', frequency: 'Daily podcast newsletter', desc: 'The big story of the day, with a link to listen.', color: 'bg-wp-black', icon: '🎧', category: 'News',
    preview: { subject: 'Post Reports: Why the Senate deal fell apart', lede: 'Our congressional correspondent walks us through the last 12 hours on the Hill.' } },
  { id: 'politics-extra', name: 'Politics Extra', frequency: 'Weekdays · noon & 5 p.m.', desc: 'Campaigns, Congress, and the White House.', color: 'bg-blue-700', icon: '🏛️', category: 'News',
    preview: { subject: 'The whip count that will decide today', lede: 'A headcount of where every Republican stands on the CR as leadership heads to the floor.' } },
  { id: 'daily-202', name: 'The Daily 202', frequency: 'Weekday mornings', desc: 'Your essential guide to the day in politics.', color: 'bg-blue-900', icon: '📋', category: 'News',
    preview: { subject: 'The five things everyone in Washington is talking about', lede: 'A new poll has bad news for both parties — plus: the one question nobody is asking.' } },
  { id: 'wellbeing', name: 'Well+Being', frequency: 'Tuesdays & Thursdays', desc: 'Science-backed advice for body and mind.', color: 'bg-green-700', icon: '🧘', category: 'Life & Style',
    preview: { subject: 'Walking 1,000 more steps a day may help your heart', lede: 'A new study adds to a growing body of evidence that small, consistent movement matters most.' } },
  { id: 'food', name: 'Voraciously', frequency: 'Wednesdays', desc: 'Recipes, cooking tips, and restaurant news.', color: 'bg-orange-600', icon: '🍳', category: 'Life & Style',
    preview: { subject: '25 weeknight dinners under 30 minutes', lede: 'Sheet-pan salmon, one-pot pasta, and a weeknight stir-fry that beats takeout.' } },
  { id: 'travel', name: 'By The Way', frequency: 'Thursdays', desc: 'Travel tips, deals, and destination ideas.', color: 'bg-sky-700', icon: '✈️', category: 'Life & Style',
    preview: { subject: 'The 10 new direct flights we\u2019re excited about this fall', lede: 'From a new Tokyo route on Delta to an Air Baltic flight to the Baltics for under $300.' } },
  { id: 'opinion-today', name: 'Opinion Today', frequency: 'Weekdays · 7 a.m.', desc: 'The best columns and editorials.', color: 'bg-purple-800', icon: '💬', category: 'Opinion',
    preview: { subject: 'The court is about to make itself very unpopular', lede: 'Jennifer Rubin argues the upcoming docket could damage the court\u2019s legitimacy for a generation.' } },
  { id: 'tech-friending', name: 'Tech Friending', frequency: 'Mondays', desc: 'Making sense of tech and how it shapes our lives.', color: 'bg-cyan-700', icon: '📱', category: 'Life & Style',
    preview: { subject: 'Why your phone is (finally) getting better at photos again', lede: 'AI image processing has quietly crossed a line — here\u2019s what that means for you.' } },
  { id: 'book-club', name: 'The Book Club', frequency: 'Monthly', desc: 'Read along with our critics and authors.', color: 'bg-amber-700', icon: '📚', category: 'Life & Style',
    preview: { subject: 'This month: a novel that feels like a classic', lede: 'Our critic picks a quiet masterpiece that deserves every bit of its buzz.' } },
  { id: 'advice', name: 'Ask Carolyn', frequency: 'Weekdays', desc: 'Carolyn Hax answers your relationship questions.', color: 'bg-rose-700', icon: '💌', category: 'Advice',
    preview: { subject: 'My sibling ghosted the family. Is it finally time to reach out?', lede: 'Carolyn weighs in on when grace gives way to self-respect.' } },
  { id: 'weather', name: 'Capital Weather Gang', frequency: 'Daily during storms', desc: 'D.C.-area weather forecasts and severe-weather alerts.', color: 'bg-indigo-700', icon: '⛅', category: 'News',
    preview: { subject: 'A soggy weekend is on the way for the DMV', lede: 'Timing: when to expect rain, and how much, through Monday morning.' } },
  { id: 'games', name: 'Games & Crosswords', frequency: 'Daily', desc: 'The Mini, classic crossword, On the Record, and more.', color: 'bg-emerald-700', icon: '🧩', category: 'Special',
    preview: { subject: 'Today\u2019s Mini: solve in under a minute?', lede: 'Plus: a Wednesday crossword that\u2019s harder than it looks.' } },
];

export default function NewslettersPage() {
  const { data: session, status } = useSession();
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({ 'morning-mix': true });
  const [email, setEmail] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [activeCat, setActiveCat] = useState<string>('All');
  const [previewOf, setPreviewOf] = useState<string | null>(null);

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
      } else {
        showToast(next[id] ? 'Added to your selections' : 'Removed from your selections');
      }
      return next;
    });
  };

  const subscribedCount = Object.values(subscribed).filter(Boolean).length;
  const filtered = activeCat === 'All' ? newsletters : newsletters.filter((n) => n.category === activeCat);

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6 md:py-8">
        <Breadcrumbs items={[{ label: 'Newsletters', href: '/newsletters' }]} />

        <div className="border-b-4 border-wp-black mb-8 pb-4">
          <p className="kicker text-wp-red mb-1">Newsletters</p>
          <h1 className="masthead-title text-4xl md:text-6xl mb-3">Find your inbox routine.</h1>
          <p className="dek text-lg max-w-2xl text-wp-gray">
            Hand-curated newsletters from our award-winning newsroom — {newsletters.length} of them,
            each with a clear cadence and mission. Always free.
          </p>
          {status === 'authenticated' ? (
            <p className="byline mt-3 text-wp-black">
              Signed in as <span className="font-bold">{session.user?.email}</span>
            </p>
          ) : (
            <p className="byline mt-3">
              <Link href="/signin?callbackUrl=/newsletters" className="text-wp-link underline font-bold">Sign in</Link>{' '}
              to sync your newsletters across devices.
            </p>
          )}
        </div>

        {status !== 'authenticated' && (
          <div className="bg-wp-black text-white p-6 mb-8 flex flex-col md:flex-row items-stretch gap-4">
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

        {/* Category tabs */}
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-baseline gap-1 flex-wrap">
            {['All', ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setActiveCat(c)}
                className={
                  'px-3 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider transition tap-target ' +
                  (activeCat === c ? 'bg-wp-black text-white' : 'text-wp-gray hover:text-wp-black')
                }
              >
                {c}
              </button>
            ))}
          </div>
          {subscribedCount > 0 && (
            <p className="text-sm font-sans font-bold text-wp-red">{subscribedCount} selected</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          {filtered.map((n) => (
            <div
              key={n.id}
              className={
                'border-2 p-5 transition bg-white ' +
                (subscribed[n.id] ? 'border-wp-black bg-wp-light' : 'border-wp-border hover:border-wp-black')
              }
            >
              <div className="flex gap-4">
                <button
                  onClick={() => toggle(n.id)}
                  aria-label={`Toggle ${n.name}`}
                  aria-pressed={!!subscribed[n.id]}
                  className={'w-14 h-14 ' + n.color + ' text-white flex items-center justify-center text-2xl flex-shrink-0 tap-target hover:opacity-90 transition'}
                >
                  {n.icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="headline text-lg leading-tight">{n.name}</h3>
                      <p className="byline text-wp-red mb-1">{n.frequency}</p>
                    </div>
                    <button
                      onClick={() => toggle(n.id)}
                      className={
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition tap-target ' +
                        (subscribed[n.id] ? 'bg-wp-red border-wp-red text-white' : 'border-wp-border hover:border-wp-black')
                      }
                      aria-label={subscribed[n.id] ? 'Unsubscribe' : 'Subscribe'}
                    >
                      {subscribed[n.id] && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </button>
                  </div>
                  <p className="dek text-sm mt-1">{n.desc}</p>
                  <button
                    onClick={() => setPreviewOf(previewOf === n.id ? null : n.id)}
                    className="mt-2 text-[11px] font-sans uppercase tracking-wider text-wp-link hover:underline tap-target"
                    aria-expanded={previewOf === n.id}
                  >
                    {previewOf === n.id ? 'Hide preview' : 'Preview a recent issue →'}
                  </button>
                </div>
              </div>
              {previewOf === n.id && (
                <div className="mt-4 ml-0 sm:ml-[72px] bg-wp-cream border-l-4 border-wp-red pl-4 pr-3 py-3">
                  <p className="kicker text-wp-gray text-[10px] mb-1">Subject line</p>
                  <p className="font-serif font-bold text-wp-ink leading-snug mb-2">{n.preview.subject}</p>
                  <p className="font-serif italic text-wp-ink text-sm leading-relaxed">{n.preview.lede}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center border-t border-wp-border pt-8">
          <button
            className="bg-wp-black text-white px-10 py-4 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition disabled:opacity-40 tap-target"
            disabled={subscribedCount === 0 || (status !== 'authenticated' && !email)}
            onClick={() => {
              setSavedMsg(status === 'authenticated' ? 'Preferences saved!' : 'Subscribed! Check your inbox to confirm.');
              showToast(status === 'authenticated' ? 'Preferences saved' : `Subscribed to ${subscribedCount} newsletter${subscribedCount !== 1 ? 's' : ''}`);
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
