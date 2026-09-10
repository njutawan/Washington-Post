'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useReadingState } from '@/lib/useReadingState';

type Ctx = ReturnType<typeof useReadingState>;

const ReadingCtx = createContext<Ctx | null>(null);

/** Provides reading state (bookmarks, history, progress, export/import) app-wide. */
export function ReadingProvider({ children }: { children: ReactNode }) {
  const state = useReadingState();
  const value = useMemo(() => state, [state]);
  return <ReadingCtx.Provider value={value}>{children}</ReadingCtx.Provider>;
}

export function useReading() {
  const ctx = useContext(ReadingCtx);
  if (!ctx) throw new Error('useReading must be used inside ReadingProvider');
  return ctx;
}
