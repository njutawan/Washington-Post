import { notFound } from 'next/navigation';
import { getLiveUpdates } from '@/lib/liveData';
import LiveBlogPageClient from './LiveBlogClient';
import { breadcrumbJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

const KNOWN_LIVE_BLOGS: Record<string, { title: string; dek: string }> = {
  'shutdown-deal': {
    title: 'Government shutdown countdown: House passes short-term bill, sending it to Senate',
    dek: 'Follow here for the latest as lawmakers race to beat Sunday’s midnight deadline.',
  },
  'shutdown-countdown': {
    title: 'Government shutdown countdown: House passes short-term bill, sending it to Senate',
    dek: 'Follow here for the latest as lawmakers race to beat Sunday’s midnight deadline.',
  },
};

export function generateStaticParams() {
  return Object.keys(KNOWN_LIVE_BLOGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = KNOWN_LIVE_BLOGS[slug];
  if (!meta) return { title: 'Live updates' };
  return {
    title: `LIVE: ${meta.title}`,
    description: meta.dek,
    openGraph: { title: `LIVE: ${meta.title}`, description: meta.dek },
  };
}

export default async function LiveBlogPage({ params }: Props) {
  const { slug } = await params;
  const meta = KNOWN_LIVE_BLOGS[slug];
  if (!meta) notFound();

  const initialUpdates = getLiveUpdates(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', item: '/' },
              { name: 'Politics', item: '/politics' },
              { name: 'Live Updates' },
            ]),
          ),
        }}
      />
      <LiveBlogPageClient
        slug={slug}
        title={meta.title}
        dek={meta.dek}
        initialUpdates={initialUpdates}
      />
    </>
  );
}
