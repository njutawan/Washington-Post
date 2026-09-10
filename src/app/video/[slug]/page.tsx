import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import VideoPlayer from '@/components/VideoPlayer';
import Sidebar from '@/components/Sidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { getVideoBySlug, getAllVideos } from '@/lib/videoData';
import { getArticleBySlug } from '@/lib/data';
import { videoMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return getAllVideos().map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) return {};
  return videoMetadata({
    title: video.title,
    description: video.description,
    slug: video.slug,
    thumbnail: video.thumbnail,
  });
}

export default async function VideoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const video = getVideoBySlug(slug);
  if (!video) notFound();

  const relatedArticles = (video.related || [])
    .map((s) => getArticleBySlug(s))
    .filter(Boolean)
    .slice(0, 3);
  const otherVideos = getAllVideos().filter((v) => v.slug !== slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-4 md:py-6">
        <nav aria-label="Breadcrumb" className="text-xs font-sans text-wp-gray mb-3">
          <Link href="/" className="hover:text-wp-link hover:underline">Home</Link>
          <span aria-hidden="true"> › </span>
          <Link href={`/${video.categorySlug}`} className="hover:text-wp-link hover:underline">{video.category}</Link>
          <span aria-hidden="true"> › </span>
          <Link href="/video" className="hover:text-wp-link hover:underline">Video</Link>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <VideoPlayer src={video.src} poster={video.thumbnail} title={video.title} />

            <div className="mt-4">
              <div className="kicker text-wp-red text-sm uppercase tracking-[0.15em] font-bold mb-2">
                <Link href={`/${video.categorySlug}`} className="hover:underline">{video.category}</Link>
                <span className="text-wp-gray font-normal tracking-normal normal-case ml-2">· {video.duration}</span>
              </div>
              <h1 className="headline text-2xl md:text-3xl lg:text-4xl leading-tight mb-3">{video.title}</h1>
              <div className="byline flex items-center gap-2 text-sm text-wp-gray pb-4 border-b border-wp-border">
                <span className="font-bold text-wp-black">{video.byline}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={video.publishedAt}>
                  {new Date(video.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </time>
              </div>

              <p className="mt-4 text-base md:text-lg font-serif leading-relaxed text-wp-ink">
                {video.description}
              </p>

              {relatedArticles.length > 0 && (
                <section className="mt-8 pt-6 border-t border-wp-border">
                  <h2 className="kicker text-wp-red text-sm uppercase tracking-[0.15em] font-bold mb-4">Related coverage</h2>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {relatedArticles.map((a) => a && (
                      <ArticleCard key={a.slug} article={a} variant="small" showCategory={false} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <aside className="lg:col-span-4 lg:border-l lg:border-wp-border lg:pl-6">
            <h2 className="kicker text-wp-black text-sm uppercase tracking-[0.15em] mb-3 border-b border-wp-border pb-2">More Video</h2>
            <ul className="space-y-4 mb-8">
              {otherVideos.map((v) => (
                <li key={v.id}>
                  <Link href={`/video/${v.slug}`} className="group flex gap-3 items-start">
                    <div className="w-32 flex-shrink-0 relative aspect-video bg-black overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition" loading="lazy" />
                      <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded tabular-nums">{v.duration}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-[11px] text-wp-red uppercase tracking-wider font-sans font-bold mb-1">{v.category}</div>
                      <div className="headline text-sm leading-snug group-hover:text-wp-link">{v.title}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Sidebar />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
