'use client';

import { Episode } from '@/lib/podcast';
import { usePodcast } from '@/components/PodcastProvider';

export default function PodcastEpisodeList({ episodes }: { episodes: Episode[] }) {
  const { episode: current, playing, toggle } = usePodcast();
  return (
    <ol className="divide-y divide-wp-border border-t-2 border-b border-wp-black">
      {episodes.map((ep) => {
        const active = ep.id === current.id;
        return (
          <li key={ep.id} className="py-5 flex gap-5 items-start">
            <button
              onClick={() => toggle(ep)}
              aria-label={active && playing ? `Pause ${ep.title}` : `Play ${ep.title}`}
              className="w-12 h-12 flex-shrink-0 bg-wp-black text-white flex items-center justify-center hover:bg-wp-red transition tap-target"
            >
              <svg width="18" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                {active && playing ? (
                  <>
                    <rect x="6" y="5" width="4" height="14" />
                    <rect x="14" y="5" width="4" height="14" />
                  </>
                ) : (
                  <polygon points="6,4 20,12 6,20" />
                )}
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-sans text-wp-gray tabular-nums mb-1">
                {new Date(ep.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {' · '}{ep.durationLabel}
                {ep.author ? ` · ${ep.author}` : ''}
                {active && <span className="ml-2 text-wp-red">Now playing</span>}
              </p>
              <h2 className={'headline text-xl md:text-2xl mb-1 ' + (active ? 'text-wp-red' : '')}>{ep.title}</h2>
              <p className="dek text-sm md:text-base">{ep.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
