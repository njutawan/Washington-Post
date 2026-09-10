import Link from 'next/link';
import VideoThumb from './VideoThumb';

export type Clip = {
  id: string;
  title: string;
  byline?: string;
  thumbnail: string;
  duration: string;
  href?: string;
};

type Props = {
  clips: Clip[];
  title?: string;
  kicker?: string;
  href?: string;
};

/**
 * WaPo "Clips" section: a 4-column grid (2-col mobile) of video thumbnails
 * with play overlays, durations, and headlines. Goes on the homepage or any
 * section hub.
 */
export default function ClipsGrid({
  clips,
  title = 'Clips',
  kicker = 'Video',
  href = '/video',
}: Props) {
  return (
    <section aria-label={title} className="mb-10 mt-8 md:mt-10">
      <div className="flex items-baseline justify-between border-t-4 border-b border-wp-black py-2 mb-5">
        <div className="flex items-baseline gap-3">
          <span className="kicker text-wp-red text-sm md:text-base uppercase tracking-[0.15em] font-bold">
            {kicker}
          </span>
          <h2 className="headline text-xl md:text-2xl">{title}</h2>
        </div>
        <Link
          href={href}
          className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline whitespace-nowrap ml-4"
        >
          All video →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6">
        {clips.map((c, i) => (
          <VideoThumb
            key={c.id}
            src={c.thumbnail}
            href={c.href || `/video/${c.id}`}
            duration={c.duration}
            headline={c.title}
            byline={c.byline}
            size={i === 0 ? 'md' : 'sm'}
          />
        ))}
      </div>
    </section>
  );
}
