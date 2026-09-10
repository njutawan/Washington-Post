'use client';

import { useState } from 'react';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { usePaywall } from '@/lib/usePaywall';

type PlanId = 'digital' | 'allaccess' | 'student' | 'gift';

const PLANS: Array<{
  id: PlanId;
  name: string;
  eyebrow: string;
  price: string;
  period: string;
  strikethrough?: string;
  tagline: string;
  features: string[];
  cta: string;
  featured?: boolean;
  accent: 'black' | 'red';
}> = [
  {
    id: 'digital',
    name: 'Digital',
    eyebrow: 'Most popular for readers',
    price: '$1',
    period: '/ week for one year',
    strikethrough: '$4/week',
    tagline: 'Unlimited access to washingtonpost.com and our apps.',
    features: [
      'Unlimited articles on every device',
      'All podcasts and on-demand audio',
      'Subscriber-exclusive newsletters',
      'Early access to investigations',
      'Bookmark & share with family',
    ],
    cta: 'Subscribe to Digital',
    featured: true,
    accent: 'red',
  },
  {
    id: 'allaccess',
    name: 'All-Access',
    eyebrow: 'For the news junkie',
    price: '$2',
    period: '/ week for one year',
    strikethrough: '$8/week',
    tagline: 'Everything in Digital plus home delivery of the print newspaper.',
    features: [
      'Everything in the Digital plan',
      'Home delivery of The Washington Post',
      'The Washington Post Magazine',
      'Exclusive e-books & archival access',
      'Invitations to subscriber events',
    ],
    cta: 'Go All-Access',
    accent: 'black',
  },
  {
    id: 'student',
    name: 'Student',
    eyebrow: 'Verified .edu required',
    price: '$1',
    period: '/ month',
    tagline: 'A discounted plan for currently enrolled students.',
    features: [
      'All Digital features',
      'Campus newsletter bundle',
      'Cancel anytime during studies',
    ],
    cta: 'Verify student status',
    accent: 'black',
  },
  {
    id: 'gift',
    name: 'Gift',
    eyebrow: 'Give the Post',
    price: 'From $50',
    period: '/ year',
    tagline: 'Send unlimited access to a friend, family member, or educator.',
    features: [
      'Choose 3, 6, or 12 months',
      'Personalized gift message',
      'Instant email delivery',
      'No recurring charge to you',
    ],
    cta: 'Give a gift',
    accent: 'black',
  },
];

const BENEFITS = [
  { icon: '📰', title: 'Award-winning journalism', body: 'More Pulitzers over the past decade than nearly any other newsroom.' },
  { icon: '🎧', title: 'Podcasts & audio', body: 'Listen to Post Reports, The Daily 202, and narrated long-reads.' },
  { icon: '📬', title: '50+ newsletters', body: 'Beltway briefings, cooking, tech, parenting and more — ad-light.' },
  { icon: '🧩', title: 'Games & crosswords', body: 'Daily Mini, the classic crossword, and On the Record trivia.' },
  { icon: '🔒', title: 'Subscriber-only comments', body: 'Join the conversation beneath every story.' },
  { icon: '📱', title: 'Offline reading', body: 'Download articles in the app for your commute or flight.' },
];

