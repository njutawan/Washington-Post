import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getStoryById } from '@/lib/editorialStore';
import StatusPill from '@/components/editorial/StatusPill';
import PriorityDot from '@/components/editorial/PriorityDot';
import { saveStory as saveStoryAction, transitionStatus, publish, removeStory } from './actions';

async function saveStory(fd: FormData): Promise<void> {
  const res = await saveStoryAction(null, fd);
  if (res?.error) {
    const id = fd.get('id');
    redirect(`/editorial/stories/${id}?error=${encodeURIComponent(res.error)}`);
  }
}

export const dynamic = 'force-dynamic';

const TRANSITIONS: Record<string, Array<{ to: string; label: string; roles: Array<'author' | 'editor' | 'admin'>; tone?: 'primary' | 'danger' }>> = {
  idea: [{ to: 'pitched', label: 'Pitch to desk', roles: ['author', 'editor', 'admin'] }],
  pitched: [
    { to: 'assigned', label: 'Assign', roles: ['editor', 'admin'] },
    { to: 'drafting', label: 'Start drafting', roles: ['author', 'editor', 'admin'] },
    { to: 'killed', label: 'Spike', roles: ['editor', 'admin'], tone: 'danger' },
  ],
  assigned: [{ to: 'drafting', label: 'Begin writing', roles: ['author', 'editor', 'admin'] }],
  drafting: [
    { to: 'editing', label: 'Send to edit', roles: ['author', 'editor', 'admin'] },
    { to: 'killed', label: 'Spike', roles: ['editor', 'admin'], tone: 'danger' },
  ],
  editing: [
    { to: 'ready', label: 'Mark ready', roles: ['editor', 'admin'] },
    { to: 'drafting', label: 'Send back for revisions', roles: ['editor', 'admin'] },
  ],
  ready: [
    { to: 'editing', label: 'Re-open edit', roles: ['editor', 'admin'] },
    { to: 'published', label: 'Publish now', roles: ['editor', 'admin'], tone: 'primary' },
  ],
  published: [],
  killed: [{ to: 'idea', label: 'Restore to idea', roles: ['admin'] }],
};

