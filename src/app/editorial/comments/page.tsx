import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getComments } from '@/lib/editorialStore';
import { moderate } from './actions';

export const dynamic = 'force-dynamic';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
] as const;

export default async function ModerationPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await getEditorialUser('editor');
  const sp = await searchParams;
  const tab = (sp.tab || 'pending') as 'pending'|'flagged'|'approved'|'rejected';
  const comments = tab === 'flagged' ? getComments({ flagged: true }) : getComments({ status: tab });

  return (
    <div>
      <div className="mb-4 pb-3 border-b-2 border-wp-black flex items-baseline justify-between">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Comment moderation</h1>
        <span className="text-xs text-wp-gray font-sans">Community guidelines enforced</span>
      </div>
      <div className="flex items-center gap-3 border-b border-wp-border mb-4">
        {TABS.map((t) => (
          <Link key={t.key} href={`/editorial/comments${t.key === 'pending' ? '' : `?tab=${t.key}`}`}
            className={'px-3 py-2 text-xs uppercase tracking-wider font-bold ' + (tab === t.key ? 'border-b-2 border-wp-red text-wp-red' : 'text-wp-gray hover:text-wp-black')}>
            {t.label} ({tab === t.key ? comments.length : 0})
          </Link>
        ))}
      </div>

      <ul className="bg-white border border-wp-border divide-y divide-wp-border">
        {comments.map((c) => (
          <li key={c.id} className="p-4 flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-wp-gray mb-1">
                {c.flagged && <span className="bg-wp-red text-white px-1.5 py-0.5 text-[9px] font-bold">FLAGGED · {c.reports}</span>}
                <span className="font-bold text-wp-black">{c.authorName}</span>
                <span>·</span>
                <Link href={`/article/${c.storySlug}`} className="text-wp-link hover:underline truncate">{c.storyTitle}</Link>
                <span className="ml-auto text-[10px]">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="font-serif text-base leading-relaxed text-wp-ink">{c.body}</p>
            </div>
            <form action={moderate} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={c.id} />
              <button name="status" value="approved" className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold border border-wp-green text-wp-green hover:bg-wp-green hover:text-white">Approve</button>
              <button name="status" value="rejected" className="px-3 py-1 text-[10px] uppercase tracking-widest font-bold border border-wp-red text-wp-red hover:bg-wp-red hover:text-white">Reject</button>
              {c.status !== 'pending' && <input type="hidden" name="status" value="pending" />}
            </form>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="p-12 text-center text-sm italic text-wp-gray">No comments in this queue.</li>
        )}
      </ul>
    </div>
  );
}