export default function SubscribePage() {
  const [billingYearly, setBillingYearly] = useState(true);
  const { reset } = usePaywall();

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />

      <main id="main-content" className="wp-container py-8 md:py-12">
        {/* Masthead */}
        <div className="border-b-4 border-wp-black pb-6 mb-8 text-center max-w-3xl mx-auto">
          <p className="kicker text-wp-red mb-2">Subscribe to The Washington Post</p>
          <h1 className="masthead-title text-4xl md:text-6xl lg:text-7xl mb-3 leading-none">
            Real news, every day.
          </h1>
          <p className="dek text-lg max-w-2xl mx-auto">
            Independent reporting from the nation&rsquo;s capital and around the world.
            Choose the plan that fits how you read.
          </p>
        </div>

        {/* Billing toggle (simple demo) */}
        <div className="flex justify-center items-center gap-3 mb-10 text-sm font-sans">
          <button
            onClick={() => setBillingYearly(true)}
            className={
              'px-4 py-2 border-2 font-bold uppercase tracking-wider text-xs transition ' +
              (billingYearly ? 'bg-wp-black text-white border-wp-black' : 'bg-transparent border-wp-border text-wp-gray hover:border-wp-black hover:text-wp-black')
            }
          >
            Best value — annual
          </button>
          <button
            onClick={() => setBillingYearly(false)}
            className={
              'px-4 py-2 border-2 font-bold uppercase tracking-wider text-xs transition ' +
              (!billingYearly ? 'bg-wp-black text-white border-wp-black' : 'bg-transparent border-wp-border text-wp-gray hover:border-wp-black hover:text-wp-black')
            }
          >
            Monthly
          </button>
        </div>

        {/* Plan grid */}
        <div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto mb-14">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                'relative bg-white p-6 md:p-8 flex flex-col ' +
                (plan.featured
                  ? 'border-4 border-wp-black shadow-[8px_8px_0_0_rgba(178,20,20,1)]'
                  : 'border-2 border-wp-black')
              }
            >
              {plan.featured && (
                <div className="absolute -top-3 left-6 bg-wp-red text-white px-3 py-1 font-sans font-bold uppercase tracking-widest text-[10px]">
                  Most popular
                </div>
              )}
              <p className="text-[11px] font-sans uppercase tracking-[0.2em] text-wp-gray mb-2">{plan.eyebrow}</p>
              <h2 className="masthead-title text-3xl md:text-4xl mb-1">{plan.name}</h2>
              <div className="flex items-baseline gap-2 mb-1">
                <span className={'text-5xl font-display font-black ' + (plan.accent === 'red' ? 'text-wp-red' : 'text-wp-black')}>
                  {plan.price}
                </span>
                <span className="font-sans text-sm text-wp-black">{plan.period}</span>
              </div>
              {plan.strikethrough && (
                <p className="text-wp-gray line-through text-xs font-sans mb-3">{plan.strikethrough}</p>
              )}
              <p className="font-serif italic text-wp-ink mb-5">{plan.tagline}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 font-serif text-[15px] text-wp-ink leading-snug">
                    <span className="text-wp-red font-bold mt-0.5 leading-none">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => reset()}
                className={
                  'w-full py-3.5 font-sans font-bold uppercase text-sm tracking-wider transition tap-target ' +
                  (plan.accent === 'red'
                    ? 'bg-wp-red text-white hover:bg-wp-black'
                    : 'bg-wp-black text-white hover:bg-wp-red')
                }
              >
                {plan.cta}
              </button>
              <p className="mt-2 text-[11px] font-sans text-wp-gray text-center">
                New subscribers only. Cancel anytime.
              </p>
            </div>
          ))}
        </div>

        {/* Benefits grid */}
        <section className="max-w-5xl mx-auto mb-14">
          <div className="border-t-4 border-b border-wp-black py-3 mb-8 flex items-baseline justify-between">
            <h2 className="headline text-2xl">What you get</h2>
            <p className="byline hidden sm:block">Every plan includes these benefits.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white border-2 border-wp-black p-5">
                <div className="text-3xl mb-2" aria-hidden="true">{b.icon}</div>
                <h3 className="headline text-lg mb-1">{b.title}</h3>
                <p className="byline">{b.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Trust / FAQ */}
        <section className="max-w-3xl mx-auto border-t-2 border-wp-black pt-8">
          <h2 className="headline text-2xl mb-4">Frequently asked</h2>
          <div className="divide-y divide-wp-border">
            {[
              { q: 'Can I cancel anytime?', a: 'Yes. Cancel online or by calling our customer care line; your access continues through the end of your billing period.' },
              { q: 'What devices are supported?', a: 'Web, iOS, Android, Kindle Fire, and Apple News (All-Access only). Subscribers also get our Washington Post Select app.' },
              { q: 'Do you offer a group rate?', a: 'Yes — for newsrooms, classrooms, and enterprises. Contact our group subscriptions team.' },
              { q: 'How do I verify my student status?', a: 'We use SheerID to verify active .edu enrollment during checkout.' },
            ].map(({ q, a }) => (
              <details key={q} className="group py-4">
                <summary className="cursor-pointer flex items-baseline justify-between font-serif text-lg font-bold text-wp-black hover:text-wp-red tap-target list-none">
                  <span>{q}</span>
                  <span className="font-sans text-2xl leading-none transition-transform group-open:rotate-45 ml-4 flex-shrink-0">+</span>
                </summary>
                <p className="font-serif text-wp-ink mt-2 leading-relaxed pr-8">{a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="text-center mt-12">
          <p className="byline mb-3">Already a subscriber?</p>
          <Link
            href="/signin"
            className="inline-block border-2 border-wp-black px-6 py-3 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition"
          >
            Sign in to your account
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
