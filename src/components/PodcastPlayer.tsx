'use client';

/**
 * Embeddable podcast card (sidebar). Uses the global PodcastProvider so that
 * clicking play here takes over the sticky mini-player.
 */
import { usePodcast } from './PodcastProvider';
import { formatTime } from '@/lib/podcast';

export default function PodcastPlayer() {
  const { episode, playing, currentTime, duration, toggle, episodes } = usePodcast();
  const pct = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <section className="border-2 border-wp-black bg-white">
      <div className="flex items-stretch">
        <button
          onClick={() => toggle(episode)}
          aria-label={playing ? 'Pause' : 'Play'}
          aria-pressed={playing}
          className="bg-wp-black text-white w-20 md:w-24 flex items-center justify-center hover:bg-wp-red transition flex-shrink-0 tap-target"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            {playing ? (
              <>
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </>
            ) : (
              <polygon points="6,4 20,12 6,20" />
            )}
          </svg>
        </button>
        <div className="flex-1 p-4">
          <div className="flex items-baseline justify-between gap-2 mb-1">
            <div className="min-w-0">
              <div className="kicker text-wp-red text-[11px]">Post Reports · Podcast</div>
              <h3 className="headline text-base md:text-lg leading-tight truncate">{episode.title}</h3>
            </div>
            <div className="text-xs font-sans text-wp-gray flex-shrink-0 tabular-nums">
              {formatTime(currentTime)} / {episode.durationLabel}
            </div>
          </div>
          <p className="text-xs font-sans text-wp-gray mb-2 line-clamp-2">{episode.description}</p>
          <div className="h-1 bg-wp-border overflow-hidden">
            <div className="h-full bg-wp-red transition-all" style={{ width: `${pct}%` }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} />
          </div>
        </div>
      </div>

      {/* Episode list */}
      {episodes.length > 1 && (
        <ul className="border-t border-wp-border divide-y divide-wp-border max-h-48 overflow-y-auto">
          {episodes.slice(0, 4).map((ep) => {
            const active = ep.id === episode.id;
            return (
              <li key={ep.id}>
                <button
                  onClick={() => toggle(ep)}
                  className={'w-full text-left px-4 py-2 flex items-start gap-3 hover:bg-wp-light text-xs font-sans ' + (active ? 'bg-wp-light' : '')}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className="text-wp-red mt-0.5" aria-hidden="true">{active && playing ? '▶' : '•'}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate font-sans font-bold text-wp-black">{ep.title}</span>
                    <span className="block text-wp-gray tabular-nums">{ep.durationLabel}{ep.author ? ` · ${ep.author}` : ''}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
