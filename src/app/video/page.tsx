import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { getAllVideos } from '@/lib/videoData';
import { siteMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video - The Washington Post',
  description: 'Watch the latest news video, original reporting and documentary shorts from The Washington Post.',
  alternates: { canonical: '/video' },
  openGraph: {
    type: 'website',
    url: 'https://washingtonpost-clone.example.com/video',
    title: 'Video - The Washington Post',
    description: 'Watch the latest news video, original reporting and documentary shorts from The Washington Post.',
    siteName: 'The Washington Post',
  },
};

export default function VideoHub() {
  const videos = getAllVideos();
  const [lead, ...rest] = videos;

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-4 md:py-6">
        <div className="border-t-4 border-wp-black border-b py-3 mb-6 flex items-baseline gap-3">
          <span className="kicker text-wp-red text-sm md:text-base uppercase tracking-[0.2em] font-bold">Video</span>
          <h1 className="headline text-xl md:text-2xl">Watch the latest</h1>
        </div>

        {lead && (
          <Link href={`/video/${lead.slug}`} className="block group mb-10">
            <div className="relative aspect-video bg-black overflow-hidden mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lead.thumbnail} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-20 h-20 flex items-center justify-center rounded-full bg-wp-red/90 text-white shadow-lg">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              </div>
              <span className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-0.5 tabular-nums font-sans">{lead.duration}</span>
            </div>
            <div className="kicker text-wp-red text-sm uppercase tracking-[0.15em] font-bold mb-2">{lead.category}</div>
            <h2 className="headline text-2xl md:text-3xl lg:text-4xl leading-tight mb-2 group-hover:text-wp-link">{lead.title}</h2>
            <p className="font-serif italic text-wp-ink text-lg max-w-3xl">{lead.description}</p>
          </Link>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((v) => (
            <Link key={v.id} href={`/video/${v.slug}`} className="group block">
              <div className="relative aspect-video bg-black overflow-hidden mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
                  <span className="w-14 h-14 flex items-center justify-center rounded-full bg-wp-red/90 text-white shadow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] px-1.5 py-0.5 tabular-nums font-sans">{v.duration}</span>
              </div>
              <div className="kicker text-wp-red text-[11px] uppercase tracking-[0.15em] font-bold mb-1">{v.category}</div>
              <h3 className="headline text-lg md:text-xl leading-snug group-hover:text-wp-link">{v.title}</h3>
              <div className="text-xs font-sans text-wp-gray mt-1">{v.byline}</div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
