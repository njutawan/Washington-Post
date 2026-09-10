import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { EPISODES } from '@/lib/podcast';
import PodcastEpisodeList from './PodcastEpisodeList';
import AdSlot from '@/components/AdSlot';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Post Reports Podcast — The Washington Post',
  description: 'Twenty minutes, every weekday.',
};

export default function PodcastsPage() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-8">
        <p className="kicker text-wp-red">Podcasts</p>
        <h1 className="headline text-4xl md:text-5xl mb-3">Post Reports</h1>
        <p className="dek text-lg max-w-2xl mb-2">
          The Washington Post&apos;s flagship daily news show. Twenty minutes,
          every weekday — hosted by Martine Powers.
        </p>
        <Link
          href="/api/podcasts/rss"
          className="inline-block text-xs font-sans uppercase tracking-wider text-wp-link hover:underline mb-6"
        >
          Subscribe via RSS ↗
        </Link>

        <AdSlot slot="top-banner" className="mb-8" />

        <PodcastEpisodeList episodes={EPISODES} />
      </main>
      <Footer />
    </div>
  );
}
