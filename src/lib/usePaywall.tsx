'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

const FREE_LIMIT = 3;
const STORAGE_KEY = 'wapo_articles_read_v1';

type PaywallCtx = {
  articlesRead: number;
  hasReachedLimit: boolean;
  registerArticleView: (slug: string) => boolean; // returns true if blocked
  reset: () => void;
  dismissed: boolean;
  dismiss: () => void;
};

const Ctx = createContext<PaywallCtx | null>(null);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [articlesRead, setArticlesRead] = useState(0);
  const [readSlugs, setReadSlugs] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { count: number; slugs: string[] };
        setArticlesRead(parsed.count || 0);
        setReadSlugs(new Set(parsed.slugs || []));
      }
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: articlesRead, slugs: Array.from(readSlugs) }));
    } catch { /* ignore */ }
  }, [articlesRead, readSlugs, ready]);

  const registerArticleView = useCallback((slug: string): boolean => {
    if (!ready) return false;
    if (readSlugs.has(slug)) return false; // already counted
    const nextSlugs = new Set(readSlugs);
    nextSlugs.add(slug);
    setReadSlugs(nextSlugs);
    const nextCount = articlesRead + 1;
    setArticlesRead(nextCount);
    setDismissed(false);
    return nextCount > FREE_LIMIT;
  }, [articlesRead, readSlugs, ready]);

  const reset = useCallback(() => {
    setArticlesRead(0);
    setReadSlugs(new Set());
    setDismissed(false);
  }, []);

  return (
    <Ctx.Provider value={{
      articlesRead,
      hasReachedLimit: articlesRead >= FREE_LIMIT,
      registerArticleView,
      reset,
      dismissed,
      dismiss: () => setDismissed(true),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePaywall() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePaywall must be used inside PaywallProvider');
  return ctx;
}
