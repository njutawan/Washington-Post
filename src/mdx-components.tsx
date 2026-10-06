import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import ArticleImage from '@/components/ArticleImage';
import VideoThumb from '@/components/VideoThumb';
import PhotoEssay from '@/components/PhotoEssay';
import Scrollytelling, { type ScrollStep } from '@/components/Scrollytelling';
import type { Photo } from '@/components/Lightbox';

/**
 * MDX component mapping. Any `<img>`, `<a>`, `<blockquote>` etc. inside
 * .mdx articles will be rendered with these styled components so MDX
 * content inherits the WaPo typography system automatically.
 *
 * Shortcodes available in .mdx:
 *   - <YouTube id="..." /> — responsive 16:9 YouTube embed
 *   - <Tweet id="..." />   — Twitter/X embed placeholder (no script loaded
 *     in SSR; client component upgrades when visible)
 */
function YouTube({ id, title = 'YouTube video' }: { id: string; title?: string }) {
  return (
    <div className="my-6 aspect-video w-full overflow-hidden bg-black">
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function Tweet({ id }: { id: string }) {
  return (
    <div className="my-6 border border-wp-border rounded-sm p-4 bg-white font-sans text-sm text-wp-gray not-prose">
      <p className="text-[11px] uppercase tracking-wider mb-2">From Twitter / X</p>
      <a
        href={`https://twitter.com/i/status/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-wp-link underline hover:text-wp-red"
      >
        View tweet ({id}) ↗
      </a>
    </div>
  );
}

export function useMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    YouTube,
    Tweet,
    // <VideoThumb src="…" duration="2:47" headline="…" />
    VideoThumb: (props: any) => <VideoThumb {...props} />,
    // <PhotoEssay photos={[{src,caption,credit},…]} title="…" />
    PhotoEssay: ({ photos, title, dek, byline }: { photos: Photo[]; title?: string; dek?: string; byline?: string }) => (
      <PhotoEssay photos={photos} title={title} dek={dek} byline={byline} />
    ),
    // <Scrolly steps={[{kicker,text,image,caption,render}]} title="…" />
    Scrolly: ({ steps, title, dek }: { steps: ScrollStep[]; title?: string; dek?: string }) => (
      <Scrollytelling steps={steps} title={title} dek={dek} />
    ),
    // Blockquote → pull-quote style (3px red rule + italic display)
    blockquote: (props) => (
      <blockquote
        className="my-8 md:my-10 py-6 px-4 md:px-6 border-t-4 border-b-4 border-wp-black"
        {...props}
      >
        <p className="font-serif italic text-xl md:text-2xl lg:text-3xl leading-tight text-wp-black">
          {props.children}
        </p>
      </blockquote>
    ),
    // Images: render through our ArticleImage (remote-pattern aware, lazy, placeholder)
    img: ({ src = '', alt = '', ...rest }: any) => {
      if (!src) return null;
      const isRemote = /^https?:\/\//.test(src);
      return (
        <figure className="my-6 -mx-4 sm:mx-0">
          <div className="relative w-full h-auto overflow-hidden bg-wp-light">
            {isRemote ? (
              <ArticleImage src={src} alt={alt} width={800} height={500} className="object-cover w-full h-auto" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt} loading="lazy" className="w-full h-auto" {...rest} />
            )}
          </div>
          {rest.title && (
            <figcaption className="text-[12px] font-sans text-wp-gray mt-2 italic">
              {rest.title}
            </figcaption>
          )}
        </figure>
      );
    },
    // External links open in new tab, internal links use next/link
    a: ({ href = '', children, ...rest }: any) => {
      const isExternal = /^https?:\/\//.test(href);
      if (isExternal) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-wp-link underline hover:text-wp-red" {...rest}>
            {children}
          </a>
        );
      }
      return (
        <Link href={href} className="text-wp-link underline hover:text-wp-red" {...rest as any}>
          {children}
        </Link>
      );
    },
    h2: ({ id, children, ...rest }: any) => (
      <h2 id={id} className="headline text-2xl md:text-3xl mt-10 mb-4 pt-4 border-t-2 border-wp-black scroll-mt-24" {...rest}>
        {children}
      </h2>
    ),
    h3: ({ id, children, ...rest }: any) => (
      <h3 id={id} className="headline text-xl md:text-2xl mt-8 mb-3 scroll-mt-24" {...rest}>
        {children}
      </h3>
    ),
    // YouTube / Twitter / generic iframe embeds are wrapped responsively
    iframe: ({ src = '', title = '', ...rest }: any) => (
      <div className="my-6 aspect-video w-full overflow-hidden bg-black">
        <iframe
          src={src}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          {...rest}
        />
      </div>
    ),
    // Paragraphs get article body styling
    p: (props: any) => (
      <p className="font-body text-[17px] sm:text-lg lg:text-[1.2rem] leading-[1.7] lg:leading-[1.75] mb-5 text-wp-ink">
        {props.children}
      </p>
    ),
    ul: (props: any) => (
      <ul className="list-disc pl-6 my-5 space-y-2 text-[17px] text-wp-ink font-body">{props.children}</ul>
    ),
    ol: (props: any) => (
      <ol className="list-decimal pl-6 my-5 space-y-2 text-[17px] text-wp-ink font-body">{props.children}</ol>
    ),
    // Embed shortcodes (Twitter/YouTube) can be used as <Tweet id="…" /> / <YouTube id="…" />
    ...components,
  };
}
