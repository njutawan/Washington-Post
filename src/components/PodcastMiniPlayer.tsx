'use client';

/**
 * Sticky bottom mini-player. Persists across route changes because it's
 * mounted once inside the root <PodcastProvider>; the <audio> element is owned
 * by PodcastProvider so playback continues across SPA navigations.
 */
import { useState } from 'react';
import { usePodcast } from './PodcastProvider';
import { formatTime } from '@/lib/podcast';
import Link from 'next/link';

function PlayIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="5" width="4" height="14" />
      <rect x="14" y="5" width="4" height="14" />
    </svg>
  );
}
function SkipFwdIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>);
}
function SkipBackIcon() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg>);
}

export default function PodcastMiniPlayer() {
  const {
    episode, playing, currentTime, duration, rate, mini,
    toggle, seek, skip, setRate, setMini,
  } = usePodcast();
  const [showRates, setShowRates] = useState(false);

  const pct = duration ? (currentTime / duration) * 100 : 0;

  // Drag on the progress bar
  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    seek(x * duration);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-wp-black text-white shadow-[0_-4px_16px_rgba(0,0,0,0.25)]"
      role="region"
      aria-label="Podcast player"
    >
      {/* Progress bar */}
      <div
        className="h-1 bg-white/15 cursor-pointer"
        onClick={onSeek}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-wp-red" style={{ width: `${pct}%`, transition: 'width 150ms linear' }} />
      </div>
      <div className="max-w-6xl mx-auto px-3 py-2 flex items-center gap-3 text-[13px] font-sans">
        <button
          onClick={() => toggle()}
          aria-label={playing ? 'Pause' : 'Play'}
          className="w-9 h-9 flex-shrink-0 rounded-full bg-white/10 hover:bg-wp-red flex items-center justify-center transition tap-target"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={() => skip(-15)} aria-label="Back 15 seconds" className="p-2 hover:text-wp-red transition hidden sm:block tap-target">
          <SkipBackIcon />
        </button>
        <button onClick={() => skip(15)} aria-label="Forward 15 seconds" className="p-2 hover:text-wp-red transition hidden sm:block tap-target">
          <SkipFwdIcon />
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            {mini ? (
              <p className="truncate text-xs sm:text-sm">
                <span className="kicker text-wp-red mr-2 text-[10px]">Post Reports</span>
                {episode.title}
              </p>
            ) : (
              <Link href="/podcasts" className="hover:text-wp-red">
                <span className="kicker text-wp-red mr-2 text-[10px]">Post Reports</span>
                {episode.title}
              </Link>
            )}
            <p className="text-[11px] text-white/60 tabular-nums">
              {formatTime(currentTime)} / {episode.durationLabel}
            </p>
          </div>

          {/* Rate selector */}
          <div className="relative">
            <button
              onClick={() => setShowRates((s) => !s)}
              aria-label={`Playback speed ${rate}x`}
              aria-expanded={showRates}
              className="px-2 py-1 text-xs font-bold tabular-nums rounded bg-white/10 hover:bg-white/20 transition tap-target min-w-[44px]"
            >
              {rate}×
            </button>
            {showRates && (
              <div className="absolute bottom-full right-0 mb-2 w-24 bg-wp-black border border-white/20 shadow-xl">
                {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                  <button
                    key={r}
                    onClick={() => { setRate(r); setShowRates(false); }}
                    className={'block w-full text-left px-3 py-2 text-xs hover:bg-white/10 ' + (rate === r ? 'text-wp-red font-bold' : '')}
                  >
                    {r}× {r === 1 ? '(normal)' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setMini(!mini)}
            aria-label={mini ? 'Expand player' : 'Minimize player'}
            className="p-2 hover:text-wp-red transition hidden md:block tap-target"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {mini
                ? <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                : <path d="M19 9V5h-4M5 15v4h4M5 5l7 7M19 21l-7-7" />}
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
