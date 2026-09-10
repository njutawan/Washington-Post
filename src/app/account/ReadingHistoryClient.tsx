'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useReading } from '@/components/ReadingProvider';
import ArticleImage from '@/components/ArticleImage';
import { HistoryIcon, BookmarkIcon, DownloadExportIcon, UploadIcon, TrashIcon } from '@/components/Icons';
import type { HistoryEntry } from '@/lib/useReadingState';

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function ReadingHistoryClient() {
  const { history, bookmarks, clearHistory, exportData, importData, ready, isBookmarked } = useReading();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<'history' | 'saved'>('history');

  const onExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wapo-reading-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const result = await importData(parsed);
      setImportMsg(`Imported ${result.imported.bookmarks} bookmarks, ${result.imported.history} history entries`);
      setTimeout(() => setImportMsg(null), 4000);
    } catch (e: any) {
      setImportMsg(`Import failed: ${e?.message || 'invalid file'}`);
      setTimeout(() => setImportMsg(null), 4000);
    }
  };

  const bookmarkSlugs = new Set(bookmarks);
  const entries: HistoryEntry[] =
    tab === 'history'
      ? history
      : history.filter((h) => bookmarkSlugs.has(h.slug));
  const savedWithoutHistory = bookmarks.filter((slug) => !history.some((h) => h.slug === slug));

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-wp-border flex-wrap">
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')} icon={<HistoryIcon className="w-4 h-4" />} label="Recently read" count={history.length} />
        <TabBtn active={tab === 'saved'} onClick={() => setTab('saved')} icon={<BookmarkIcon className="w-4 h-4" />} label="Saved" count={bookmarks.length} />
        <div className="ml-auto flex items-center gap-2 pb-2">
          <button
            onClick={onExport}
            disabled={!ready}
            className="flex items-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black tap-target"
            title="Export bookmarks & history as JSON"
          >
            <DownloadExportIcon className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black tap-target"
            title="Import from an exported JSON file"
          >
            <UploadIcon className="w-4 h-4" /> Import
          </button>
          {tab === 'history' && history.length > 0 && (
            <button
              onClick={() => { if (confirm('Clear all reading history?')) clearHistory(); }}
              className="flex items-center gap-1 text-[11px] font-sans font-bold uppercase tracking-wider text-wp-red hover:underline tap-target"
            >
              <TrashIcon className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
      {importMsg && (
        <div className="bg-wp-light border-2 border-wp-black px-4 py-2 text-xs font-sans">{importMsg}</div>
      )}

      {entries.length === 0 && savedWithoutHistory.length === 0 && tab === 'history' && (
        <p className="dek text-sm text-wp-gray">
          Articles you read will appear here. Progress is saved automatically as you scroll.
        </p>
      )}
      {tab === 'saved' && entries.length === 0 && savedWithoutHistory.length === 0 && (
        <p className="dek text-sm text-wp-gray">
          You haven’t saved any stories yet. Tap the bookmark icon on any article to save it here.
        </p>
      )}

      <ul className="divide-y divide-wp-border">
        {entries.map((h) => (
          <li key={h.slug} className="py-4">
            <Link href={`/article/${h.slug}`} className="flex gap-4 group">
              {h.image ? (
                <div className="w-24 h-20 sm:w-28 sm:h-20 flex-shrink-0 bg-gray-100 overflow-hidden relative">
                  <ArticleImage src={h.image} alt={h.title || ''} fill sizes="112px" className="object-cover" />
                </div>
              ) : (
                <div className="w-24 h-20 sm:w-28 sm:h-20 flex-shrink-0 bg-wp-light flex items-center justify-center">
                  <HistoryIcon className="w-6 h-6 text-wp-gray" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {h.section && <div className="kicker text-wp-red mb-1">{h.section}</div>}
                <h3 className="headline text-base sm:text-lg leading-snug group-hover:text-wp-link mb-1">
                  {h.title || h.slug.replace(/-/g, ' ')}
                </h3>
                <div className="flex items-center gap-2 text-xs font-sans text-wp-gray mt-1 flex-wrap">
                  <span>{formatRelative(h.lastVisitedAt)}</span>
                  {h.visits > 1 && <span>· {h.visits} visits</span>}
                  {h.readTime && <span>· {h.readTime}</span>}
                  {h.progress > 0.05 && (
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-12 h-1 bg-wp-border rounded-sm overflow-hidden">
                        <span className="block h-full bg-wp-red" style={{ width: `${Math.round(h.progress * 100)}%` }} />
                      </span>
                      {Math.round(h.progress * 100)}%
                    </span>
                  )}
                  {bookmarkSlugs.has(h.slug) && (
                    <BookmarkIcon className="w-3 h-3 text-wp-red" filled />
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {/* Saved bookmarks that don't have history entries yet (e.g. imported) */}
        {savedWithoutHistory.map((slug) => (
          <li key={slug} className="py-3 flex items-center gap-3">
            <BookmarkIcon className="w-4 h-4 text-wp-red flex-shrink-0" filled />
            <Link href={`/article/${slug}`} className="headline text-base hover:text-wp-link flex-1 leading-snug">
              {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'flex items-center gap-1.5 px-4 py-2.5 text-xs font-sans font-bold uppercase tracking-wider tap-target -mb-px border-b-2 ' +
        (active ? 'border-wp-black text-wp-black' : 'border-transparent text-wp-gray hover:text-wp-black')
      }
    >
      {icon} {label} <span className="text-wp-gray font-normal">({count})</span>
    </button>
  );
}
