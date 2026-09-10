'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BellIcon, XIcon, DownloadIcon } from './Icons';
import { usePushNotifications, useInstallPrompt, useOnline } from '@/lib/pwa';

/**
 * Floating PWA controls bar: shows install prompt when available, and a
 * "Subscribe to breaking news" bell that lets the user opt in to push with
 * topic selection. Dismissible; remembers dismissals per session.
 */
export default function PwaPrompt() {
  const online = useOnline();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const push = usePushNotifications();
  const [dismissed, setDismissed] = useState<{ install: boolean; push: boolean }>({
    install: false,
    push: false,
  });
  const [showPushPanel, setShowPushPanel] = useState(false);
  const [offlineQueuedNotice, setOfflineQueuedNotice] = useState(0);

  useEffect(() => {
    if (dismissed.push) return;
    // Auto-show push panel once after first visit if notifications are supported
    // and the user hasn't already decided.
    if (!push.supported) return;
    if (push.subscribed) return;
    const t = setTimeout(() => setShowPushPanel(true), 4000);
    return () => clearTimeout(t);
  }, [push.supported, push.subscribed, dismissed.push]);

  // Listen for bg sync completions from the SW.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'bg-sync-complete') {
        const ok = (e.data.results || []).filter((r: any) => r.ok).length;
        if (ok > 0) setOfflineQueuedNotice(ok);
      }
    };
    navigator.serviceWorker?.addEventListener('message', onMsg);
    return () => navigator.serviceWorker?.removeEventListener('message', onMsg);
  }, []);

  if (installed && push.subscribed && online && offlineQueuedNotice === 0) return null;

  return (
    <>
      {/* Offline indicator */}
      {!online && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-wp-black text-white text-center py-2 px-4 text-sm font-sans">
          You’re offline — reading cached pages. Saved actions will replay when you’re back online.
        </div>
      )}

      {/* Offline-queue flushed notification */}
      {online && offlineQueuedNotice > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-wp-green text-white text-center py-2 px-4 text-sm font-sans flex items-center justify-center gap-3">
          <span>Sent {offlineQueuedNotice} queued action{offlineQueuedNotice === 1 ? '' : 's'}.</span>
          <button onClick={() => setOfflineQueuedNotice(0)} className="underline tap-target">
            Dismiss
          </button>
        </div>
      )}

      {/* Install / subscribe bottom bar */}
      {(canInstall || (push.supported && !push.subscribed && !dismissed.push)) && (
        <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm z-40">
          <div className="bg-wp-black text-white p-4 shadow-2xl border-2 border-wp-red animate-slide-in">
            <button
              onClick={() => {
                setDismissed({ install: true, push: true });
                setShowPushPanel(false);
              }}
              aria-label="Dismiss"
              className="absolute top-2 right-2 text-gray-400 hover:text-white tap-target"
            >
              <XIcon className="w-4 h-4" />
            </button>

            {canInstall && !dismissed.install && !installed && (
              <div className="mb-3">
                <p className="kicker text-wp-red mb-1">App</p>
                <p className="font-serif text-base mb-3">Install The Post on your home screen for instant access.</p>
                <button
                  onClick={async () => {
                    const { outcome } = await promptInstall();
                    if (outcome === 'accepted') setDismissed((d) => ({ ...d, install: true }));
                  }}
                  className="flex items-center gap-2 bg-wp-red text-white px-4 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-white hover:text-wp-black transition tap-target w-full justify-center"
                >
                  <DownloadIcon className="w-4 h-4" /> Install app
                </button>
              </div>
            )}

            {push.supported && !push.subscribed && !dismissed.push && (
              <div className={canInstall && !dismissed.install ? 'border-t border-gray-700 pt-3' : ''}>
                {!showPushPanel ? (
                  <button
                    onClick={() => setShowPushPanel(true)}
                    className="flex items-center gap-2 w-full bg-wp-red text-white px-4 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-white hover:text-wp-black transition tap-target justify-center"
                  >
                    <BellIcon className="w-4 h-4" />
                    Subscribe to breaking news
                  </button>
                ) : (
                  <div>
                    <p className="kicker text-wp-red mb-1">Push alerts</p>
                    <p className="font-serif text-sm mb-3">
                      Get notified when big news breaks. You can change these anytime.
                    </p>
                    <div className="space-y-2 mb-3">
                      {[
                        { key: 'breaking', label: 'Breaking news', desc: 'Major developments as they happen' },
                        { key: 'opinions', label: 'Opinion alerts', desc: 'Top columns from our columnists' },
                        { key: 'morning', label: 'Morning briefing', desc: 'Daily digest at 7 a.m. ET' },
                      ].map((t) => {
                        const key = t.key as keyof typeof push.topics;
                        return (
                          <label key={t.key} className="flex items-start gap-2 text-xs font-sans cursor-pointer">
                            <input
                              type="checkbox"
                              checked={push.topics[key]}
                              onChange={(e) => push.updateTopics({ ...push.topics, [key]: e.target.checked })}
                              className="mt-0.5 w-4 h-4 accent-wp-red"
                            />
                            <span>
                              <span className="block font-bold">{t.label}</span>
                              <span className="text-gray-400">{t.desc}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {push.error && (
                      <p className="text-wp-red text-xs mb-2 font-sans">{push.error}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => push.subscribe()}
                        disabled={push.loading || push.permission === 'denied'}
                        className="flex-1 bg-wp-red text-white px-3 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-white hover:text-wp-black transition disabled:opacity-50 tap-target"
                      >
                        {push.permission === 'denied'
                          ? 'Enable in browser settings'
                          : push.loading ? 'Working…' : 'Enable alerts'}
                      </button>
                      <button
                        onClick={() => setDismissed((d) => ({ ...d, push: true }))}
                        className="px-3 py-2 text-xs font-sans text-gray-400 hover:text-white tap-target"
                      >
                        Not now
                      </button>
                    </div>
                    {push.permission === 'granted' && !push.subscribed && (
                      <p className="text-[10px] text-gray-400 mt-2 font-sans">
                        Permission granted — click Enable alerts to finish subscribing.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Already-subscribed subtle indicator (link to settings) */}
      {push.supported && push.subscribed && (
        <div className="hidden">
          <Link href="/account#alerts" aria-label="Manage push alerts" />
        </div>
      )}
    </>
  );
}
