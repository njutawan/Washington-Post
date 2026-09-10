'use client';

import { useState } from 'react';
import Lightbox from './Lightbox';
import ArticleImage from './ArticleImage';
import type { Photo } from './Lightbox';

export default function PhotoGallery({ photos, title }: { photos: Photo[]; title?: string }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  const openAt = (i: number) => { setIdx(i); setOpen(true); };

  return (
    <section className="mt-12 border-t-2 border-wp-black pt-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="headline text-2xl md:text-3xl">{title || 'In Focus'}</h2>
        <a href="#full-gallery" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline">
          See the full essay →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {photos.map((p, i) => (
          <button
            key={i}
            onClick={() => openAt(i)}
            className={
              'group relative overflow-hidden bg-gray-200 focus:outline-none ' +
              (i === 0 ? 'col-span-2 row-span-2' : '')
            }
            aria-label={`Open photo ${i + 1}: ${p.caption || ''}`}
          >
            <div className={i === 0 ? 'relative h-[300px] md:h-[400px] w-full' : 'relative h-40 md:h-48 w-full'}>
              <ArticleImage
                src={p.src}
                alt={p.caption || ''}
                fill
                sizes={i === 0 ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                className="object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            {i === 0 && p.caption && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-white text-left pointer-events-none">
                <p className="headline text-lg md:text-xl leading-tight">{p.caption}</p>
                {p.credit && <p className="text-[11px] font-sans text-gray-300 mt-1">{p.credit}</p>}
              </div>
            )}
          </button>
        ))}
      </div>

      <Lightbox photos={photos} startIndex={idx} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
