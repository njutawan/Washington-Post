import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { EPISODES } from '@/lib/podcast';
import PodcastEpisodeList from './PodcastEpisodeList';
import AdSlot from '@/components/AdSlot';
import ArticleImage from '@/components/ArticleImage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post Reports Podcast — The Washington Post',
  description: 'Twenty minutes, every weekday.',
};

const PODCASTS = [
  {
    name: 'Post Reports',
    host: 'Martine Powers',
    cadence: 'Daily · ~20 min',
    color: 'bg-wp-red',
    blurb: 'The Washington Post\u2019s flagship daily news show.',
    image: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80',
    slug: 'post-reports',
  },
  {
    name: 'The Daily 202',
    host: 'James Hohmann',
    cadence: 'Weekday mornings',
    color: 'bg-blue-800',
    blurb: 'Your essential guide to the day in politics, in 15 minutes.',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
    slug: 'daily-202',
  },
  {
    name: 'The Retiring Guy',
    host: 'Gene Weingarten',
    cadence: 'Weekly',
    color: 'bg-amber-700',
    blurb: 'A Pulitzer-winning columnist on life, laughs, and loose ends.',
    image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80',
    slug: 'retiring-guy',
  },
  {
    name: 'Can He Do That?',
    host: 'Allison Michaels + Toluse Olorunnipa',
    cadence: 'Weekly',
    color: 'bg-purple-800',
    blurb: 'Legal experts break down the biggest questions about presidential power.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80',
    slug: 'can-he-do-that',
  },
];

export default function PodcastsPage() {
  const latest = EPISODES[0];
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6 md:py-8">
        <p className="kicker text-wp-red">Audio</p>
        <div className="border-b-4 border-wp-black pb-6 mb-6 md:mb-8">
          <h1 className="masthead-title text-4xl md:text-6xl lg:text-7xl mb-2 leading-none">Podcasts</h1>
          <p className="dek text-lg max-w-2xl">
            Daily news, long-form storytelling, and opinion from Washington Post reporters —
            wherever you listen.
          </p>
        </div>

        {/* Featured episode — big artwork */}
        <section className="grid md:grid-cols-5 gap-6 mb-10 items-center">
          <div className="md:col-span-2 relative">
            <div className="relative aspect-square w-full max-w-[360px] bg-wp-black overflow-hidden border-4 border-wp-black shadow-[8px_8px_0_0_rgba(178,20,20,1)]">
              {latest.image ? (
                <ArticleImage src={latest.image} alt={latest.title} fill className="object-cover" sizes="(max-width: 768px) 80vw, 360px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-display font-black text-2xl">PR</div>
              )}
              <div className="absolute top-3 left-3 bg-wp-red text-white px-2 py-1 font-sans font-black uppercase tracking-widest text-[10px]">
                New
              </div>
            </div>
          </div>
          <div className="md:col-span-3">
            <p className="kicker text-wp-red mb-2">Latest episode · Post Reports</p>
            <h2 className="headline text-3xl md:text-4xl leading-tight mb-3">{latest.title}</h2>
            <p className="dek text-base md:text-lg mb-4">{latest.description}</p>
            <p className="byline text-wp-gray mb-5">
              {latest.author} · {new Date(latest.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              {' · '}{latest.durationLabel}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#episodes"
                className="inline-flex items-center gap-2 bg-wp-black text-white px-6 py-3 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition tap-target"
              >
                <span aria-hidden>▶</span> Listen now
              </Link>
              <Link
                href="/api/podcasts/rss"
                className="inline-flex items-center gap-2 border-2 border-wp-black px-5 py-3 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition tap-target"
              >
                RSS feed
              </Link>
            </div>

            {/* Subscribe buttons */}
            <div className="mt-6 pt-5 border-t border-wp-border">
              <p className="text-[11px] font-sans uppercase tracking-widest text-wp-gray mb-3">
                Subscribe on your favorite app
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Apple Podcasts', bg: 'bg-[#8728f2]', href: 'https://podcasts.apple.com/' },
                  { name: 'Spotify', bg: 'bg-[#1DB954]', href: 'https://open.spotify.com/' },
                  { name: 'Google Podcasts', bg: 'bg-[#4285F4]', href: 'https://podcasts.google.com/' },
                  { name: 'Stitcher', bg: 'bg-black', href: 'https://www.stitcher.com/' },
                ].map((p) => (
                  <a
                    key={p.name}
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 ${p.bg} text-white px-3.5 py-2 text-[11px] font-sans font-bold uppercase tracking-wider hover:opacity-90 transition tap-target`}
                  >
                    {p.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <AdSlot slot="top-banner" className="mb-10" />

        {/* All Post podcasts grid */}
        <section className="mb-10">
          <div className="border-t-4 border-b border-wp-black py-2 mb-5 flex items-baseline justify-between">
            <h2 className="headline text-xl md:text-2xl">All Post podcasts</h2>
            <span className="text-xs font-sans uppercase tracking-wider text-wp-gray">Free for everyone</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {PODCASTS.map((p) => (
              <div key={p.slug} className="group">
                <div className="relative aspect-square w-full overflow-hidden border-2 border-wp-black mb-3">
                  <ArticleImage src={p.image} alt={p.name} fill sizes="(max-width: 768px) 40vw, 20vw" className="object-cover group-hover:scale-105 transition duration-500" />
                  <div className={`absolute bottom-2 left-2 ${p.color} text-white px-2 py-0.5 text-[10px] font-sans font-bold uppercase tracking-wider`}>
                    {p.cadence}
                  </div>
                </div>
                <h3 className="headline text-base font-bold leading-tight group-hover:text-wp-link mb-1">{p.name}</h3>
                <p className="byline text-wp-gray text-[11px] mb-1">Hosted by {p.host}</p>
                <p className="font-serif text-wp-ink text-[13px] leading-snug">{p.blurb}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Episode list */}
        <section id="episodes">
          <div className="border-t-4 border-b border-wp-black py-2 mb-4 flex items-baseline justify-between">
            <h2 className="headline text-xl md:text-2xl">Latest episodes</h2>
          </div>
          <PodcastEpisodeList episodes={EPISODES} />
        </section>
      </main>
      <Footer />
    </div>
  );
}
