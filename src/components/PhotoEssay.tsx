import ArticleImage from '@/components/ArticleImage';
import type { Photo } from './Lightbox';

type Props = {
  title?: string;
  dek?: string;
  byline?: string;
  photos: Photo[];
};

/**
 * Full-bleed photo-essay template in the classic WaPo longform style:
 *   - Full-bleed hero photo (breaks out of article column)
 *   - Alternating layout: photo full-width with caption LEFT (even) or
 *     photo full-width with caption RIGHT (odd)
 *   - Large serif captions with credit line, generous whitespace
 *   - Final full-bleed closer
 *
 * This is intended to be placed INSIDE an article body (replacing some
 * paragraphs). Drop it in MDX as <PhotoEssay photos={...} title="..." />
 * or use it on a dedicated /photo-essays/[slug] route.
 */
export default function PhotoEssay({ title, dek, byline, photos }: Props) {
  if (!photos.length) return null;
  const [hero, ...rest] = photos;
  const closer = rest.length > 3 ? rest[rest.length - 1] : null;
  const body = closer ? rest.slice(0, -1) : rest;

  return (
    <div className="photo-essay not-prose my-12">
      {/* Optional intro */}
      {(title || dek) && (
        <div className="max-w-2xl mx-auto text-center mb-8 px-4">
          {title && (
            <h2 className="headline text-2xl md:text-4xl leading-tight mb-3">{title}</h2>
          )}
          {dek && (
            <p className="dek font-serif italic text-lg md:text-xl text-wp-ink mb-3">{dek}</p>
          )}
          {byline && (
            <p className="byline text-wp-gray text-xs uppercase tracking-wider">
              Photographs by {byline}
            </p>
          )}
        </div>
      )}

      {/* Full-bleed hero with overlay caption */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-12 relative">
        <div className="relative w-full h-[60vh] min-h-[420px] md:h-[75vh] bg-black">
          <ArticleImage
            src={hero.src}
            alt={hero.caption || ''}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white max-w-3xl">
            {hero.caption && (
              <p className="font-serif italic text-lg md:text-2xl leading-snug mb-2">
                {hero.caption}
              </p>
            )}
            {hero.credit && (
              <p className="text-[11px] font-sans uppercase tracking-wider text-gray-300">
                {hero.credit}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alternating photo / caption layouts */}
      <div className="space-y-16 md:space-y-24">
        {body.map((p, i) => {
          const rightSide = i % 2 === 1;
          return (
            <figure
              key={i}
              className={
                'grid md:grid-cols-12 gap-6 md:gap-10 items-center ' +
                (rightSide ? '' : '')
              }
            >
              <div
                className={
                  'md:col-span-8 relative w-full ' +
                  (rightSide ? 'md:order-1' : 'md:order-2')
                }
              >
                <div className="relative w-full aspect-[3/2] bg-gray-100 overflow-hidden">
                  <ArticleImage
                    src={p.src}
                    alt={p.caption || ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="object-cover"
                  />
                </div>
              </div>
              <figcaption
                className={
                  'md:col-span-4 ' +
                  (rightSide ? 'md:order-2 md:pl-4' : 'md:order-1 md:pr-4')
                }
              >
                <span
                  className="block text-wp-red font-sans font-black text-5xl leading-none mb-3"
                  aria-hidden="true"
                >
                  {String(i + 2).padStart(2, '0')}
                </span>
                {p.caption && (
                  <p className="font-serif italic text-lg md:text-xl leading-snug text-wp-black mb-2">
                    {p.caption}
                  </p>
                )}
                {p.credit && (
                  <p className="text-[11px] font-sans uppercase tracking-wider text-wp-gray">
                    {p.credit}
                  </p>
                )}
              </figcaption>
            </figure>
          );
        })}
      </div>

      {/* Full-bleed closer */}
      {closer && (
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 mt-20 mb-4 relative">
          <div className="relative w-full h-[50vh] min-h-[320px] md:h-[65vh] bg-black">
            <ArticleImage
              src={closer.src}
              alt={closer.caption || ''}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-3xl mx-auto px-4 mt-4 text-center">
            {closer.caption && (
              <p className="font-serif italic text-base md:text-lg text-wp-ink">
                {closer.caption}
              </p>
            )}
            {closer.credit && (
              <p className="text-[11px] font-sans uppercase tracking-wider text-wp-gray mt-2">
                {closer.credit}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
