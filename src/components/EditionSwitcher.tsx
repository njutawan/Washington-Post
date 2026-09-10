'use client';

import { useEffect, useState } from 'react';

const EDITIONS = [
  { id: 'us', label: 'U.S.' },
  { id: 'todayspaper', label: "Today's Paper" },
  { id: 'print', label: 'Print Edition' },
  { id: 'digital', label: 'Digital' },
  { id: 'intl', label: 'International' },
] as const;
type EditionId = typeof EDITIONS[number]['id'];
const KEY = 'wapo_edition_v1';

function readEdition(): EditionId {
  if (typeof window === 'undefined') return 'us';
  try {
    const v = localStorage.getItem(KEY);
    if (v && EDITIONS.some((e) => e.id === v)) return v as EditionId;
  } catch { /* ignore */ }
  return 'us';
}

/**
 * Edition switcher that appears in the Masthead date row (between the date
 * and the utility buttons). Cycles through U.S. / Today's Paper / Print /
 * Digital / International and persists to localStorage; click opens a
 * small popover menu.
 */
export default function EditionSwitcher() {
  const [edition, setEdition] = useState<EditionId>('us');
  const [open, setOpen] = useState(false);

  useEffect(() => { setEdition(readEdition()); }, []);

  function pick(id: EditionId) {
    setEdition(id);
    setOpen(false);
    try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
    // For demo purposes, "Today's Paper" links to the homepage with a
    // query parameter; "Print Edition" links to a simple printable view.
    if (id === 'print') window.location.href = '/?print=1';
    if (id === 'todayspaper') window.location.href = '/?edition=todayspaper';
    if (id === 'intl') window.location.href = '/?edition=intl';
    if (id === 'us') window.location.href = '/';
    if (id === 'digital') window.location.href = '/';
  }

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('[data-edition-switcher]')) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const current = EDITIONS.find((e) => e.id === edition) || EDITIONS[0];

  return (
    <div className="relative hidden md:flex items-center text-[11px]" data-edition-switcher>
      <span className="text-wp-gray mr-2 hidden lg:inline">Edition:</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 font-sans font-bold uppercase tracking-widest text-wp-black hover:text-wp-red tap-target px-2 py-1"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {current.label}
        <span aria-hidden="true" className="text-[8px] leading-none">▾</span>
      </button>
      {open && (
        <ul className="absolute left-0 top-full mt-0.5 bg-white border-2 border-wp-black shadow-lg z-50 min-w-[170px] py-1 text-left" role="menu">
          {EDITIONS.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => pick(e.id)}
                role="menuitemradio"
                aria-checked={e.id === edition}
                className={
                  'w-full text-left px-4 py-2 text-xs font-sans uppercase tracking-wider hover:bg-wp-light tap-target ' +
                  (e.id === edition ? 'text-wp-red font-bold' : 'text-wp-black')
                }
              >
                {e.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
