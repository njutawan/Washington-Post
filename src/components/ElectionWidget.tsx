import Link from 'next/link';

type Candidate = { name: string; party: 'dem' | 'gop' | 'ind'; pct: number; ev?: number };
type Race = {
  office: string;
  state?: string;
  called?: 'dem' | 'gop' | null;
  pctIn?: number;
  candidates: [Candidate, Candidate];
};

const DEFAULT_RACES: Race[] = [
  {
    office: 'President',
    called: null,
    pctIn: 74,
    candidates: [
      { name: 'Harris', party: 'dem', pct: 48.4, ev: 226 },
      { name: 'Trump', party: 'gop', pct: 49.3, ev: 251 },
    ],
  },
  {
    office: 'Senate',
    state: 'Arizona',
    pctIn: 61,
    candidates: [
      { name: 'Gallego', party: 'dem', pct: 50.1 },
      { name: 'Lake', party: 'gop', pct: 47.7 },
    ],
  },
  {
    office: 'Governor',
    state: 'North Carolina',
    called: 'gop',
    pctIn: 99,
    candidates: [
      { name: 'Stein', party: 'dem', pct: 47.2 },
      { name: 'Robinson', party: 'gop', pct: 49.8 },
    ],
  },
  {
    office: 'House',
    pctIn: 82,
    candidates: [
      { name: 'Democrats', party: 'dem', pct: 48.3 },
      { name: 'Republicans', party: 'gop', pct: 49.6 },
    ],
  },
];

function partyLabel(p: 'dem' | 'gop' | 'ind') {
  return p === 'dem' ? 'Dem.' : p === 'gop' ? 'GOP' : 'Ind.';
}

/**
 * WaPo-style "Election Scoreboard" module — hard-coded sample data for demo
 * purposes. In production this would be wired to AP election results via
 * /api/elections. Callers can pass `races` to override defaults.
 */
export default function ElectionWidget({
  races = DEFAULT_RACES,
  title = 'Election 2026 Scoreboard',
}: {
  races?: Race[];
  title?: string;
}) {
  const presidential = races.find((r) => r.office === 'President');
  return (
    <section className="election-widget not-prose" aria-label={title}>
      <div className="ew-head">
        <div>
          <p className="kicker text-wp-red text-[11px] uppercase tracking-[0.15em] font-bold mb-1">
            Elections
          </p>
          <h3 className="headline text-xl leading-tight">{title}</h3>
        </div>
        <Link
          href="/politics"
          className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline whitespace-nowrap ml-4"
        >
          Live results →
        </Link>
      </div>

      {presidential && (
        <div className="mb-4 pb-4 border-b border-wp-border">
          <p className="text-[11px] font-sans uppercase tracking-wider text-wp-gray mb-2">
            Electoral College · {presidential.pctIn}% in · 270 to win
          </p>
          <div className="flex items-center justify-between font-sans">
            <div className="text-center">
              <p className="text-2xl font-black text-[#1a6ec5] leading-none">
                {presidential.candidates[0].ev || '—'}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-[#1a6ec5] font-bold">
                {presidential.candidates[0].name}
              </p>
            </div>
            <div className="flex-1 mx-4 h-2 rounded-full overflow-hidden bg-gray-200 flex">
              <div
                className="bg-[#1a6ec5] h-full"
                style={{ width: `${((presidential.candidates[0].ev || 0) / 538) * 100}%` }}
              />
              <div
                className="bg-[#b40001] h-full"
                style={{ width: `${((presidential.candidates[1].ev || 0) / 538) * 100}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-[#b40001] leading-none">
                {presidential.candidates[1].ev || '—'}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-[#b40001] font-bold">
                {presidential.candidates[1].name}
              </p>
            </div>
          </div>
        </div>
      )}

      <ul className="space-y-1">
        {races.map((r, i) => {
          const [a, b] = r.candidates;
          const total = a.pct + b.pct || 100;
          return (
            <li key={i}>
              <div className="ew-race">
                <div className="font-bold">
                  {r.office}
                  {r.state && <span className="font-normal text-wp-gray"> · {r.state}</span>}
                  {r.called && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-wider bg-wp-black text-white px-1.5 py-0.5 rounded-sm">
                      {partyLabel(r.called)} wins
                    </span>
                  )}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-wp-gray text-right">
                  {r.pctIn}% in
                </div>
                <div />
                {/* Row A */}
                <div className="flex items-center gap-2">
                  <span className={'w-2 h-2 rounded-full ' + (a.party === 'dem' ? 'bg-[#1a6ec5]' : 'bg-[#b40001]')} aria-hidden="true" />
                  <span className="font-sans text-sm">{a.name}</span>
                </div>
                <div className={'ew-pct ' + a.party}>{a.pct.toFixed(1)}%</div>
                <div className="ew-pct" />
                <div className="ew-bar" style={{ gridColumn: '1 / -1' }}>
                  <div className={a.party} style={{ width: `${(a.pct / total) * 100}%` }} />
                  <div className={b.party} style={{ width: `${(b.pct / total) * 100}%` }} />
                </div>
                {/* Row B */}
                <div className="flex items-center gap-2 -mt-1">
                  <span className={'w-2 h-2 rounded-full ' + (b.party === 'dem' ? 'bg-[#1a6ec5]' : 'bg-[#b40001]')} aria-hidden="true" />
                  <span className="font-sans text-sm">{b.name}</span>
                </div>
                <div className={'ew-pct ' + b.party}>{b.pct.toFixed(1)}%</div>
                <div className="ew-pct" />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
