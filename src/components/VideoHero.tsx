'use client';

import { useState, useRef, useEffect } from 'react';

export default function VideoHero() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const poster = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1400&q=80';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnd = () => setPlaying(false);
    v.addEventListener('ended', onEnd);
    return () => v.removeEventListener('ended', onEnd);
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <section className="relative bg-black overflow-hidden group mb-6 md:mb-8">
      <div className="relative aspect-[16/10] sm:aspect-video md:aspect-[21/9]">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted={muted}
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

        <div className="absolute top-3 left-3 md:top-4 md:left-4 flex items-center gap-2 text-white text-[10px] md:text-xs font-sans uppercase tracking-widest">
          <span className="live-dot" />
          <span className="bg-wp-red px-2 py-1 font-bold">Watch</span>
          <span className="hidden sm:inline">Video</span>
        </div>

        <button
          onClick={toggle}
          aria-label={playing ? 'Pause video' : 'Play video'}
          className="absolute inset-0 flex items-center justify-center tap-target"
        >
          <span
            className={
              'w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center border-2 border-white/80 transition ' +
              (playing ? 'opacity-0 group-hover:opacity-100' : 'opacity-100')
            }
          >
            {playing ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="5" width="4" height="14" />
                <rect x="14" y="5" width="4" height="14" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          className="absolute bottom-3 right-3 md:bottom-4 md:right-4 w-11 h-11 flex items-center justify-center bg-black/60 hover:bg-black text-white rounded-full tap-target"
        >
          {muted ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>

        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 right-16 md:right-28 max-w-xl text-white">
          <p className="kicker text-wp-red mb-1 md:mb-2">Visual Investigation</p>
          <h2 className="headline text-lg sm:text-xl md:text-2xl lg:text-3xl leading-tight mb-1">
            Inside the shutdown deadline: how Congress got here
          </h2>
          <p className="hidden sm:block text-sm font-sans text-gray-200 max-w-md">
            Our reporters break down the week&rsquo;s deadlines, the math, and what comes next.
          </p>
        </div>
      </div>
    </section>
  );
}
