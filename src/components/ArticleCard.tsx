import Link from 'next/link';
import { Article } from '@/lib/data';
import BookmarkButton from './BookmarkButton';
import ArticleImage from './ArticleImage';
import BylineLink from './BylineLink';

type Variant = 'lead' | 'large' | 'medium' | 'small' | 'list' | 'opinion';

export function ArticleCard({
  article,
  variant = 'medium',
  showCategory = true,
}: {
  article: Article;
  variant?: Variant;
  showCategory?: boolean;
}) {
  if (variant === 'lead') return <LeadCard article={article} />;
  if (variant === 'large') return <LargeCard article={article} showCategory={showCategory} />;
  if (variant === 'small') return <SmallCard article={article} showCategory={showCategory} />;
  if (variant === 'list') return <ListCard article={article} />;
  if (variant === 'opinion') return <OpinionCard article={article} />;
  return <MediumCard article={article} showCategory={showCategory} />;
}

const href = (a: Article) => `/article/${a.slug}`;

function LeadCard({ article }: { article: Article }) {
  return (
    <article className="pb-6 border-b border-wp-border md:border-b-0 md:pb-0" data-vt-card>
      {article.image && (
        <Link href={href(article)} className="block mb-4 overflow-hidden bg-gray-100 relative">
          <div className="relative w-full h-[360px] md:h-[480px]" data-vt-hero>
            <ArticleImage
              src={article.image}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 900px"
              className="object-cover hover:opacity-95 transition"
            />
          </div>
          {article.credit && (
            <p className="text-[11px] font-sans text-wp-gray mt-1 text-right italic">{article.credit}</p>
          )}
        </Link>
      )}
      <div className="max-w-3xl">
        {article.kicker && (
          <div className="kicker text-wp-red mb-2">{article.kicker}</div>
        )}
        <h2 className="headline text-3xl md:text-4xl lg:text-5xl mb-3 hover:text-wp-link cursor-pointer" data-vt-title>
          <Link href={href(article)}>{article.title}</Link>
        </h2>
        {article.dek && (
          <p className="dek text-lg md:text-xl mb-3">{article.dek}</p>
        )}
        {(article.byline || article.time) && (
          <div className="byline flex items-center gap-2">
            {article.byline && <span><BylineLink byline={article.byline} /></span>}
            {article.time && <span>· {article.time}</span>}
            <span className="ml-auto"><BookmarkButton slug={article.slug} /></span>
          </div>
        )}
      </div>
    </article>
  );
}

function LargeCard({ article, showCategory }: { article: Article; showCategory: boolean }) {
  return (
    <article className="pb-5 border-b border-wp-border" data-vt-card>
      {article.image && (
        <Link href={href(article)} className="block mb-3 overflow-hidden bg-gray-100 relative">
          <div className="relative w-full h-[220px] md:h-[260px]" data-vt-hero>
            <ArticleImage
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover hover:opacity-95 transition"
            />
          </div>
        </Link>
      )}
      {showCategory && article.category && (
        <div className="kicker text-wp-red mb-1">{article.category}</div>
      )}
      <h3 className="headline text-xl md:text-2xl mb-2 hover:text-wp-link cursor-pointer leading-tight" data-vt-title>
        <Link href={href(article)}>{article.title}</Link>
      </h3>
      {article.dek && <p className="dek text-base mb-2 truncate-2">{article.dek}</p>}
      {(article.byline || article.time) && (
        <div className="byline flex items-center gap-2">
          {article.byline && <span><BylineLink byline={article.byline} /></span>}
          {article.time && <span>· {article.time}</span>}
        </div>
      )}
    </article>
  );
}

function MediumCard({ article, showCategory }: { article: Article; showCategory: boolean }) {
  return (
    <article className="flex gap-4 pb-5 border-b border-wp-border" data-vt-card>
      {article.image && (
        <Link href={href(article)} className="block w-1/3 flex-shrink-0 overflow-hidden bg-gray-100 relative">
          <div className="relative w-full h-[110px] md:h-[130px]" data-vt-hero>
            <ArticleImage
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 33vw, 220px"
              className="object-cover hover:opacity-95 transition"
            />
          </div>
        </Link>
      )}
      <div className={article.image ? 'w-2/3' : 'w-full'}>
        {showCategory && article.category && (
          <div className="kicker text-wp-red mb-1">{article.category}</div>
        )}
        <h3 className="headline text-lg md:text-xl mb-1 hover:text-wp-link cursor-pointer leading-tight" data-vt-title>
          <Link href={href(article)}>{article.title}</Link>
        </h3>
        {article.dek && <p className="dek text-sm mb-1 truncate-2">{article.dek}</p>}
        {(article.byline || article.time) && (
          <div className="byline flex items-center gap-2 mt-1">
            {article.byline && <span><BylineLink byline={article.byline} /></span>}
            {article.time && <span>· {article.time}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

function SmallCard({ article, showCategory }: { article: Article; showCategory: boolean }) {
  return (
    <article className="pb-4 border-b border-wp-border">
      {showCategory && article.category && (
        <div className="kicker text-wp-red mb-1">{article.category}</div>
      )}
      <h3 className="headline text-base md:text-lg mb-1 hover:text-wp-link cursor-pointer leading-tight">
        <Link href={href(article)}>{article.title}</Link>
      </h3>
      {(article.byline || article.time) && (
        <div className="byline flex items-center gap-2">
          {article.byline && <span><BylineLink byline={article.byline} /></span>}
          {article.time && <span>· {article.time}</span>}
        </div>
      )}
    </article>
  );
}

function ListCard({ article }: { article: Article }) {
  return (
    <article className="flex gap-3 py-3 border-b border-wp-border">
      <div className="seven-number flex-shrink-0 w-8 text-center">•</div>
      <div>
        {article.live && (
          <div className="kicker text-wp-red flex items-center mb-1">
            <span className="live-dot" /> LIVE
          </div>
        )}
        <h3 className="headline text-base md:text-lg mb-1 hover:text-wp-link cursor-pointer leading-snug">
          <Link href={href(article)}>{article.title}</Link>
        </h3>
        {(article.byline || article.time) && (
          <div className="byline flex items-center gap-2">
            {article.byline && <span><BylineLink byline={article.byline} /></span>}
            {article.time && <span>· {article.time}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

function OpinionCard({ article }: { article: Article }) {
  return (
    <article className="flex gap-3 pb-4 border-b border-wp-border">
      {article.image && (
        <Link href={href(article)} className="block w-16 h-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 relative">
          <ArticleImage
            src={article.image}
            alt={article.byline || article.title}
            fill
            sizes="64px"
            rounded
            className="object-cover"
          />
        </Link>
      )}
      <div className="flex-1">
        {article.kicker && <div className="kicker text-wp-gray mb-1">{article.kicker}</div>}
        <h3 className="headline italic text-lg md:text-xl mb-1 hover:text-wp-link cursor-pointer leading-tight font-serif">
          <Link href={href(article)}>&ldquo;{article.title}&rdquo;</Link>
        </h3>
        {article.byline && (
          <div className="byline font-bold text-wp-black">
            <BylineLink byline={article.byline} />
          </div>
        )}
      </div>
    </article>
  );
}
