'use client';

import Link from 'next/link';
import { opinions, getAllArticles } from '@/lib/data';
import WeatherWidget from './WeatherWidget';
import PodcastPlayer from './PodcastPlayer';
import RecentlyReadRail from './RecentlyReadRail';
import AdSlot from './AdSlot';
import MostRead from './MostRead';
import { useReading } from '@/components/ReadingProvider';

function SavedList() {
  const { bookmarks, ready } = useReading();

  if (!ready) return null;

  const articles = bookmarks
    .map((s) => getAllArticles().find((a) => a.slug === s))
    .filter(Boolean)
    .slice(0, 5);

  if (articles.length === 0) {
    return (
      <section className="border-t-4 border-wp-black pt-3">
        <h2 className="kicker text-wp-black text-sm mb-3">Saved for Later</h2>
        <p className="text-xs font-sans text-wp-gray italic">
          Tap the bookmark icon on any story to save it here.
        </p>
      </section>
    );
  }

  return (
    <section className="border-t-4 border-wp-black pt-3">
      <h2 className="kicker text-wp-black text-sm mb-3">Saved for Later ({bookmarks.length})</h2>
      <ul className="space-y-0">
        {articles.map((a) => a && (
          <li key={a.id} className="py-3 border-b border-wp-border last:border-b-0">
            <Link href={`/article/${a.slug}`} className="headline text-sm leading-snug hover:text-wp-link font-semibold block">
              {a.title}
            </Link>
            {a.time && <p className="byline mt-1">{a.time}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Sidebar() {
  return (
    <aside className="space-y-8">
      <PodcastPlayer />

      <div className="border border-wp-border bg-white">
        <WeatherWidget />
      </div>

      <RecentlyReadRail />

      {/* Most Read (right rail) */}
      <MostRead />

      <div className="py-2 flex justify-center">
        <AdSlot slot="sidebar" />
      </div>

      {/* Opinions teaser — compact column in sidebar, 2 items with tiny round avatars */}
      <section>
        <div className="flex items-baseline justify-between border-t-4 border-wp-black pt-3 pb-2">
          <h2 className="kicker text-wp-red text-sm uppercase tracking-[0.15em] font-bold">Opinions</h2>
          <Link href="/opinions" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline">
            See all →
          </Link>
        </div>
        <ul className="space-y-0">
          {opinions.slice(0, 2).map((op) => (
            <li key={op.id} className="py-3 border-b border-wp-border last:border-b-0">
              <p className="kicker text-wp-gray mb-1">{op.kicker}</p>
              <Link
                href={`/article/${op.slug}`}
                className="headline italic font-serif text-base md:text-lg leading-snug hover:text-wp-link block mb-1"
              >
                &ldquo;{op.title}&rdquo;
              </Link>
              {op.byline && <p className="byline font-bold">{op.byline}</p>}
            </li>
          ))}
        </ul>
      </section>

      <SavedList />

      <div className="hidden xl:block py-2">
        <AdSlot slot="sticky-sidebar" />
      </div>

      <section className="border border-wp-black p-5 bg-white">
        <div className="kicker text-wp-red mb-2">Democracy Dies in Darkness</div>
        <h3 className="headline text-xl mb-2">Unlimited access to The Post.</h3>
        <p className="dek text-sm mb-4">
          Support fearless, independent journalism. Subscribers get unlimited access to every story,
          podcast and newsletter.
        </p>
        <a href="#" className="block text-center bg-wp-black text-white px-4 py-2 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition">
          Subscribe for $1/week
        </a>
        <a href="#" className="block text-center mt-2 text-xs font-sans text-wp-link hover:underline">
          Already a subscriber? Sign in
        </a>
      </section>
    </aside>
  );
}
