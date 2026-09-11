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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';
  const sinceParam = searchParams.get('since');
  const poll = searchParams.get('poll') === '1';
  const since = sinceParam ? Number(sinceParam) : 0;

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

  // SSE streaming response
  const encoder = new TextEncoder();
  let unsub: (() => void) | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: Event) => {
        if (closed) return;
        const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
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
      closed = true;
      if (unsub) unsub();
      if (pingTimer) clearInterval(pingTimer);
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
