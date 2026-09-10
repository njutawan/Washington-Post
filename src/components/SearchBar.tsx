'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchIcon, CloseIcon } from './Icons';

export default function SearchBar({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // UI-only for now: log and navigate to /search
      window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className={
          compact
            ? 'p-2 hover:bg-wp-light text-wp-black hover:text-wp-red transition'
            : 'flex items-center gap-2 p-2 hover:bg-wp-light text-wp-black hover:text-wp-red transition'
        }
      >
        <SearchIcon className="w-[18px] h-[18px]" />
        {!compact && <span className="hidden lg:inline text-xs font-sans font-bold uppercase tracking-wider">Search</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="bg-wp-cream w-full max-w-2xl shadow-2xl border border-wp-black"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="flex items-center border-b-2 border-wp-black">
              <SearchIcon className="w-5 h-5 ml-4 text-wp-gray" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search The Washington Post…"
                className="flex-1 bg-transparent px-3 py-4 text-lg font-serif outline-none placeholder:text-wp-gray"
                aria-label="Search query"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="p-4 hover:text-wp-red"
              >
                <CloseIcon />
              </button>
            </form>
            <div className="p-4">
              <p className="kicker text-wp-gray mb-3">Popular on The Post</p>
              <ul className="divide-y divide-wp-border border-t border-b border-wp-border">
                {[
                  'Government shutdown',
                  'Election 2026',
                  'Federal Reserve',
                  'NFL standings',
                ].map((term) => (
                  <li key={term}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(term);
                        window.location.href = `/search?q=${encodeURIComponent(term)}`;
                      }}
                      className="w-full text-left py-3 flex items-center justify-between font-serif text-base hover:text-wp-link"
                    >
                      <span>{term}</span>
                      <span className="text-wp-gray text-sm font-sans">↗</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs font-sans text-wp-gray mt-3">
                Press <kbd className="px-1.5 py-0.5 border border-wp-border bg-white text-[10px] font-mono">⌘K</kbd> to open search · <kbd className="px-1.5 py-0.5 border border-wp-border bg-white text-[10px] font-mono">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
