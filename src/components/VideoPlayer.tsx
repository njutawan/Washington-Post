'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  src: string;
  poster?: string;
  captionsSrc?: string;
  title: string;
};

/**
 * Accessible custom HTML5 video player with controls.
 * - Play/Pause, mute, volume, scrub bar, fullscreen, CC toggle.
 * - Keyboard: Space/K play-pause, J/L seek -10/+10, M mute, F fullscreen, Arrow keys seek.
 * - All controls reachable via keyboard with visible focus rings; aria labels.
 */
export default function VideoPlayer({ src, poster, captionsSrc, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCc, setShowCc] = useState(!!captionsSrc);
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      setCurrent(v.currentTime);
      if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
    };
    const onLoaded = () => setDuration(v.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVol = () => { setMuted(v.muted); setVolume(v.volume); };
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('volumechange', onVol);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('volumechange', onVol);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted; };
  const seek = (t: number) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min(duration, t)); };
  const setVol = (x: number) => { const v = videoRef.current; if (v) { v.volume = x; v.muted = x === 0; } };
  const toggleFs = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) await el.requestFullscreen?.();
    else await document.exitFullscreen?.();
  };

  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const onKey = (e: React.KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case ' ':
      case 'k':
        e.preventDefault(); togglePlay(); break;
      case 'j':
        e.preventDefault(); seek(current - 10); break;
      case 'l':
        e.preventDefault(); seek(current + 10); break;
      case 'm':
        e.preventDefault(); toggleMute(); break;
      case 'f':
        e.preventDefault(); toggleFs(); break;
      case 'arrowleft':
        e.preventDefault(); seek(current - 5); break;
      case 'arrowright':
        e.preventDefault(); seek(current + 5); break;
      case 'arrowup':
        e.preventDefault(); setVol(Math.min(1, volume + 0.1)); break;
      case 'arrowdown':
        e.preventDefault(); setVol(Math.max(0, volume - 0.1)); break;
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video group focus:outline-none"
      tabIndex={0}
      onKeyDown={onKey}
      role="region"
      aria-label={`Video player: ${title}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full"
        preload="metadata"
        playsInline
        onClick={togglePlay}
        crossOrigin="anonymous"
      >
        {captionsSrc && (
          <track
            kind="captions"
            srcLang="en"
            label="English"
            src={captionsSrc}
            default={showCc}
          />
        )}
      </video>

      {/* Big center play button when paused */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
        >
          <span className="w-20 h-20 flex items-center justify-center rounded-full bg-wp-red/90 text-white shadow-lg">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}

      {/* Controls bar */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 opacity-100 group-hover:opacity-100 transition">
        {/* Scrub bar */}
        <div className="relative h-1.5 bg-white/30 rounded mb-2 cursor-pointer"
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}>
          <div className="absolute inset-y-0 left-0 bg-white/40 rounded" style={{ width: `${bufPct}%` }} />
          <div className="absolute inset-y-0 left-0 bg-wp-red rounded" style={{ width: `${pct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-wp-red rounded-full shadow" style={{ left: `calc(${pct}% - 6px)` }} />
        </div>

        <div className="flex items-center gap-3 text-white text-sm font-sans">
          <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}
            className="hover:text-wp-red focus:outline-none focus:ring-2 focus:ring-wp-red rounded">
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          <button type="button" onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}
            className="hover:text-wp-red focus:outline-none focus:ring-2 focus:ring-wp-red rounded">
            {muted || volume === 0 ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            )}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={(e) => setVol(Number(e.target.value))}
            aria-label="Volume"
            className="w-20 accent-wp-red cursor-pointer"
          />
          <span className="text-xs tabular-nums ml-1" aria-live="off">
            {formatTime(current)} <span aria-hidden="true">/</span> <span className="text-white/70">{formatTime(duration)}</span>
          </span>
          <span className="flex-1" />
          {captionsSrc && (
            <button type="button" onClick={() => { setShowCc((c) => !c); const v = videoRef.current; if (v && v.textTracks[0]) v.textTracks[0].mode = showCc ? 'hidden' : 'showing'; }}
              aria-pressed={showCc} aria-label="Toggle closed captions"
              className={`px-2 py-0.5 rounded text-xs font-bold border ${showCc ? 'bg-wp-red border-wp-red' : 'border-white/60 hover:border-white'}`}>CC</button>
          )}
          <button type="button" onClick={toggleFs} aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
            className="hover:text-wp-red focus:outline-none focus:ring-2 focus:ring-wp-red rounded">
            {fullscreen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
