'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { LiveUpdate } from '@/lib/liveData';

type State = {
  updates: LiveUpdate[];
  pending: LiveUpdate[];   // arrived but user hasn't scrolled up to see them
  latestTimestamp: number;
  connected: boolean;
  error: string | null;
};

/**
 * Subscribe to a live blog. Tries SSE (EventSource) first and falls back to
 * 30-second polling if SSE fails to connect within 5s (some corporate
 * proxies/preview hosts block streaming).
 *
 * Returns the current rendered list + a "pending" buffer (new updates that
 * haven't been merged in yet — the caller shows a "X new updates" badge and
 * calls applyPending() to merge them optimistically at the top).
 */
export function useLiveUpdates(slug: string, initial: LiveUpdate[] = []) {
  const [state, setState] = useState<State>(() => ({
    updates: initial,
    pending: [],
    latestTimestamp: initial[0]?.timestamp ?? 0,
    connected: false,
    error: null,
  }));

  // Refs so closures/setIntervals see current values without re-subscribing
  const stateRef = useRef(state);
  stateRef.current = state;

  const esRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'sse' | 'poll' | null>(null);
  const sseConnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failCount = useRef(0);

  const mergeIncoming = useCallback((incoming: LiveUpdate[]) => {
    if (!incoming.length) return;
    setState((prev) => {
      // Deduplicate against existing + pending by id
      const seen = new Set<string>([
        ...prev.updates.map((u) => u.id),
        ...prev.pending.map((u) => u.id),
      ]);
      const fresh = incoming.filter((u) => !seen.has(u.id));
      if (!fresh.length) {
        return prev;
      }
      // Optimistic insert: add to the pending buffer until user applies them.
      const newPending = [...fresh, ...prev.pending].sort(
        (a, b) => b.timestamp - a.timestamp,
      );
      const latestTs = Math.max(prev.latestTimestamp, ...fresh.map((u) => u.timestamp));
      return {
        ...prev,
        pending: newPending,
        latestTimestamp: latestTs,
        error: null,
      };
    });
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const stopSSE = useCallback(() => {
    if (sseConnectTimeout.current) clearTimeout(sseConnectTimeout.current);
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopSSE();
    modeRef.current = 'poll';
    setState((s) => ({ ...s, connected: true, error: null }));
    const pollOnce = async () => {
      try {
        const since = stateRef.current.latestTimestamp;
        const res = await fetch(
          `/api/live/updates?slug=${encodeURIComponent(slug)}&since=${since}&poll=1`,
          { cache: 'no-store' },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          updates: LiveUpdate[];
          latestTimestamp: number;
        };
        if (data.updates?.length) mergeIncoming(data.updates);
        failCount.current = 0;
      } catch (e: any) {
        failCount.current++;
        setState((s) => ({ ...s, error: e?.message || 'Connection lost' }));
      }
    };
    pollOnce();
    pollTimerRef.current = setInterval(pollOnce, 30_000);
  }, [slug, mergeIncoming, stopSSE]);

  const startSSE = useCallback(() => {
    stopPolling();
    modeRef.current = 'sse';
    const since = stateRef.current.latestTimestamp;
    const url = `/api/live/updates?slug=${encodeURIComponent(slug)}&since=${since}`;
    const es = new EventSource(url);
    esRef.current = es;

    // If we don't get an open event in 5 seconds, fall back to polling.
    sseConnectTimeout.current = setTimeout(() => {
      if (modeRef.current === 'sse' && esRef.current?.readyState !== EventSource.OPEN) {
        startPolling();
      }
    }, 5000);

    es.onopen = () => {
      if (sseConnectTimeout.current) clearTimeout(sseConnectTimeout.current);
      setState((s) => ({ ...s, connected: true, error: null }));
      failCount.current = 0;
    };

    es.addEventListener('sync', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as {
          updates: LiveUpdate[];
          latestTimestamp: number;
        };
        if (data.updates?.length) mergeIncoming(data.updates);
      } catch {}
    });

    es.addEventListener('update', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data) as {
          updates: LiveUpdate[];
          latestTimestamp: number;
        };
        if (data.updates?.length) mergeIncoming(data.updates);
      } catch {}
    });

    es.addEventListener('ping', () => {
      // keep-alive; nothing to do except mark connected
      setState((s) => (s.connected ? s : { ...s, connected: true }));
    });

    es.onerror = () => {
      // Browsers auto-reconnect EventSource, but if we've failed several times
      // in a row, give up and switch to polling fallback.
      failCount.current++;
      if (failCount.current >= 3) {
        startPolling();
      } else {
        setState((s) => ({ ...s, error: 'Reconnecting…' }));
      }
    };
  }, [slug, mergeIncoming, stopPolling, startPolling]);

  // Subscribe on mount / slug change
  useEffect(() => {
    if (!slug) return;
    startSSE();
    return () => {
      // Copy ref to a local variable so cleanup always uses the same handle.
      const rt = reconnectTimer.current;
      if (rt) clearTimeout(rt);
      stopSSE();
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  // Note: startSSE/stopSSE/stopPolling are stable callbacks built from refs,
  // so intentionally not listing them as dependencies.

  // When user clicks "Show N new updates", merge pending into the visible list
  // (optimistic UI — we assume the server stream is the source of truth and
  // we're just revealing what we already received).
  const applyPending = useCallback(() => {
    setState((prev) => {
      if (!prev.pending.length) return prev;
      const merged = [...prev.pending, ...prev.updates].sort(
        (a, b) => b.timestamp - a.timestamp,
      );
      return { ...prev, updates: merged, pending: [] };
    });
    // Scroll to top of updates list after a brief tick so DOM is updated.
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const el = document.getElementById('live-updates');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  const pendingCount = state.pending.length;

  return {
    updates: state.updates,
    pending: state.pending,
    pendingCount,
    connected: state.connected,
    error: state.error,
    latestTimestamp: state.latestTimestamp,
    applyPending,
    /** Force a reconnect (e.g. after returning to the tab). */
    reconnect: modeRef.current === 'poll' ? startPolling : startSSE,
  };
}
