'use client';

import { useEffect, useState, useCallback } from 'react';
import { CloseIcon, ChevronRightIcon } from './Icons';

export type Photo = {
  src: string;
  caption?: string;
  credit?: string;
};

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

  useEffect(() => { if (open) setI(startIndex); }, [open, startIndex]);

  const close = useCallback(() => {
    document.body.style.overflow = '';
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setI((n) => (n + 1) % photos.length);
      if (e.key === 'ArrowLeft') setI((n) => (n - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, photos.length, close]);

  if (!open) return null;
  const p = photos[i];

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <button
        onClick={close}
        aria-label="Close"
        className="absolute top-3 right-3 md:top-4 md:right-4 w-12 h-12 flex items-center justify-center text-white hover:text-wp-red z-10 tap-target"
      >
        <CloseIcon className="w-7 h-7" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setI((n) => (n - 1 + photos.length) % photos.length); }}
        aria-label="Previous photo"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-wp-red z-10 tap-target"
      >
        <ChevronRightIcon className="w-8 h-8 md:w-10 md:h-10 rotate-180" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setI((n) => (n + 1) % photos.length); }}
        aria-label="Next photo"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white hover:text-wp-red z-10 tap-target"
      >
        <ChevronRightIcon className="w-8 h-8 md:w-10 md:h-10" />
      </button>

      <figure
        className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.src}
          alt={p.caption || ''}
          className="max-w-full max-h-[75vh] object-contain"
        />
        <figcaption className="mt-3 max-w-2xl text-center text-sm font-sans text-gray-300">
          {p.caption && <span className="italic">{p.caption}</span>}
          {p.caption && p.credit && ' '}
          {p.credit && <span className="text-gray-500">({p.credit})</span>}
          <span className="block mt-1 text-xs text-gray-500">
            {i + 1} / {photos.length}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
