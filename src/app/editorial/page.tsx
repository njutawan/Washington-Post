import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getStories, getComments, getAssignments, getAlerts } from '@/lib/editorialStore';
import { ROLE_HIERARCHY } from '@/lib/editorialAuth';

export const dynamic = 'force-dynamic';

function Stat({ label, value, href, accent }: { label: string; value: string | number; href?: string; accent?: string }) {
  const body = (
    <div className="bg-white border border-wp-border p-4 flex items-baseline justify-between hover:border-wp-black transition">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold">{label}</div>
        <div className="text-3xl font-display font-black mt-1 tabular-nums">{value}</div>
      </div>
      {accent && <span className={`w-2 h-2 rounded-full ${accent}`} aria-hidden="true" />}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idea: { label: 'Idea', color: 'bg-gray-200 text-gray-800' },
  pitched: { label: 'Pitched', color: 'bg-blue-100 text-blue-900' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-900' },
  drafting: { label: 'Drafting', color: 'bg-yellow-100 text-yellow-900' },
  editing: { label: 'In edit', color: 'bg-orange-100 text-orange-900' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-900' },
  published: { label: 'Published', color: 'bg-wp-black text-white' },
  killed: { label: 'Spiked', color: 'bg-red-100 text-red-900' },
};

const PRIORITY_DOT: Record<string, string> = {
  breaking: 'bg-wp-red',
  urgent: 'bg-orange-500',
  routine: 'bg-gray-300',
};

export default async function EditorialDashboard() {
  const user = await getEditorialUser();
  const stories = getStories();
  const pendingComments = getComments({ status: 'pending' });
  const flaggedComments = getComments({ flagged: true });
  const openAssignments = getAssignments('open');
  const liveAlerts = getAlerts().filter((a) => a.live);

  // Kanban columns
  const columns: Array<{ key: keyof typeof STATUS_LABELS; label: string }> = [
    { key: 'pitched', label: 'Pitched' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'drafting', label: 'Drafting' },
    { key: 'editing', label: 'In edit' },
    { key: 'ready', label: 'Ready' },
  ];

  const myStories = ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY.editor
    ? stories
    : stories.filter((s) => s.authorId === user.id || !s.authorId);

  return (
    <div>
      {/* Greeting */}
      <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-wp-border">
        <div>
          <div className="kicker text-wp-red text-xs uppercase tracking-[0.2em] font-bold mb-1">Good shift</div>
          <h1 className="masthead-title text-3xl md:text-4xl leading-none">{user.name.split(' ')[0]}&rsquo;s desk</h1>
          <p className="text-sm text-wp-gray font-sans mt-1">
            {user.title || user.roleLabel}
            {user.department ? ` · ${user.department}` : ''}
            {' · '}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="hidden md:flex gap-2">
          <Link href="/editorial/stories/new" className="bg-wp-red text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-black transition">+ New story</Link>
          <Link href="/editorial/alerts" className="border border-wp-black px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition">Breaking alert</Link>
        </div>
      </div>

      {/* Live alerts ribbon */}
      {liveAlerts.length > 0 && (
        <div className="bg-wp-red text-white px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-[0.25em] font-bold">Live now</span>
            <span className="text-sm font-bold">{liveAlerts[0]!.headline}</span>
          </div>
          <Link href="/editorial/alerts" className="text-xs underline">Manage →</Link>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Stat label="Stories in play" value={stories.filter((s) => !['published','killed'].includes(s.status)).length} href="/editorial/stories" accent="bg-wp-red" />
        <Stat label="Ready to publish" value={stories.filter((s) => s.status === 'ready').length} href="/editorial/stories?status=ready" accent="bg-green-500" />
        <Stat label="Pending comments" value={pendingComments.length} href="/editorial/comments" accent={pendingComments.length > 5 ? 'bg-wp-red' : 'bg-gray-400'} />
        <Stat label="Open assignments" value={openAssignments.length} href="/editorial/assignments" accent="bg-orange-500" />
      </div>

      {/* Kanban board */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="headline text-xl md:text-2xl">Desk board</h2>
          <Link href="/editorial/stories" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline">All stories →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {columns.map((col) => {
            const list = myStories.filter((s) => s.status === col.key);
            return (
              <div key={col.key} className="bg-white/70 border border-wp-border">
                <div className="flex items-baseline justify-between px-2 py-1.5 border-b border-wp-border bg-wp-cream">
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 ${STATUS_LABELS[col.key]?.color}`}>{col.label}</span>
                  <span className="text-[11px] text-wp-gray tabular-nums">{list.length}</span>
                </div>
                <ul className="p-2 space-y-1.5 min-h-[80px]">
                  {list.slice(0, 5).map((s) => (
                    <li key={s.id}>
                      <Link href={`/editorial/stories/${s.id}`} className="block px-2 py-1.5 bg-white border border-transparent hover:border-wp-red hover:shadow-sm transition">
                        <div className="flex items-start gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[s.priority]}`} aria-hidden="true" />
                          <div>
                            <div className="text-[11px] text-wp-gray uppercase tracking-wider mb-0.5">{s.category}</div>
                            <div className="text-sm font-serif leading-snug line-clamp-3">{s.title}</div>
                            <div className="text-[10px] text-wp-gray mt-1">{s.authorName || 'Unassigned'} · {s.wordCount}w</div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                  {list.length === 0 && <li className="text-[11px] text-wp-gray italic px-2 py-2">Nothing here.</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Two-column: recent moderation + open assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex items-baseline justify-between mb-3 border-b border-wp-border pb-2">
            <h2 className="headline text-lg md:text-xl">Moderation queue</h2>
            <Link href="/editorial/comments" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline">Review →</Link>
          </div>
          <ul className="bg-white border border-wp-border">
            {pendingComments.slice(0, 5).map((c) => (
              <li key={c.id} className="p-3 border-b border-wp-border last:border-0">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-wp-gray mb-1">
                  {c.flagged && <span className="bg-wp-red text-white px-1.5 py-0.5 text-[9px] font-bold">FLAGGED</span>}
                  <span className="font-bold text-wp-black">{c.authorName}</span>
                  <span>on</span>
                  <Link href={`/article/${c.storySlug}`} className="text-wp-link hover:underline">{c.storyTitle}</Link>
                </div>
                <p className="text-sm font-serif leading-snug text-wp-ink line-clamp-2">{c.body}</p>
              </li>
            ))}
            {pendingComments.length === 0 && <li className="p-6 text-sm italic text-wp-gray text-center">No comments pending review.</li>}
          </ul>
          {flaggedComments.length > 0 && (
            <p className="mt-2 text-xs text-wp-red font-sans font-bold">
              {flaggedComments.length} flagged comment{flaggedComments.length > 1 ? 's' : ''} require attention.
            </p>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3 border-b border-wp-border pb-2">
            <h2 className="headline text-lg md:text-xl">Open assignments</h2>
            <Link href="/editorial/assignments" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline">Desk →</Link>
          </div>
          <ul className="bg-white border border-wp-border divide-y divide-wp-border">
            {openAssignments.slice(0, 5).map((a) => (
              <li key={a.id} className="p-3 flex items-start gap-3">
                <div className="w-9 h-9 bg-wp-black text-white flex items-center justify-center text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
                  {a.beat.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-wp-red uppercase tracking-wider font-bold">{a.beat} desk</div>
                  <div className="text-sm font-serif leading-snug">{a.summary}</div>
                  <div className="text-[11px] text-wp-gray mt-1">Filed by {a.createdBy}</div>
                </div>
              </li>
            ))}
            {openAssignments.length === 0 && <li className="p-6 text-sm italic text-wp-gray text-center">No open assignments.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
