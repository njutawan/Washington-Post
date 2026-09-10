/**
 * In-memory live-blog data store.
 *
 * For the demo this is a module-scoped singleton shared across all requests
 * so the SSE endpoint and initial SSR both see the same timeline. In a
 * production deployment this would be backed by a database / Redis stream and
 * only used here as a thin fetch layer.
 *
 * The store periodically emits fresh "simulated" updates so the live blog
 * actually feels live during a demo. Each new entry gets a monotonic id +
 * server timestamp that the client can use for last-seen bookkeeping.
 */

export type LiveUpdate = {
  id: string;
  slug: string;
  time: string;            // human-readable "3:42 PM ET"
  timestamp: number;       // epoch ms for ordering/last-seen
  title: string;
  body: string;
  live?: boolean;          // pulse the "LIVE" badge on this entry
  byline?: string;
};

// ----- Demo content for the shutdown live blog -----
const shutdownSeed: Omit<LiveUpdate, 'id' | 'slug' | 'timestamp'>[] = [
  {
    time: '3:42 PM ET',
    title: 'Senate announces Saturday vote after bipartisan deal reached',
    body:
      'Senate Majority Leader Chuck Schumer announced the chamber will vote Saturday afternoon on the stopgap funding bill passed by the House earlier today. The vote is expected to pass with bipartisan support.',
    live: true,
  },
  {
    time: '2:58 PM ET',
    title: 'Biden: “No one benefits from a shutdown”',
    body:
      'The president told reporters he would sign the bill immediately upon arrival in the Senate, saying "nobody wins when the government closes its doors."',
  },
  {
    time: '2:15 PM ET',
    title: 'House passes bill 236-192, as Democrats deliver key votes',
    body:
      'The final tally reflected deep divisions within the Republican conference. A final headcount showed 148 Republicans and 88 Democrats in support.',
  },
  {
    time: '1:30 PM ET',
    title: 'Speaker defends decision to bring “clean” bill to floor',
    body:
      '"We were sent here to govern," Johnson told reporters, adding that he would not apologize for keeping the government open.',
  },
  {
    time: '12:05 PM ET',
    title: 'Markets climb on news of deal',
    body:
      'The S&P 500 rose 0.8 percent in afternoon trading as investors priced in the increasing likelihood of a deal.',
  },
  {
    time: '11:22 AM ET',
    title: 'What happens if the government shuts down?',
    body:
      'Federal workers would be furloughed, national parks would close, and a range of economic data releases would be delayed.',
  },
];

// ----- Rotating pool of "new" updates we randomly inject during a demo -----
const rotatingPool: Omit<LiveUpdate, 'id' | 'slug' | 'timestamp'>[] = [
  {
    time: '4:05 PM ET',
    title: 'Schumer: “The Senate will stay in session tonight if we have to”',
    body:
      'In a floor speech minutes ago, the majority leader told colleagues to expect votes late into the evening and warned against last-minute amendments that could sink the bill.',
    live: true,
  },
  {
    time: '4:18 PM ET',
    title: 'White House briefing: Biden watching vote from residence',
    body:
      'Press Secretary Karine Jean-Pierre told reporters the president is monitoring whip counts from the Residence and has placed calls to at least three undecided senators this afternoon.',
  },
  {
    time: '4:31 PM ET',
    title: 'Freedom Caucus chair calls vote “a betrayal”',
    body:
      'Rep. Scott Perry (R-Pa.) issued a statement saying he would support a motion to vacate against Speaker Johnson if the CR passes with Democratic votes.',
  },
  {
    time: '4:47 PM ET',
    title: 'Senate parliamentarian signs off on CR text',
    body:
      'The nonpartisan Senate parliamentarian has signed off on the continuing resolution text, clearing the last procedural hurdle before a vote.',
    live: true,
  },
  {
    time: '5:02 PM ET',
    title: 'DHS issues shutdown contingency plan',
    body:
      'The Department of Homeland Security released a 38-page contingency plan outlining which operations would continue and which would pause if funding lapses Sunday night.',
  },
  {
    time: '5:16 PM ET',
    title: 'Airport security lines could stretch if shutdown hits, TSA warns',
    body:
      'TSA Administrator David Pekoske told CNN that unpaid sick calls among screeners could jump to 10-15 percent within 48 hours of a lapse, similar to the 2018-19 shutdown.',
  },
  {
    time: '5:33 PM ET',
    title: 'Wall Street closes higher on shutdown optimism',
    body:
      'The Dow Jones Industrial Average closed up 312 points — its best single day in three weeks — as investors bet Congress will avert a shutdown before the deadline.',
  },
  {
    time: '5:48 PM ET',
    title: 'Sen. Rand Paul objects to unanimous consent request',
    body:
      'Sen. Rand Paul (R-Ky.) objected to a unanimous consent request to speed up the vote, adding at least 30 minutes to the clock, a Senate aide confirmed.',
    live: true,
  },
];

