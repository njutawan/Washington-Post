import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { create } from './actions';

export const dynamic = 'force-dynamic';

const DESKS = [
  ['Politics', 'politics'], ['World', 'world'], ['Business', 'business'], ['Tech', 'tech'],
  ['Sports', 'sports'], ['Style', 'style'], ['Food', 'food'], ['Travel', 'travel'],
  ['Well+Being', 'wellbeing'], ['Opinions', 'opinions'], ['Investigations', 'investigations'],
  ['Local', 'local'], ['Climate', 'climate'],
];

// Wrap action to match Server Action signature (void return)
async function submit(fd: FormData) {
  const res = await create(fd);
  if (res?.error) redirect(`/editorial/stories/new?error=${encodeURIComponent(res.error)}`);
}

export default async function NewStory() {
  await getEditorialUser();
  return (
    <div className="max-w-3xl">
      <div className="text-xs text-wp-gray mb-2 flex items-center gap-2 font-sans">
        <Link href="/editorial/stories" className="hover:text-wp-link">Stories</Link>
        <span>›</span>
        <span>New story</span>
      </div>
      <h1 className="masthead-title text-3xl md:text-4xl leading-none mb-6">File a new story</h1>

      <form action={submit} className="bg-white border border-wp-border p-6 space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Kicker (optional)</label>
          <input name="kicker" className="w-full px-3 py-2 border border-wp-border text-sm font-sans focus:outline-none focus:border-wp-black" placeholder="Politics · Investigation · Analysis…" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Headline</label>
          <input name="title" required autoFocus className="w-full px-3 py-3 border-b-2 border-wp-black headline text-xl md:text-2xl font-display font-black leading-tight focus:outline-none focus:border-wp-red" placeholder="Write the working headline…" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Dek (optional)</label>
          <textarea name="dek" rows={2} className="w-full px-3 py-2 border border-wp-border font-serif italic focus:outline-none focus:border-wp-black" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Desk</label>
            <select name="category" defaultValue="Politics" className="w-full px-2 py-2 border border-wp-border bg-white text-sm focus:outline-none focus:border-wp-black">
              {DESKS.map(([label, slug]) => <option key={slug} value={label}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Category slug</label>
            <input name="categorySlug" defaultValue="politics" className="w-full px-2 py-2 border border-wp-border font-mono text-sm focus:outline-none focus:border-wp-black" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-wp-gray font-bold mb-1">Priority</label>
            <select name="priority" defaultValue="routine" className="w-full px-2 py-2 border border-wp-border bg-white text-sm focus:outline-none focus:border-wp-black">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="breaking">Breaking</option>
            </select>
          </div>
        </div>
        <div className="pt-4 border-t border-wp-border flex items-center gap-3">
          <button className="bg-wp-red text-white px-5 py-2.5 font-bold uppercase text-xs tracking-wider hover:bg-wp-black transition">Create & open editor</button>
          <Link href="/editorial/stories" className="text-xs uppercase tracking-wider text-wp-gray hover:text-wp-black">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
