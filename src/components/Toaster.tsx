'use client';

import { useEffect, useState } from 'react';

type ToastState = { id: number; message: string } | null;
let toastQueue: ToastState[] = [];
let listeners = new Set<(t: ToastState) => void>();
let nextId = 1;

export function showToast(message: string, duration = 2000) {
  const id = nextId++;
  const t = { id, message };
  toastQueue.push(t);
  listeners.forEach((fn) => fn(t));
  setTimeout(() => {
    toastQueue = toastQueue.filter((x) => x && x.id !== id);
    const next = toastQueue[toastQueue.length - 1] || null;
    listeners.forEach((fn) => fn(next));
  }, duration);
}

/**
 * Tiny global toast (bottom-center). Auto-dismisses; used for "link copied"
 * confirmations, bookmark toggles, etc.
 */
export default function Toaster() {
  const [current, setCurrent] = useState<ToastState>(null);
  useEffect(() => {
    function onToast(t: ToastState) { setCurrent(t); }
    listeners.add(onToast);
    return () => { listeners.delete(onToast); };
  }, []);
  if (!current) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-fadeUp"
      role="status"
      aria-live="polite"
    >
      <div className="bg-wp-black text-white px-5 py-3 font-sans font-bold text-sm tracking-wider shadow-2xl border-2 border-wp-red">
        {current.message}
      </div>
    </div>
  );
}
