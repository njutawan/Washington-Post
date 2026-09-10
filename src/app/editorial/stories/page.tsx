import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getStories } from '@/lib/editorialStore';
import StatusPill from '@/components/editorial/StatusPill';
import PriorityDot from '@/components/editorial/PriorityDot';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'drafting', label: 'Drafting' },
  { key: 'editing', label: 'In edit' },
  { key: 'ready', label: 'Ready' },
  { key: 'published', label: 'Published' },
] as const;

export default async function StoriesPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  await getEditorialUser();
  const sp = await searchParams;
  const status = sp.status || 'all';
  const q = (sp.q || '').toLowerCase().trim();
  let stories = getStories();
  if (status !== 'all') stories = stories.filter((s) => s.status === status);
  if (q) stories = stories.filter((s) => s.title.toLowerCase().includes(q) || s.slug.includes(q) || (s.authorName||'').toLowerCase().includes(q));
  stories.sort((a, b) => (b.priority === 'breaking' ? 1 : 0) - (a.priority === 'breaking' ? 1 : 0) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b-2 border-wp-black">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Stories</h1>
        <Link href="/editorial/stories/new" className="bg-wp-red text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-black transition">+ New story</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center border-b border-wp-border">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/editorial/stories${t.key === 'all' ? '' : `?status=${t.key}`}`}
              className={'px-3 py-1.5 text-xs uppercase tracking-wider font-bold ' + (status === t.key ? 'border-b-2 border-wp-red text-wp-red' : 'text-wp-gray hover:text-wp-black')}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="ml-auto flex items-center gap-2" action="/editorial/stories">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search headlines, slugs, reporters…"
            className="px-2 py-1 text-sm border border-wp-border bg-white w-64 focus:outline-none focus:border-wp-black"
          />
          <button className="text-xs uppercase tracking-wider font-bold text-wp-link hover:text-wp-red">Search</button>
        </form>
      </div>

      <div className="bg-white border border-wp-border">
        <table className="w-full text-sm">
          <thead className="bg-wp-cream text-[10px] uppercase tracking-[0.15em] text-wp-gray">
            <tr>
              <th className="text-left py-2 px-3 w-6" />
              <th className="text-left py-2 px-3">Headline</th>
              <th className="text-left py-2 px-3 hidden md:table-cell">Desk</th>
              <th className="text-left py-2 px-3 hidden md:table-cell">Reporter</th>
              <th className="text-left py-2 px-3 hidden lg:table-cell">Status</th>
              <th className="text-right py-2 px-3 w-16">Words</th>
              <th className="text-left py-2 px-3 hidden lg:table-cell w-36">Updated</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((s) => (
              <tr key={s.id} className="border-t border-wp-border hover:bg-[#faf7f0]">
                <td className="py-2 px-3"><PriorityDot priority={s.priority} /></td>
                <td className="py-2 px-3">
                  <Link href={`/editorial/stories/${s.id}`} className="block">
                    <div className="font-serif leading-snug hover:text-wp-link">
                      {s.kicker && <span className="kicker text-wp-red text-[10px] uppercase tracking-widest mr-2 font-bold">{s.kicker}</span>}
                      {s.title}
                    </div>
                    <div className="text-[11px] text-wp-gray mt-0.5 font-sans">/{s.slug}</div>
                  </Link>
                </td>
                <td className="py-2 px-3 text-xs font-sans hidden md:table-cell text-wp-ink">{s.category}</td>
                <td className="py-2 px-3 text-xs font-sans hidden md:table-cell">{s.authorName || <span className="italic text-wp-gray">unassigned</span>}</td>
                <td className="py-2 px-3 hidden lg:table-cell"><StatusPill status={s.status} /></td>
                <td className="py-2 px-3 text-right font-mono text-xs tabular-nums">{s.wordCount || '—'}</td>
                <td className="py-2 px-3 text-xs font-sans text-wp-gray hidden lg:table-cell">
                  {new Date(s.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </td>
              </tr>
            ))}
            {stories.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center italic text-wp-gray">No stories match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
