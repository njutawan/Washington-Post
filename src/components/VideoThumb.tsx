import Link from 'next/link';
import ArticleImage from './ArticleImage';

type Props = {
  src: string;
  alt?: string;
  href?: string;
  duration?: string;       // e.g. "2:47"
  headline?: string;
  byline?: string;
  kicker?: string;
  size?: 'sm' | 'md' | 'lg';
  /** External onClick (e.g. open modal / lightbox). If provided, href is ignored. */
  onOpen?: () => void;
};

const SIZES = {
  sm: { h: 'h-36 md:h-40', title: 'text-sm md:text-base' },
  md: { h: 'h-52 md:h-64', title: 'text-base md:text-lg' },
  lg: { h: 'h-64 md:h-80 lg:h-96', title: 'text-lg md:text-xl lg:text-2xl' },
} as const;

/**
 * Video thumbnail card with a WaPo-style play-button overlay (red circle
 * with white triangle) and a duration chip in the bottom-right. Works both
 * as a link (href) and as a modal/open trigger (onOpen).
 */
export default function VideoThumb({
  src,
  alt = '',
  href,
  duration,
  headline,
  byline,
  kicker = 'Video',
  size = 'md',
  onOpen,
}: Props) {
  const sz = SIZES[size];
  const Wrapper: any = onOpen ? 'button' : href ? Link : 'div';
  const wrapperProps = onOpen
    ? { onClick: onOpen, className: 'group block text-left w-full', 'aria-label': `Play video: ${headline || alt}` }
    : href
    ? { href, className: 'group block w-full' }
    : { className: 'group block w-full' };

  return (
    <Wrapper {...wrapperProps}>
      <div className={`relative ${sz.h} w-full overflow-hidden bg-black mb-2`}>
        <ArticleImage
          src={src}
          alt={alt || headline || ''}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.03] transition duration-500"
        />
        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 pointer-events-none" />

        {/* Kicker chip */}
        <div className="absolute top-3 left-3 flex items-center gap-2 text-white text-[10px] font-sans uppercase tracking-widest">
          <span className="bg-wp-red px-2 py-1 font-bold flex items-center gap-1">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <polygon points="6,4 20,12 6,20" />
            </svg>
            {kicker}
          </span>
        </div>

        {/* Big play button center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-wp-red/90 group-hover:bg-wp-red text-white flex items-center justify-center border-2 border-white/80 shadow-lg transition transform group-hover:scale-110">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          </span>
        </div>

        {/* Duration chip */}
        {duration && (
          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[11px] font-sans font-bold px-2 py-0.5 tracking-wider">
            {duration}
          </div>
        )}
      </div>
      {headline && (
        <h3 className={`headline ${sz.title} leading-tight mb-1 group-hover:text-wp-link`}>
          {headline}
        </h3>
      )}
      {byline && <p className="byline text-xs">{byline}</p>}
    </Wrapper>
  );
}
