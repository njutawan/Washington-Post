import Link from 'next/link';
import ArticleImage from '@/components/ArticleImage';
import BookmarkButton from '@/components/BookmarkButton';
import BylineLink from '@/components/BylineLink';
import type { Article } from '@/lib/data';

/**
 * WaPo-style "splash" lead: headline LEFT, image RIGHT.
 *   - Left column: kicker, huge headline, dek, byline/time + bookmark.
 *   - Right column: full-bleed hero image with caption + credit overlay.
 * Used at the top of the homepage.
 */
export default function LeadSplit({ article }: { article: Article }) {
  return (
    <article className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
      {/* Left: text block */}
      <div className="flex flex-col justify-center md:py-2 order-2 md:order-1">
        {article.kicker && (
          <div className="kicker text-wp-red text-sm md:text-base mb-3 uppercase tracking-[0.15em] font-bold">
            {article.kicker}
          </div>
        )}
        <h2
          className="headline text-3xl md:text-4xl lg:text-[2.8rem] xl:text-5xl leading-[1.05] mb-4 hover:text-wp-link cursor-pointer"
          style={{ viewTransitionName: 'vt-title', contain: 'layout' }}
        >
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h2>
        {article.dek && (
          <p className="dek text-lg md:text-xl lg:text-2xl mb-5 font-serif italic text-wp-ink leading-snug">
            {article.dek}
          </p>
        )}
        <div className="byline flex items-center gap-2 text-sm pt-3 border-t border-wp-border">
          {article.byline && (
            <span className="font-bold">
              <BylineLink byline={article.byline} />
            </span>
          )}
          {article.time && <span className="text-wp-gray">· {article.time}</span>}
          <span className="ml-auto">
            <BookmarkButton slug={article.slug} />
          </span>
        </div>
      </div>

      {/* Right: image */}
      {article.image && (
        <div className="order-1 md:order-2">
          <Link
            href={`/article/${article.slug}`}
            className="block overflow-hidden bg-wp-light relative group"
            style={{ viewTransitionName: 'vt-hero', contain: 'paint' }}
          >
            <div className="relative w-full h-[280px] sm:h-[360px] md:h-[420px] lg:h-[480px]">
              <ArticleImage
                src={article.image}
                alt={article.caption || article.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover group-hover:opacity-95 transition duration-300"
              />
            </div>
          </Link>
          {(article.caption || article.credit) && (
            <figcaption className="text-[11px] font-sans text-wp-gray mt-2 flex justify-between gap-4 leading-snug">
              {article.caption && <span className="italic">{article.caption}</span>}
              {article.credit && (
                <span className="flex-shrink-0 uppercase tracking-wider text-[10px]">
                  {article.credit}
                </span>
              )}
            </figcaption>
          )}
        </div>
      )}
    </article>
  );
}
