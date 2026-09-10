'use client';

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { track } from './track';

/**
 * Client-side PWA utilities: push-notification subscription manager,
 * beforeinstallprompt intercept, online/offline state, and background-sync
 * queue monitoring.
 */

type SwState = 'unsupported' | 'installing' | 'installed' | 'activated' | 'error';

function subscribeToSw(
  onStatus: (s: { state: SwState; update?: ServiceWorker | null }) => void,
): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    onStatus({ state: 'unsupported' });
    return () => {};
  }
  let swReg: ServiceWorkerRegistration | null = null;
  let activeWorker: ServiceWorker | null = null;
  const setFromReg = (reg: ServiceWorkerRegistration) => {
    swReg = reg;
    const worker = reg.installing || reg.waiting || reg.active;
    activeWorker = worker;
    if (!worker) {
      onStatus({ state: 'installed' });
      return;
    }
    const onStateChange = () => {
      onStatus({ state: (worker.state as SwState) || 'installed' });
    };
    worker.addEventListener('statechange', onStateChange);
    onStateChange();
  };
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      setFromReg(reg);
      reg.addEventListener('updatefound', () => setFromReg(reg));
    })
    .catch(() => onStatus({ state: 'error' }));

  return () => {};
}

export function useServiceWorker() {
  const [state, setState] = useState<SwState>(
    typeof window === 'undefined' || !('serviceWorker' in navigator) ? 'unsupported' : 'installing',
  );
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    let cancelled = false;
    const ready = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        if (cancelled) return;
        setRegistration(reg);
        const w = reg.installing || reg.waiting || reg.active;
        setState(w ? ((w.state as SwState) || 'installed') : 'installed');
        w?.addEventListener('statechange', () => {
          if (cancelled) return;
          setState((w.state as SwState) || 'installed');
        });
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (nw) nw.addEventListener('statechange', () => setState((nw.state as SwState) || 'installed'));
        });
      } catch {
        if (!cancelled) setState('error');
      }
    };
    ready();
    return () => { cancelled = true; };
  }, []);

  return { state, registration };
}

// ----- Online / offline -----
function getOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const on = () => cb();
      window.addEventListener('online', on);
      window.addEventListener('offline', on);
      return () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', on);
      };
    },
    getOnline,
    () => true,
  );
}

// ----- Install prompt -----
let deferredInstallPrompt: any = null;
const installListeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installListeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installListeners.forEach((l) => l());
  });
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(!!deferredInstallPrompt);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      setCanInstall(!!deferredInstallPrompt);
      setInstalled(!deferredInstallPrompt && window.matchMedia('(display-mode: standalone)').matches);
    };
    installListeners.add(handler);
    // Detect if already running in installed/PWA mode
    const mq = window.matchMedia('(display-mode: standalone)');
    const mqHandler = () => {
      setInstalled(mq.matches);
      setCanInstall(!!deferredInstallPrompt && !mq.matches);
    };
    mq.addEventListener?.('change', mqHandler);
    mqHandler();
    return () => {
      installListeners.delete(handler);
      mq.removeEventListener?.('change', mqHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredInstallPrompt) return { outcome: 'unavailable' };
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    setCanInstall(false);
    installListeners.forEach((l) => l());
    return { outcome };
  }, []);

  return { canInstall, installed, promptInstall };
}

// ----- Push notifications -----
export type PushTopics = {
  breaking: boolean;
  opinions: boolean;
  morning: boolean;
};
const DEFAULT_TOPICS: PushTopics = { breaking: true, opinions: false, morning: false };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function readTopics(): PushTopics {
  if (typeof localStorage === 'undefined') return DEFAULT_TOPICS;
  try {
    const stored = localStorage.getItem('wapo:push-topics');
    if (stored) return { ...DEFAULT_TOPICS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_TOPICS;
}

function writeTopics(t: PushTopics) {
  try { localStorage.setItem('wapo:push-topics', JSON.stringify(t)); } catch {}
}

export function usePushNotifications() {
  const { registration } = useServiceWorker();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [topics, setTopics] = useState<PushTopics>(DEFAULT_TOPICS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subRef = useRef<PushSubscription | null>(null);

  // Initialize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasPush = 'PushManager' in window && 'serviceWorker' in navigator && !!registration;
    setSupported(hasPush);
    setTopics(readTopics());
    setPermission(Notification?.permission || 'default');
    if (!hasPush || !registration) return;
    registration.pushManager.getSubscription().then((s) => {
      subRef.current = s;
      setSubscribed(!!s);
    });
  }, [registration]);

  const subscribe = useCallback(async (newTopics?: PushTopics) => {
    if (!registration) return;
    setLoading(true);
    setError(null);
    const t = newTopics || topics;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setError('Permission denied');
        setLoading(false);
        return;
      }
      const keyRes = await fetch('/api/push/key', { cache: 'no-store' });
      const { publicKey } = await keyRes.json();
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey).buffer as ArrayBuffer,
      });
      subRef.current = sub;
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          topics: Object.keys(t).filter((k) => (t as any)[k]),
        }),
      });
      setSubscribed(true);
      setTopics(t);
      writeTopics(t);
      track('push_subscribe', { props: { topicCount: Object.keys(t).filter((k) => (t as any)[k]).length } });
    } catch (e: any) {
      setError(e?.message || 'Subscription failed');
    } finally {
      setLoading(false);
    }
  }, [registration, topics]);

  const unsubscribe = useCallback(async () => {
    const sub = subRef.current;
    if (!sub) return;
    setLoading(true);
    try {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
      subRef.current = null;
      setSubscribed(false);
    } catch (e: any) {
      setError(e?.message || 'Unsubscribe failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTopics = useCallback(async (next: PushTopics) => {
    setTopics(next);
    writeTopics(next);
    if (subscribed) {
      // Re-subscribe (idempotent) to refresh the topic list server-side.
      await subscribe(next);
    }
  }, [subscribed, subscribe]);

  return { supported, permission, subscribed, topics, loading, error, subscribe, unsubscribe, updateTopics };
}
