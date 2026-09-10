'use client';

import Image from 'next/image';
import { useState } from 'react';

type Props = {
  src?: string;
  alt?: string;
  caption?: string;
  credit?: string;
  width?: number;
  height?: number;
  /** When true, fills its parent (Next/image fill mode) */
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  /** Round the corners (used for columnist/opinion avatars) */
  rounded?: boolean;
  className?: string;
};

/**
 * Renders a responsive article photo with optional caption/credit line.
 * Accepts remote URLs and falls back to a plain <img> if next/image rejects the URL.
 */
export default function ArticleImage({
  src,
  alt = '',
  caption,
  credit,
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  className = '',
}: Props) {
  const [errored, setErrored] = useState(false);
  if (!src) return null;

  const isRemote = /^https?:\/\//.test(src);
  const useNextImage = !errored;

  const imgEl = useNextImage ? (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : (width ?? 1600)}
      height={fill ? undefined : (height ?? 900)}
      fill={fill}
      priority={priority}
      sizes={sizes || (fill ? '(max-width:1024px) 100vw, 768px' : '(max-width:768px) 100vw, 900px')}
      className={fill ? className : `w-full h-auto ${className}`}
      onError={() => setErrored(true)}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      className={fill ? className : `w-full h-auto ${className}`}
    />
  );

  const figureContent = fill ? (
    <div className="relative w-full h-full overflow-hidden bg-wp-border/30">{imgEl}</div>
  ) : (
    <div className="relative w-full overflow-hidden bg-wp-border/30">{imgEl}</div>
  );

  if (!caption && !credit) return figureContent;

  return (
    <figure className="my-2">
      {figureContent}
      {(caption || credit) && (
        <figcaption className="mt-2 text-[13px] text-wp-gray font-sans leading-snug flex justify-between gap-4">
          {caption && <span className="italic">{caption}</span>}
          {credit && <span className="flex-shrink-0 text-wp-gray/70">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
