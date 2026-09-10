'use client';

import { useEffect, useState } from 'react';
import PwaPrompt from './PwaPrompt';

/**
 * Registers the service worker and mounts PWA UI (install prompt,
 * push-subscribe prompt, offline indicator, bg-sync replay notice).
 *
 * Registers in both production and dev (dev users can set
 * NEXT_PUBLIC_DISABLE_SW=1 to opt out). When coming back online we ask the
 * SW to replay any queued offline mutations (background sync with
 * navigator.serviceWorker.ready.sync.register, with a message-passing
 * fallback for browsers without SyncManager).
 */
export default function PWAInit() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NEXT_PUBLIC_DISABLE_SW === '1') return;

    let reg: ServiceWorkerRegistration | null = null;

    const register = async () => {
      try {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        // If an updated SW is waiting, prompt it to take control on next load
        if (reg.waiting) reg.waiting.postMessage({ type: 'skip-waiting' });
        reg.addEventListener('updatefound', () => {
          const nw = reg?.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              nw.postMessage({ type: 'skip-waiting' });
            }
          });
        });
      } catch {
        /* non-critical */
      }
    };

    const replayQueue = async () => {
      if (!reg) {
        try { reg = await navigator.serviceWorker.ready; } catch { return; }
      }
      // Prefer Background Sync if available
      try {
        // @ts-ignore
        if ('sync' in reg && reg.sync) {
          // @ts-ignore
          await reg.sync.register('wapo-bg-sync');
          return;
        }
      } catch {}
      // Fallback: postMessage to SW to replay immediately
      if (reg.active) reg.active.postMessage({ type: 'replay-queue' });
    };

    const onOnline = () => { replayQueue(); };

    window.addEventListener('load', register, { once: true });
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!mounted) return null;
  return <PwaPrompt />;
}
