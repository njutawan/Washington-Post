'use client';

import { useEffect, useState } from 'react';

type Stats = {
  windowMinutes: number;
  sinceISO: string;
  totals: { events: number; pageviews: number; uniques: number };
  topPages: Array<{ path: string; views: number; uniques: number; avgDuration: number; avgScrollDepth: number }>;
  topReferrers: Array<{ source: string; views: number }>;
  eventsByName: Record<string, number>;
  funnel: { paywallSeen: number; paywallConvert: number; conversionRate: number };
  hourBuckets: Array<{ hour: string; views: number }>;
  counts: { shares: number; bookmarks: number; comments: number; newsletterSignups: number; pushSubscribes: number };
  note?: string;
};

function fmt(n: number) { return n.toLocaleString(); }
function fmtDur(s: number) {
  if (!s || !isFinite(s)) return '—';
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.round(s / 6) / 10}m`;
}
function pct(n: number) { return `${(n * 100).toFixed(1)}%`; }

function Bar({ value, max, className = 'bg-wp-red' }: { value: number; max: number; className?: string }) {
  const w = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 2;
  return <div className="h-2 bg-wp-light overflow-hidden"><div className={`h-full ${className}`} style={{ width: `${w}%` }} /></div>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [windowMin, setWindowMin] = useState(1440);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    fetch(`/api/analytics/stats?since=${windowMin}`)
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch((e) => { setErr(String(e)); setLoading(false); });
  }, [windowMin]);

  const maxViews = stats?.topPages?.[0]?.views ?? 0;
  const maxHour = Math.max(1, ...(stats?.hourBuckets?.map((h) => h.views) ?? [1]));

  return (
    <main className="bg-wp-cream min-h-screen pt-4">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="kicker text-wp-red">Editorial dashboard</p>
        <h1 className="headline text-4xl mb-1">Reader Analytics</h1>
        <p className="dek text-sm text-wp-gray mb-6">
          Privacy-friendly, cookieless, DNT-respecting. No personal data is retained beyond 10,000 rolling events in memory.
        </p>

        <div className="flex gap-2 mb-6 font-sans text-xs">
          {[
            { m: 60, l: 'Last hour' },
            { m: 360, l: '6 hours' },
            { m: 1440, l: '24 hours' },
            { m: 10080, l: '7 days' },
          ].map((o) => (
            <button
              key={o.m}
              onClick={() => setWindowMin(o.m)}
              className={`px-3 py-1.5 border-2 uppercase tracking-wider font-bold tap-target transition ${
                windowMin === o.m ? 'bg-wp-black text-white border-wp-black' : 'bg-white border-wp-black text-wp-black hover:bg-wp-light'
              }`}
            >{o.l}</button>
          ))}
        </div>

        {loading && <p className="font-sans text-sm">Loading…</p>}
        {err && <p className="font-sans text-sm text-wp-red">{err}</p>}
        {stats?.note && <p className="font-sans text-xs text-wp-gray mb-4">Note: {stats.note}</p>}

        {stats && (
          <>
            {/* KPI strip */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'Pageviews', value: fmt(stats.totals.pageviews) },
                { label: 'Unique sessions', value: fmt(stats.totals.uniques) },
                { label: 'Events tracked', value: fmt(stats.totals.events) },
                { label: 'Paywall conv.', value: pct(stats.funnel.conversionRate) },
              ].map((k) => (
                <div key={k.label} className="bg-white border-2 border-wp-black p-4">
                  <p className="kicker text-[10px] text-wp-gray">{k.label}</p>
                  <p className="headline text-3xl">{k.value}</p>
                </div>
              ))}
            </section>

            <section className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Shares / bookmarks etc */}
              <div className="bg-white border-2 border-wp-black p-5">
                <h2 className="headline text-xl mb-4">Engagement</h2>
                <ul className="font-sans text-sm divide-y divide-wp-border">
                  <li className="flex justify-between py-2"><span>Shares</span><span className="font-bold">{fmt(stats.counts.shares)}</span></li>
                  <li className="flex justify-between py-2"><span>Bookmarks added</span><span className="font-bold">{fmt(stats.counts.bookmarks)}</span></li>
                  <li className="flex justify-between py-2"><span>Comments posted</span><span className="font-bold">{fmt(stats.counts.comments)}</span></li>
                  <li className="flex justify-between py-2"><span>Newsletter signups</span><span className="font-bold">{fmt(stats.counts.newsletterSignups)}</span></li>
                  <li className="flex justify-between py-2"><span>Push subscriptions</span><span className="font-bold">{fmt(stats.counts.pushSubscribes)}</span></li>
                </ul>
              </div>

              {/* Paywall funnel */}
              <div className="bg-white border-2 border-wp-black p-5">
                <h2 className="headline text-xl mb-4">Paywall funnel</h2>
                <div className="space-y-4 font-sans text-sm">
                  <div>
                    <div className="flex justify-between mb-1"><span>Paywall seen</span><span className="font-bold">{fmt(stats.funnel.paywallSeen)}</span></div>
                    <Bar value={stats.funnel.paywallSeen} max={Math.max(stats.funnel.paywallSeen, 1)} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1"><span>Subscribe CTA clicks</span><span className="font-bold">{fmt(stats.funnel.paywallConvert)}</span></div>
                    <Bar value={stats.funnel.paywallConvert} max={Math.max(stats.funnel.paywallSeen, 1)} className="bg-wp-blue" />
                  </div>
                  <p className="text-xs text-wp-gray">Conversion rate: <span className="font-bold text-wp-red">{pct(stats.funnel.conversionRate)}</span></p>
                </div>
              </div>
            </section>

            {/* Traffic by hour */}
            <section className="bg-white border-2 border-wp-black p-5 mb-8">
              <h2 className="headline text-xl mb-4">Pageviews by hour</h2>
              <div className="flex items-end gap-1 h-40">
                {stats.hourBuckets.map((h) => (
                  <div key={h.hour} className="flex-1 flex flex-col items-center justify-end group" title={`${h.hour}:00 — ${h.views} views`}>
                    <div className="w-full bg-wp-red" style={{ height: `${(h.views / maxHour) * 100}%`, minHeight: h.views > 0 ? 4 : 0 }} />
                    <span className="text-[9px] font-sans text-wp-gray mt-1">{h.hour}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Top pages */}
              <div className="md:col-span-2 bg-white border-2 border-wp-black p-5">
                <h2 className="headline text-xl mb-4">Most-read pages</h2>
                <table className="w-full font-sans text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-wp-gray border-b border-wp-border">
                      <th className="text-left py-2 pr-2">Page</th>
                      <th className="text-right py-2 px-2">Views</th>
                      <th className="text-right py-2 px-2">Uniq.</th>
                      <th className="text-right py-2 px-2">Avg dur.</th>
                      <th className="text-right py-2 pl-2">Scroll</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPages.map((p, i) => (
                      <tr key={p.path} className="border-b border-wp-border">
                        <td className="py-2 pr-2">
                          <span className="text-wp-red font-bold mr-2">{i + 1}</span>
                          <span className="font-medium truncate max-w-[220px] inline-block align-middle">{p.path}</span>
                        </td>
                        <td className="text-right py-2 px-2 tabular-nums">{fmt(p.views)}</td>
                        <td className="text-right py-2 px-2 tabular-nums text-wp-gray">{fmt(p.uniques)}</td>
                        <td className="text-right py-2 px-2 tabular-nums">{fmtDur(p.avgDuration)}</td>
                        <td className="text-right py-2 pl-2 tabular-nums">{pct(p.avgScrollDepth)}</td>
                      </tr>
                    ))}
                    {stats.topPages.length === 0 && (
                      <tr><td colSpan={5} className="py-4 text-wp-gray text-center">No pageviews yet in this window.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Top referrers */}
              <div className="bg-white border-2 border-wp-black p-5">
                <h2 className="headline text-xl mb-4">Top referrers</h2>
                <ul className="font-sans text-sm space-y-2">
                  {stats.topReferrers.map((r) => (
                    <li key={r.source}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate mr-2">{r.source}</span>
                        <span className="tabular-nums font-bold">{fmt(r.views)}</span>
                      </div>
                      <Bar value={r.views} max={stats.topReferrers[0]?.views ?? 1} className="bg-wp-blue" />
                    </li>
                  ))}
                  {stats.topReferrers.length === 0 && <li className="text-wp-gray text-xs">No referrer data yet.</li>}
                </ul>
              </div>
            </section>

            <p className="text-xs font-sans text-wp-gray">
              Window starts {stats.sinceISO}. Data resets on server restart. For production persistence, point
              {' '}<code className="bg-wp-light px-1">track()</code> at a real Plausible/Umami instance via{' '}
              <code className="bg-wp-light px-1">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</code>.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
