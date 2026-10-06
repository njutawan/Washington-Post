import Link from 'next/link';
import ArticleImage from '@/components/ArticleImage';
import { opinions, columnists } from '@/lib/data';

/**
 * WaPo homepage Opinions block: red kicker, 3–4 columns with LARGE round
 * columnist avatars above an italic serif headline, with the columnist's
 * name bolded below.
 */

function findColumnist(name: string) {
  if (!name) return null;
  const clean = name.replace(/^By\s+/i, '').trim();
  return (
    columnists.find((c) => clean.toLowerCase().includes(c.name.toLowerCase())) ||
    columnists.find((c) => c.name.toLowerCase().includes(clean.toLowerCase())) ||
    null
  );
}

export default function HomepageOpinions() {
  // Take first 4 named opinion pieces with a columnist match (fallback to first 4).
  const picks = opinions
    .filter((o) => o.byline && !/editorial board/i.test(o.byline))
    .slice(0, 4);

  return (
    <section aria-label="Opinion" className="mb-8 md:mb-10">
      <div className="flex items-baseline justify-between border-t-4 border-wp-black pt-3 pb-4">
        <div className="flex items-baseline gap-3">
          <span className="kicker text-wp-red text-sm md:text-base uppercase tracking-[0.15em] font-bold">
            Opinions
          </span>
          <span className="hidden sm:inline text-xs font-sans uppercase tracking-wider text-wp-gray">
            Columnists · Editorials · Letters
          </span>
        </div>
        <Link
          href="/opinions"
          className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline"
        >
          See all Opinions →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 md:gap-x-8">
        {picks.map((op) => {
          const col = findColumnist(op.byline || '');
          const avatar = col?.avatar || op.image;
          const displayName = col?.name || op.byline?.replace(/^By\s+/i, '') || '';
          const slug = col?.slug || '';
          return (
            <article key={op.id} className="text-center">
              <Link
                href={slug ? `/author/${slug}` : `/article/${op.slug}`}
                className="block mx-auto w-28 h-28 md:w-32 md:h-32 relative mb-3 group"
                aria-label={`${displayName} — ${op.title}`}
              >
                {avatar ? (
                  <div className="absolute inset-0 rounded-full overflow-hidden ring-2 ring-wp-black/10 group-hover:ring-wp-red transition bg-wp-border">
                    <ArticleImage
                      src={avatar}
                      alt={displayName}
                      fill
                      sizes="(max-width: 768px) 112px, 128px"
                      className="object-cover group-hover:opacity-95 transition"
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 rounded-full bg-wp-black text-white flex items-center justify-center font-serif font-bold text-2xl">
                    {(displayName.charAt(0) || 'W').toUpperCase()}
                  </div>
                )}
              </Link>
              <h3 className="headline italic font-serif text-lg md:text-xl leading-snug mb-2 hover:text-wp-link cursor-pointer px-1">
                <Link href={`/article/${op.slug}`}>&ldquo;{op.title}&rdquo;</Link>
              </h3>
              <div className="font-sans">
                {slug ? (
                  <Link
                    href={`/author/${slug}`}
                    className="font-bold text-wp-black hover:text-wp-link text-sm"
                  >
                    {displayName}
                  </Link>
                ) : (
                  <span className="font-bold text-sm">{displayName}</span>
                )}
                {col?.title && (
                  <p className="text-[11px] text-wp-gray uppercase tracking-wider mt-0.5">
                    {col.title}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
