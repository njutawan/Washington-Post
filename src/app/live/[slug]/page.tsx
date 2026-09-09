import { notFound } from 'next/navigation';
import { getLiveUpdates, KNOWN_LIVE_BLOGS, LIVE_BLOG_CANONICAL_SLUGS } from '@/lib/liveData';
import LiveBlogPageClient from './LiveBlogClient';
import { absoluteUrl, breadcrumbJsonLd, liveBlogJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(KNOWN_LIVE_BLOGS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = KNOWN_LIVE_BLOGS[slug];
  if (!meta) return { title: 'Live updates' };
  const canonicalSlug = (LIVE_BLOG_CANONICAL_SLUGS as string[]).includes(slug)
    ? slug
    : 'shutdown-deal';
  const url = absoluteUrl(`/live/${canonicalSlug}`);
  return {
    title: `LIVE: ${meta.title}`,
    description: meta.dek,
    alternates: { canonical: `/live/${canonicalSlug}` },
    openGraph: {
      type: 'article',
      url,
      title: `LIVE: ${meta.title}`,
      description: meta.dek,
      siteName: 'The Washington Post',
    },
    twitter: {
      card: 'summary_large_image',
      title: `LIVE: ${meta.title}`,
      description: meta.dek,
    },
  };
}

export default async function LiveBlogPage({ params }: Props) {
  const { slug } = await params;
  const meta = KNOWN_LIVE_BLOGS[slug];
  if (!meta) notFound();

  const initialUpdates = getLiveUpdates(slug);
  const canonicalSlug = (LIVE_BLOG_CANONICAL_SLUGS as string[]).includes(slug)
    ? slug
    : 'shutdown-deal';

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            liveBlogJsonLd({
              slug: canonicalSlug,
              title: meta.title,
              dek: meta.dek,
              updates: initialUpdates,
            }),
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
