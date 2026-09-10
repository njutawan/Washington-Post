'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  /** Selector for article body container to read from */
  selector?: string;
  title?: string;
};

/**
 * Minimal browser TTS "Listen to this article" bar. Uses SpeechSynthesis API
 * when available; reads paragraph-by-paragraph, highlights the active one,
 * and exposes play/pause, a progress bar, and speed toggle. Falls back to a
 * disabled state when speechSynthesis isn't supported (Safari private mode,
 * some older mobile browsers).
 */
export default function ReadAloudPlayer({
  selector = '#article-body',
  title = 'this article',
}: Props) {
  const [supported, setSupported] = useState(true); // render optimistically; hide after mount if missing
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [activeIdx, setActiveIdx] = useState(-1);
  const parasRef = useRef<HTMLElement[]>([]);
  const idxRef = useRef(-1);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    const container = document.querySelector(selector);
    if (!container) return;
    // Only read visible paragraph/blockquote/list text — skip ads, newsletter
    // blocks, etc.
    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>('p, blockquote, li, h2, h3'),
    ).filter(
      (el) =>
        !el.closest('.newsletter-inline, .ad, aside, .audio-bar') &&
        (el.textContent || '').trim().length > 20,
    );
    parasRef.current = nodes;
    setSupported(true);
    return () => {
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, [selector]);

  const stop = () => {
    try { window.speechSynthesis.cancel(); } catch {}
    setPlaying(false);
    setActiveIdx(-1);
    idxRef.current = -1;
  };

  const speakIndex = (i: number) => {
    const nodes = parasRef.current;
    if (i < 0 || i >= nodes.length) {
      stop();
      setProgress(1);
      return;
    }
    const text = (nodes[i].textContent || '').trim();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.onstart = () => {
      setActiveIdx(i);
      idxRef.current = i;
      setProgress(i / Math.max(1, nodes.length - 1));
      nodes[i].classList.add('bg-wp-yellow/20', '-mx-2', 'px-2');
    };
    u.onend = () => {
      nodes[i].classList.remove('bg-wp-yellow/20', '-mx-2', 'px-2');
      speakIndex(i + 1);
    };
    u.onerror = () => {
      nodes[i].classList.remove('bg-wp-yellow/20', '-mx-2', 'px-2');
      stop();
    };
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const toggle = () => {
    if (!supported) return;
    if (playing) {
      window.speechSynthesis.pause();
      setPlaying(false);
      return;
    }
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPlaying(true);
      return;
    }
    window.speechSynthesis.cancel();
    setPlaying(true);
    const start = idxRef.current >= 0 ? idxRef.current : 0;
    speakIndex(start);
  };

  const cycleRate = () => {
    const next = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 0.8 : 1;
    setRate(next);
  };

  useEffect(() => () => stop(), []);

  if (!supported) return null;

  return (
    <div className="audio-bar" role="region" aria-label="Listen to article">
      <button
        onClick={toggle}
        className={playing ? 'playing' : 'btn-audio-pulse'}
        aria-label={playing ? 'Pause audio' : 'Play audio'}
      >
        {playing ? '❚❚' : '▶'}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-bold opacity-80 mb-1">
          <span>Listen to {title}</span>
          <button
            onClick={cycleRate}
            className="opacity-80 hover:opacity-100 px-2 py-0.5 border border-white/30 rounded text-[10px]"
            aria-label={`Playback speed ${rate}x`}
          >
            {rate}×
          </button>
        </div>
        <div className="audio-progress" aria-hidden="true">
          <div className="audio-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