export default async function StoryEditor({ params }: { params: Promise<{ id: string }> }) {
  const user = await getEditorialUser();
  const { id } = await params;
  const story = getStoryById(id);
  if (!story) notFound();

  const transitions = (TRANSITIONS[story.status] || []).filter((t) => t.roles.includes(user.role as any));
  const canEdit = user.role === 'admin' || user.role === 'editor' || story.authorId === user.id || !story.authorId;
  const canPublish = user.role === 'editor' || user.role === 'admin';
  const canDelete = user.role === 'admin';
  const isPublished = story.status === 'published';

  return (
    <div>
      <div className="flex items-baseline gap-2 text-xs font-sans text-wp-gray mb-3">
        <Link href="/editorial/stories" className="hover:text-wp-link">Stories</Link>
        <span aria-hidden="true">›</span>
        <span>{story.slug}</span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b-2 border-wp-black">
        <div className="flex items-center gap-3">
          <PriorityDot priority={story.priority} />
          <StatusPill status={story.status} />
          <span className="text-[11px] uppercase tracking-widest text-wp-gray font-sans">
            {story.category} · {story.wordCount} words · updated {new Date(story.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isPublished && (
            <Link href={`/article/${story.slug}`} className="border border-wp-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-wp-black hover:text-white">View live →</Link>
          )}
          {canDelete && (
            <form action={removeStory}>
              <input type="hidden" name="id" value={story.id} />
              <button className="text-xs uppercase tracking-wider text-wp-red hover:underline">Spike</button>
            </form>
          )}
        </div>
      </div>

      <form action={saveStory} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6">
        <input type="hidden" name="id" value={story.id} />

        {/* Center: editor */}
        <div className="space-y-4">
          <fieldset className="space-y-3" disabled={!canEdit || isPublished}>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Kicker</label>
              <input
                name="kicker"
                defaultValue={story.kicker || ''}
                className="w-full px-3 py-2 border border-wp-border bg-white font-sans text-sm focus:outline-none focus:border-wp-black"
                placeholder="Politics · Investigation · Analysis…"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Headline</label>
              <input
                name="title"
                defaultValue={story.title}
                required
                className="w-full px-3 py-3 border-0 border-b-2 border-wp-black bg-transparent headline text-2xl md:text-3xl lg:text-4xl font-display font-black leading-tight focus:outline-none focus:border-wp-red"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Dek / subhead</label>
              <textarea
                name="dek"
                defaultValue={story.dek || ''}
                rows={2}
                className="w-full px-3 py-2 border border-wp-border bg-white font-serif italic text-lg leading-snug focus:outline-none focus:border-wp-black"
                placeholder="A one- or two-sentence summary that will appear under the headline…"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Body (Markdown)</label>
              <textarea
                name="body"
                defaultValue={story.bodyPreview || ''}
                rows={20}
                className="w-full px-4 py-4 border border-wp-border bg-white font-mono text-sm leading-relaxed focus:outline-none focus:border-wp-black whitespace-pre-wrap"
                placeholder="Write your story in Markdown. First paragraph will appear as the lead..."
              />
              <p className="text-[11px] text-wp-gray mt-1 font-sans">Plain text / Markdown. Published stories are written to <code className="font-mono">/content/articles/[slug].mdx</code>.</p>
            </div>
          </fieldset>

          <div className="flex items-center gap-3 pt-3 border-t border-wp-border">
            {canEdit && !isPublished && (
              <button className="bg-wp-black text-white px-5 py-2.5 font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition">
                Save draft
              </button>
            )}
            <Link href="/editorial/stories" className="text-xs uppercase tracking-wider text-wp-gray hover:text-wp-black">Cancel</Link>
          </div>
        </div>

        {/* Right rail: metadata + workflow */}
        <aside aria-label="Story workflow" className="space-y-5">
          <div className="bg-white border border-wp-border p-4">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-3">Workflow</h3>
            <div className="space-y-2">
              {transitions.length === 0 && (
                <p className="text-xs italic text-wp-gray">No further transitions available for your role.</p>
              )}
              {transitions.map((t) => (
                <form key={t.to} action={t.to === 'published' ? publish : transitionStatus} className="block w-full">
                  <input type="hidden" name="id" value={story.id} />
                  <input type="hidden" name="status" value={t.to} />
                  <button
                    className={
                      'w-full px-3 py-2 font-bold uppercase text-xs tracking-wider border transition ' +
                      (t.tone === 'primary'
                        ? 'bg-wp-red text-white border-wp-red hover:bg-wp-black hover:border-wp-black'
                        : t.tone === 'danger'
                        ? 'border-wp-red text-wp-red hover:bg-wp-red hover:text-white'
                        : 'border-wp-black text-wp-black hover:bg-wp-black hover:text-white')
                    }
                  >
                    {t.label}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="bg-white border border-wp-border p-4 space-y-3">
            <h3 className="text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold">Metadata</h3>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-wp-gray mb-1">Slug</label>
              <input name="slug" defaultValue={story.slug} className="w-full px-2 py-1 border border-wp-border text-sm font-mono focus:outline-none focus:border-wp-black" disabled={!canEdit || isPublished} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-wp-gray mb-1">Category</label>
              <input name="category" defaultValue={story.category} className="w-full px-2 py-1 border border-wp-border text-sm focus:outline-none focus:border-wp-black" disabled={!canEdit || isPublished} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-wp-gray mb-1">Category slug</label>
              <input name="categorySlug" defaultValue={story.categorySlug} className="w-full px-2 py-1 border border-wp-border text-sm font-mono focus:outline-none focus:border-wp-black" disabled={!canEdit || isPublished} />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-wp-gray mb-1">Priority</label>
              <select name="priority" defaultValue={story.priority} className="w-full px-2 py-1 border border-wp-border text-sm focus:outline-none focus:border-wp-black bg-white" disabled={!canEdit || isPublished}>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="breaking">Breaking</option>
              </select>
            </div>
            <div className="pt-2 border-t border-wp-border text-[11px] font-sans text-wp-gray space-y-1">
              <div><span className="font-bold text-wp-black">Reporter:</span> {story.authorName || 'Unassigned'}</div>
              <div><span className="font-bold text-wp-black">Editor:</span> {story.editorName || 'Not yet'}</div>
              {story.publishedAt && <div><span className="font-bold text-wp-black">Published:</span> {new Date(story.publishedAt).toLocaleString()}</div>}
            </div>
          </div>

          {isPublished && (
            <div className="border border-wp-black bg-wp-black text-white p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Published</div>
              <p className="text-sm font-serif leading-snug">This story is live. Edits should be made as a publisher-issued correction. Create a new draft for substantial updates.</p>
            </div>
          )}
        </aside>
      </form>
    </div>
  );
}
