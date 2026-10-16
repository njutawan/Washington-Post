import { withApi,HttpError } from '@/lib/http-security';
import { acquireConnection,clientKey } from '@/lib/rate-limit';
import { securityLog } from '@/lib/security-log';
/**
 * Server-Sent Events endpoint for live blogs.
 *
 *   GET /api/live/updates?slug=shutdown-deal&since=1725888000000&poll=1
 *
 * Streams events as they're published by the in-memory store. Each event is a
 * JSON payload with shape { type: 'update' | 'ping' | 'sync', updates: LiveUpdate[] }.
 *
 * - `ping` events are sent every 15 seconds so proxies don't close the connection.
 * - `update` events fire for each newly published update.
 * - A `sync` event is sent immediately on connect containing any updates newer
 *   than `since` (so a reconnecting client catches up without a separate fetch).
 * - If the client passes `poll=1`, we fall back to a 30s polling JSON response
 *   for browsers/proxies that don't allow long-lived EventSource streams.
 */

import { NextRequest } from 'next/server';
import { getLiveUpdates, getUpdatesSince, isValidLiveSlug, subscribe, type LiveUpdate } from '@/lib/liveData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Event = {
  type: 'update' | 'sync' | 'ping';
  updates: LiveUpdate[];
  latestTimestamp: number;
};

async function updates(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';
  const sinceParam = searchParams.get('since');
  const poll = searchParams.get('poll') === '1';
  const since = sinceParam ? Number(sinceParam) : 0;
  if (!Number.isFinite(since) || since < 0) throw new HttpError(400,'Invalid timestamp');

  // Only known live-blog slugs are served — arbitrary slugs must not create
  // store entries / simulation timers (see liveData.isValidLiveSlug).
  if (!slug || !isValidLiveSlug(slug)) {
    return new Response(JSON.stringify({ error: 'unknown live blog' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Polling fallback: respond with current updates since `since` and close.
  if (poll) {
    const updates = getUpdatesSince(slug, since);
    const all = getLiveUpdates(slug);
    const latestTimestamp = all[0]?.timestamp ?? Date.now();
    return new Response(
      JSON.stringify({ updates, latestTimestamp }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, private',
        },
      },
    );
  }

  const release=await acquireConnection(clientKey(req));
  if(!release) throw new HttpError(429,'Too many live connections');
  // SSE streaming response
  const encoder = new TextEncoder();
  let unsub: (() => void) | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let closeStream: (()=>void) | undefined;
  const cleanup=()=>{
    if(closed)return;closed=true;
    unsub?.();if(pingTimer)clearInterval(pingTimer);if(expiry)clearTimeout(expiry);
    req.signal.removeEventListener('abort',onAbort);
    void release().catch(()=>securityLog('lease_cleanup_failed'));
  };
  const onAbort=()=>{cleanup();try{closeStream?.();}catch{/* stream already closed */}};

  const stream = new ReadableStream({
    start(controller) {
      closeStream=()=>controller.close();
      req.signal.addEventListener('abort',onAbort,{once:true});
      if(req.signal.aborted){onAbort();return;}
      // Hard lifetime < shared lease expiry; no unbounded sockets/timers.
      expiry=setTimeout(onAbort,90000);
      const send = (event: Event) => {
        if (closed) return;
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        try { controller.enqueue(encoder.encode(payload)); } catch { cleanup(); }
      };

      // Send initial sync so client catches up instantly.
      const initial = getUpdatesSince(slug, since);
      const all = getLiveUpdates(slug);
      send({
        type: 'sync',
        updates: initial,
        latestTimestamp: all[0]?.timestamp ?? Date.now(),
      });

      // Subscribe to new updates
      unsub = subscribe(slug, (update) => {
        send({ type: 'update', updates: [update], latestTimestamp: update.timestamp });
      });

      // Keep-alive ping
      pingTimer = setInterval(() => {
        const current = getLiveUpdates(slug);
        send({ type: 'ping', updates: [], latestTimestamp: current[0]?.timestamp ?? Date.now() });
      }, 15_000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export const GET=withApi({name:'live-read',max:30},updates);
