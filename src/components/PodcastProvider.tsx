'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { Episode, EPISODES, PLAYBACK_RATES } from '@/lib/podcast';

// We persist "now playing" state across SPA navigations by storing it in a
// singleton module-level variable + localStorage so the sticky mini-player
// can resume playback after route changes without re-mounting the <audio>.
type State = {
  episode: Episode;
  playing: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  mini: boolean; // true = compact bar at bottom of viewport
};

type Ctx = State & {
  play: (ep?: Episode) => void;
  pause: () => void;
  toggle: (ep?: Episode) => void;
  seek: (t: number) => void;
  skip: (delta: number) => void;
  setRate: (r: number) => void;
  setMini: (m: boolean) => void;
  episodes: Episode[];
};

const PodcastCtx = createContext<Ctx | null>(null);

const LS_KEY = 'wapo:podcast';

function readPersist(): Partial<State> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

export function PodcastProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const persistedRef = useRef<Partial<State>>(readPersist());
  const initialEp =
    EPISODES.find((e) => e.id === persistedRef.current.episode?.id) || EPISODES[0];

  const [episode, setEpisode] = useState<Episode>(initialEp);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(persistedRef.current.currentTime || 0);
  const [duration, setDuration] = useState(initialEp.duration);
  const [rate, setRateState] = useState<number>(persistedRef.current.rate || 1);
  const [mini, setMini] = useState<boolean>(true);

  // Ensure single audio element for the whole session
  useEffect(() => {
    if (audioRef.current) return;
    const a = new Audio();
    a.preload = 'none';
    a.src = initialEp.url;
    a.playbackRate = rate;
    audioRef.current = a;
    // Restore previous position for current episode
    if (persistedRef.current.episode?.id === initialEp.id && persistedRef.current.currentTime) {
      a.currentTime = persistedRef.current.currentTime;
    }
    const onTime = () => setCurrentTime(a.currentTime);
    const onMeta = () => setDuration(a.duration || initialEp.duration);
    const onEnd = () => { setPlaying(false); setCurrentTime(0); };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('durationchange', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('durationchange', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist position/episode/rate to localStorage on unload
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          episode, currentTime, rate,
        }));
      } catch { /* ignore */ }
    };
    window.addEventListener('beforeunload', save);
    window.addEventListener('pagehide', save);
    return () => {
      save();
      window.removeEventListener('beforeunload', save);
      window.removeEventListener('pagehide', save);
    };
  }, [episode, currentTime, rate]);

  const play = useCallback((ep?: Episode) => {
    const a = audioRef.current; if (!a) return;
    const target = ep || episode;
    if (target.id !== episode.id || a.src !== target.url) {
      setEpisode(target);
      a.src = target.url;
      setCurrentTime(0);
    }
    a.play().catch(() => {});
  }, [episode]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback((ep?: Episode) => {
    const a = audioRef.current; if (!a) return;
    if (ep && ep.id !== episode.id) { play(ep); return; }
    if (a.paused) play(); else pause();
  }, [episode, play, pause]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(t, duration));
    setCurrentTime(a.currentTime);
  }, [duration]);

  const skip = useCallback((delta: number) => {
    const a = audioRef.current; if (!a) return;
    seek(a.currentTime + delta);
  }, [seek]);

  const setRate = useCallback((r: number) => {
    if (!PLAYBACK_RATES.includes(r as any)) return;
    setRateState(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }, []);

  // Toggle body.podcast-playing so the mobile bottom nav can shift up above
  // the mini-player when it is visible (player is always mounted once audio
  // has initialised, but we only offset when there is a meaningful bar).
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.add('podcast-playing');
    return () => document.body.classList.remove('podcast-playing');
  }, []);

  return (
    <PodcastCtx.Provider value={{
      episode, playing, currentTime, duration, rate, mini,
      play, pause, toggle, seek, skip, setRate, setMini,
      episodes: EPISODES,
    }}>
      {children}
      {/* expose skip on the provider for internal consumers */}
      <PodcastAttachSkip skip={skip} />
    </PodcastCtx.Provider>
  );
}

// Tiny inner component that attaches keyboard shortcuts for the player
function PodcastAttachSkip({ skip }: { skip: (delta: number) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only hijack arrow keys when focus is on the player or body (not inputs)
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'ArrowRight' && e.altKey) { skip(15); e.preventDefault(); }
      if (e.key === 'ArrowLeft' && e.altKey) { skip(-15); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skip]);
  return null;
}

export function usePodcast() {
  const ctx = useContext(PodcastCtx);
  if (!ctx) throw new Error('usePodcast must be used within PodcastProvider');
  return ctx;
}