const store: Record<string, LiveUpdate[]> = {};
const subscribers = new Map<string, Set<(u: LiveUpdate) => void>>();
const nextSeq: Record<string, number> = {};
const timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};
const lastIssuedTs: Record<string, number> = {};

/** Legacy URL slugs that should resolve to the same live stream as a canonical slug. */
const LEGACY_SLUG_MAP: Record<string, string> = {
  'shutdown-countdown': 'shutdown-deal',
};

function ensureBlog(slug: string) {
  if (store[slug]) return;
  // Canonical demo live blogs live under one id; we accept a couple of legacy
  // URL slugs that point to the same stream.
  const canonicalSlug = LEGACY_SLUG_MAP[slug] || slug;
  if (canonicalSlug !== slug) {
    // Recurse to seed the canonical blog, then alias subscribers map.
    ensureBlog(canonicalSlug);
    store[slug] = store[canonicalSlug];
    nextSeq[slug] = nextSeq[canonicalSlug];
    lastIssuedTs[slug] = lastIssuedTs[canonicalSlug];
    subscribers.set(slug, subscribers.get(canonicalSlug)!);
    return;
  }
  // Seed the shutdown live blog with the demo content. Unknown slugs get empty feeds.
  if (canonicalSlug === 'shutdown-deal') {
    const now = Date.now();
    store[slug] = shutdownSeed.map((u, i) => ({
      ...u,
      id: `${slug}-${i + 1}`,
      slug,
      // Pretend seed entries were posted at staggered intervals in the past
      timestamp: now - (shutdownSeed.length - i) * 7 * 60 * 1000,
    }));
    nextSeq[slug] = shutdownSeed.length + 1;
    lastIssuedTs[slug] = Math.max(...store[slug].map((u) => u.timestamp));
  } else {
    store[slug] = [];
    nextSeq[slug] = 1;
  }
  subscribers.set(slug, new Set());
}

function formatET(ts: number): string {
  // Naive ET display: we just subtract 4h from UTC (EDT). Good enough for a demo.
  const d = new Date(ts - 4 * 60 * 60 * 1000);
  let h = d.getUTCHours();
  const m = d.getUTCMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm} ET`;
}

function pushNewUpdate(slug: string, template?: Omit<LiveUpdate, 'id' | 'slug' | 'timestamp'>) {
  ensureBlog(slug);
  const pool = rotatingPool;
  const tpl = template || pool[Math.floor(Math.random() * pool.length)];
  // Guarantee monotonically increasing timestamps even if Date.now() doesn't
  // advance between rapid calls.
  let ts = Date.now();
  const prev = lastIssuedTs[slug] || 0;
  if (ts <= prev) ts = prev + 1;
  lastIssuedTs[slug] = ts;
  const update: LiveUpdate = {
    ...tpl,
    id: `${slug}-${nextSeq[slug]++}`,
    slug,
    timestamp: ts,
    time: formatET(ts),
    // Mark every third simulated update as "LIVE" so the pulse badge appears.
    live: (nextSeq[slug] % 3 === 0) ? true : !!tpl.live,
  };
  // Newest first
  store[slug].unshift(update);
  // Notify all SSE subscribers
  const subs = subscribers.get(slug);
  if (subs) {
    subs.forEach((fn) => {
      try { fn(update); } catch { /* subscriber already gone */ }
    });
  }
  return update;
}

/** Start auto-publishing simulated updates for a slug (e.g. every ~45–75s). */
function startSimulation(slug: string) {
  if (timers[slug]) return;
  // Randomize first delay slightly so reconnects don't cluster.
  const tick = () => {
    pushNewUpdate(slug);
    timers[slug] = setTimeout(tick, 45_000 + Math.random() * 30_000);
  };
  timers[slug] = setTimeout(tick, 30_000 + Math.random() * 20_000);
}

/** Get the current list of updates for a slug (SSR-safe). */
export function getLiveUpdates(slug: string): LiveUpdate[] {
  ensureBlog(slug);
  // Return copy, newest first
  return [...store[slug]].sort((a, b) => b.timestamp - a.timestamp);
}

/** Get updates strictly newer than a given timestamp. */
export function getUpdatesSince(slug: string, since: number): LiveUpdate[] {
  ensureBlog(slug);
  return store[slug]
    .filter((u) => u.timestamp > since)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/** Register a subscriber that will be called with every new update. */
export function subscribe(slug: string, fn: (u: LiveUpdate) => void): () => void {
  ensureBlog(slug);
  startSimulation(slug);
  const subs = subscribers.get(slug)!;
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
}

/** Manually inject an update (useful for tests / admin tools). */
export function addLiveUpdate(slug: string, partial: Partial<LiveUpdate> & { title: string; body: string }): LiveUpdate {
  return pushNewUpdate(slug, {
    time: formatET(Date.now()),
    title: partial.title,
    body: partial.body,
    live: partial.live ?? true,
    byline: partial.byline,
  });
}
