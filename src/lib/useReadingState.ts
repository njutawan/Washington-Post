'use client';

/**
 * Unified client-side reading state: bookmarks (existing), reading history
 * timeline, per-article scroll progress, and import/export.
 *
 * For signed-in users bookmarks sync to the server (existing API); all other
 * state (history + progress) is localStorage-only for now, merged on page
 * load. The hook exposes stable callbacks for use in article pages and the
 * account screen.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

const BOOKMARKS_KEY = 'wapo_bookmarks_v1';
const HISTORY_KEY = 'wapo_history_v1';
const PROGRESS_KEY = 'wapo_progress_v1';
const HISTORY_LIMIT = 100;

export type HistoryEntry = {
  slug: string;
  title?: string;
  section?: string;
  image?: string;
  firstVisitedAt: number;
  lastVisitedAt: number;
  visits: number;
  progress: number;       // 0-1
  readTime?: string;
};

export type ProgressMap = Record<string, { progress: number; updatedAt: number }>;

export type ExportFormat = {
  version: 1;
  exportedAt: number;
  bookmarks: string[];
  history: HistoryEntry[];
  progress: ProgressMap;
};

function readJSON<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export function useReadingState() {
  const { data: session, status } = useSession();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [ready, setReady] = useState(false);
  const hydratedServer = useRef(false);

  // ---------- Initial load ----------
  useEffect(() => {
    if (status === 'loading') return;

    // Bookmarks: server-stored if signed in, otherwise local
    let initialBookmarks = new Set<string>();
    if (status === 'authenticated' && session?.bookmarks?.length && !hydratedServer.current) {
      initialBookmarks = new Set(session.bookmarks);
      hydratedServer.current = true;
      // Merge in any local bookmarks that existed before sign-in (one-time)
      const local = readJSON<string[]>(BOOKMARKS_KEY, []);
      if (local.length) {
        local.forEach((s) => initialBookmarks.add(s));
        // Sync merged list back to server via the existing API on next tick
        fetch('/api/bookmarks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slugs: Array.from(initialBookmarks) }),
        }).catch(() => {});
        try { localStorage.removeItem(BOOKMARKS_KEY); } catch {}
      }
    } else {
      initialBookmarks = new Set(readJSON<string[]>(BOOKMARKS_KEY, []));
    }
    setBookmarks(initialBookmarks);

    setHistory(readJSON<HistoryEntry[]>(HISTORY_KEY, []));
    setProgress(readJSON<ProgressMap>(PROGRESS_KEY, {}));
    setReady(true);
  }, [status, session]);

  // ---------- Persist on change ----------
  useEffect(() => {
    if (!ready) return;
    if (status === 'authenticated') return; // bookmarks are on the server
    writeJSON(BOOKMARKS_KEY, Array.from(bookmarks));
  }, [bookmarks, ready, status]);

  useEffect(() => {
    if (!ready) return;
    writeJSON(HISTORY_KEY, history);
  }, [history, ready]);

  useEffect(() => {
    if (!ready) return;
    writeJSON(PROGRESS_KEY, progress);
  }, [progress, ready]);

  // ---------- Actions ----------
  const isBookmarked = useCallback((slug: string) => bookmarks.has(slug), [bookmarks]);

  const toggleBookmark = useCallback((slug: string): boolean => {
    let added = false;
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); added = false; }
      else { next.add(slug); added = true; }
      return next;
    });
    // Server sync for signed-in users (fire and forget; existing endpoint)
    if (status === 'authenticated') {
      fetch(`/api/bookmarks/${encodeURIComponent(slug)}`, { method: added ? 'PUT' : 'DELETE' })
        .catch(() => {});
    }
    return added;
  }, [status]);

  const recordVisit = useCallback((entry: Omit<HistoryEntry, 'firstVisitedAt' | 'lastVisitedAt' | 'visits' | 'progress'> & Partial<HistoryEntry>) => {
    setHistory((prev) => {
      const existing = prev.find((h) => h.slug === entry.slug);
      const now = Date.now();
      if (existing) {
        return [
          { ...existing, lastVisitedAt: now, visits: existing.visits + 1, title: entry.title || existing.title, image: entry.image || existing.image, section: entry.section || existing.section },
          ...prev.filter((h) => h.slug !== entry.slug),
        ];
      }
      const newEntry: HistoryEntry = {
        slug: entry.slug,
        title: entry.title,
        section: entry.section,
        image: entry.image,
        readTime: entry.readTime,
        firstVisitedAt: now,
        lastVisitedAt: now,
        visits: 1,
        progress: 0,
      };
      return [newEntry, ...prev].slice(0, HISTORY_LIMIT);
    });
  }, []);

  const updateProgress = useCallback((slug: string, pct: number) => {
    setProgress((prev) => ({ ...prev, [slug]: { progress: Math.max(0, Math.min(1, pct)), updatedAt: Date.now() } }));
    setHistory((prevH) => prevH.map((h) => (h.slug === slug ? { ...h, progress: Math.max(h.progress, pct) } : h)));
  }, []);

  const getProgress = useCallback((slug: string) => progress[slug]?.progress ?? 0, [progress]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setProgress({});
  }, []);

  const exportData = useCallback((): ExportFormat => ({
    version: 1,
    exportedAt: Date.now(),
    bookmarks: Array.from(bookmarks),
    history,
    progress,
  }), [bookmarks, history, progress]);

  const importData = useCallback(async (data: ExportFormat): Promise<{ added: number; imported: { bookmarks: number; history: number } }> => {
    if (!data || data.version !== 1) throw new Error('Unsupported export file');
    const importedBookmarks = new Set(Array.isArray(data.bookmarks) ? data.bookmarks : []);
    let added = 0;
    setBookmarks((prev) => {
      const next = new Set(prev);
      importedBookmarks.forEach((s) => {
        if (typeof s === 'string' && !next.has(s)) { next.add(s); added++; }
      });
      return next;
    });
    if (status === 'authenticated') {
      await fetch('/api/bookmarks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs: Array.from(bookmarks) }),
      }).catch(() => {});
    }
    setHistory((prev) => {
      const bySlug = new Map(prev.map((h) => [h.slug, h] as const));
      (data.history || []).forEach((h) => {
        if (!h?.slug) return;
        const ex = bySlug.get(h.slug);
        bySlug.set(h.slug, ex ? {
          ...ex,
          visits: ex.visits + (h.visits || 1),
          lastVisitedAt: Math.max(ex.lastVisitedAt, h.lastVisitedAt || 0),
          progress: Math.max(ex.progress, h.progress || 0),
        } : { ...h });
      });
      return Array.from(bySlug.values())
        .sort((a, b) => b.lastVisitedAt - a.lastVisitedAt)
        .slice(0, HISTORY_LIMIT);
    });
    setProgress((prev) => ({ ...prev, ...(data.progress || {}) }));
    return {
      added,
      imported: {
        bookmarks: importedBookmarks.size,
        history: (data.history || []).length,
      },
    };
  }, [status, bookmarks]);

  return {
    ready,
    bookmarks: Array.from(bookmarks),
    history,
    progress,
    isBookmarked,
    toggleBookmark,
    recordVisit,
    updateProgress,
    getProgress,
    clearHistory,
    exportData,
    importData,
  };
}

/**
 * Estimate remaining read time, given total article word count and current
 * scroll progress. Assumes ~220 wpm reading speed.
 */
export function estimateRemaining(
  wordCount: number,
  progress: number,
  wpm = 220,
): string {
  const p = Math.max(0, Math.min(1, progress));
  const wordsLeft = Math.max(0, Math.round(wordCount * (1 - p)));
  const minutesLeft = Math.max(1, Math.round(wordsLeft / wpm));
  return `${minutesLeft} min left`;
}

/** Count words (approximate) in an HTML string or plain text. */
export function countWords(text: string): number {
  if (!text) return 0;
  const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!stripped) return 0;
  return stripped.split(/\s+/).length;
}
