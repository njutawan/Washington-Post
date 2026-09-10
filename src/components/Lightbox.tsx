'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CloseIcon, ChevronRightIcon } from './Icons';
import FocusTrap from './FocusTrap';

export type Photo = {
  src: string;
  caption?: string;
  credit?: string;
};

/**
 * Full-screen photo viewer. Supports:
 * - Keyboard left/right/escape
 * - Touch swipe between photos (mobile)
 * - Double-tap to zoom; pinch-to-zoom (two-pointer gesture)
 * - Drag-to-pan while zoomed
 */
export default function Lightbox({
  photos,
  startIndex = 0,
  open,
  onClose,
}: {
  photos: Photo[];
  startIndex?: number;
  open: boolean;
  onClose: () => void;
}) {
  const [i, setI] = useState(startIndex);
  // Zoom/pan state
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const resetZoom = useCallback(() => { setScale(1); setTx(0); setTy(0); }, []);

  useEffect(() => { if (open) { setI(startIndex); resetZoom(); } }, [open, startIndex, resetZoom]);

  const close = useCallback(() => {
    document.body.style.overflow = '';
    onClose();
  }, [onClose]);

  const prev = useCallback(() => { setI((n) => (n - 1 + photos.length) % photos.length); resetZoom(); }, [photos.length, resetZoom]);
  const next = useCallback(() => { setI((n) => (n + 1) % photos.length); resetZoom(); }, [photos.length, resetZoom]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, next, prev]);

  // Touch gesture state
  const touchState = useRef<{
    startX: number; startY: number;
    lastX: number; lastY: number;
    startDist: number; startScale: number;
    startTx: number; startTy: number;
    mode: 'none' | 'swipe' | 'pinch' | 'pan';
    doubleTapPending: boolean;
  }>({
    startX: 0, startY: 0, lastX: 0, lastY: 0, startDist: 0, startScale: 1,
    startTx: 0, startTy: 0, mode: 'none', doubleTapPending: false,
  });

  function dist(a: React.Touch, b: React.Touch) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function onTouchStart(e: React.TouchEvent) {
    const s = touchState.current;
    if (e.touches.length === 1) {
      // Single touch: could be swipe (when zoomed out) OR pan (when zoomed in)
      const t = e.touches[0];
      s.startX = s.lastX = t.clientX;
      s.startY = s.lastY = t.clientY;
      s.startTx = tx; s.startTy = ty;
      s.mode = scale > 1 ? 'pan' : 'swipe';
    } else if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      s.startDist = dist(a, b);
      s.startScale = scale;
      s.startTx = tx; s.startTy = ty;
      s.mode = 'pinch';
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const s = touchState.current;
    if (s.mode === 'swipe' && e.touches.length === 1) {
      s.lastX = e.touches[0].clientX;
      s.lastY = e.touches[0].clientY;
    } else if (s.mode === 'pan' && e.touches.length === 1) {
      const dx = e.touches[0].clientX - s.startX;
      const dy = e.touches[0].clientY - s.startY;
      setTx(s.startTx + dx);
      setTy(s.startTy + dy);
      e.preventDefault();
    } else if (s.mode === 'pinch' && e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const d = dist(a, b);
      const newScale = Math.max(1, Math.min(4, s.startScale * (d / s.startDist)));
      setScale(newScale);
      e.preventDefault();
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const s = touchState.current;
    if (s.mode === 'swipe') {
      const dx = s.lastX - s.startX;
      const dy = s.lastY - s.startY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) next(); else prev();
      }
    } else if (s.mode === 'pinch') {
      if (scale < 1.05) resetZoom();
    }
    // Handle double-tap to zoom toggle
    if (e.changedTouches.length === 1 && s.mode !== 'pinch') {
      if (s.doubleTapPending) {
        if (scale > 1) resetZoom();
        else { setScale(2); setTx(0); setTy(0); }
        s.doubleTapPending = false;
      } else {
        s.doubleTapPending = true;
        setTimeout(() => { s.doubleTapPending = false; }, 300);
      }
    }
    s.mode = 'none';
  }

  function onWheel(e: React.WheelEvent) {
    if (!(e.ctrlKey || e.metaKey)) return; // only wheel-zoom with ctrl/cmd to avoid hijacking scroll
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(1, Math.min(4, s * factor)));
  }

  if (!open) return null;
  const p = photos[i];

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center lightbox-backdrop overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={close}
    >
      <FocusTrap active={open} onClose={close}>
      <button
        onClick={close}
        aria-label="Close"
        className="absolute top-3 right-3 md:top-4 md:right-4 w-12 h-12 flex items-center justify-center text-white hover:text-wp-red z-10 tap-target"
      >
        <CloseIcon className="w-7 h-7" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); prev(); }}
        aria-label="Previous photo"
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-white hover:text-wp-red z-10 tap-target"
      >
        <ChevronRightIcon className="w-10 h-10 rotate-180" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); next(); }}
        aria-label="Next photo"
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center text-white hover:text-wp-red z-10 tap-target"
      >
        <ChevronRightIcon className="w-10 h-10" />
      </button>

      {/* Mobile swipe hint */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-white/70 text-[10px] font-sans uppercase tracking-widest md:hidden">
        Swipe · double-tap to zoom
      </div>

      <figure
        className="max-w-[95vw] max-h-[90vh] flex flex-col items-center touch-none select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.src}
          alt={p.caption || ''}
          draggable={false}
          className="max-w-full max-h-[78vh] object-contain transition-transform will-change-transform"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
          onDoubleClick={() => {
            if (scale > 1) resetZoom();
            else { setScale(2); setTx(0); setTy(0); }
          }}
        />
        <figcaption className="mt-3 max-w-2xl text-center text-sm font-sans text-gray-300 px-4">
          {p.caption && <span className="italic">{p.caption}</span>}
          {p.caption && p.credit && ' '}
          {p.credit && <span className="text-gray-500">({p.credit})</span>}
          <span className="block mt-1 text-xs text-gray-500">
            {i + 1} / {photos.length}
            {scale > 1 && <span className="ml-3">· {Math.round(scale * 100)}%</span>}
          </span>
        </figcaption>
      </figure>
      </FocusTrap>
    </div>
  );
}
