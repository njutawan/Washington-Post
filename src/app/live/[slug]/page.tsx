import { notFound } from 'next/navigation';
import { getLiveUpdates, KNOWN_LIVE_BLOGS } from '@/lib/liveData';
import LiveBlogPageClient from './LiveBlogClient';
import { breadcrumbJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

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
