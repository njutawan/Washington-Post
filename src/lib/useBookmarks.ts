'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'wapo_bookmarks_v1';

export function useBookmarks() {
  const { data: session, status } = useSession();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  // Load initial: prefer server bookmarks if signed in, else localStorage
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'authenticated' && session?.bookmarks) {
      setBookmarks(new Set(session.bookmarks));
      setReady(true);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        setBookmarks(new Set(parsed));
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, [status, session]);

  // Persist local changes to localStorage (server sync is done by the button)
  useEffect(() => {
    if (!ready) return;
    if (status === 'authenticated') return; // don't overwrite server-stored list
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(bookmarks)));
    } catch {
      // ignore
    }
  }, [bookmarks, ready, status]);

  const isBookmarked = useCallback((slug: string) => bookmarks.has(slug), [bookmarks]);

  const toggleBookmark = useCallback((slug: string): boolean => {
    let added = false;
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
        added = false;
      } else {
        next.add(slug);
        added = true;
      }
      return next;
    });
    return added;
  }, []);

  return { bookmarks: Array.from(bookmarks), isBookmarked, toggleBookmark, ready };
}
