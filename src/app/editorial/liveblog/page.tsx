import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';

export const dynamic = 'force-dynamic';

export default async function LiveBlogDesk() {
  await getEditorialUser('editor');
  return (
    <div>
      <div className="mb-4 pb-3 border-b-2 border-wp-black">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Live blog console</h1>
        <p className="text-sm text-wp-gray font-sans mt-1">Push updates to live blogs in real time. Updates appear to readers via server-sent events polling.</p>
      </div>

      <div className="grid md:grid-cols-[300px_minmax(0,1fr)] gap-5">
        <aside className="bg-white border border-wp-border">
          <div className="p-3 border-b border-wp-border text-[10px] uppercase tracking-widest font-bold text-wp-gray">Active live blogs</div>
          <ul>
            {[
              { slug: 'shutdown-countdown', title: 'Government shutdown countdown', status: 'LIVE' },
              { slug: 'shutdown-deal', title: 'Senate Saturday vote', status: 'LIVE' },
            ].map((l) => (
              <li key={l.slug} className="p-3 border-b border-wp-border hover:bg-[#faf7f0]">
                <Link href={`/live/${l.slug}`} className="block">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-wp-red font-bold mb-1">
                    <span className="w-1.5 h-1.5 bg-wp-red rounded-full animate-pulse" />
                    {l.status}
                  </div>
                  <div className="font-serif text-sm leading-snug">{l.title}</div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-3"><button className="w-full border border-wp-black px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-wp-black hover:text-white">+ Start new live blog</button></div>
        </aside>

        <div className="bg-white border border-wp-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 bg-wp-red rounded-full animate-pulse" />
            <h2 className="headline text-xl">Government shutdown countdown</h2>
          </div>
          <p className="text-xs text-wp-gray font-sans mb-4">You are logged in as a live editor. New posts will appear to readers within seconds.</p>

          <div className="border border-wp-border p-3 mb-4">
            <div className="flex gap-2 mb-2">
              <select className="text-xs px-2 py-1 border border-wp-border bg-white">
                <option>Update</option>
                <option>Key moment</option>
                <option>Analysis</option>
                <option>Fact check</option>
              </select>
              <input type="text" placeholder="Title…" className="flex-1 px-2 py-1 text-sm border border-wp-border" />
            </div>
            <textarea rows={4} className="w-full px-2 py-2 text-sm border border-wp-border font-serif" placeholder="Write update in Markdown…" />
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-[11px] font-sans text-wp-gray">
                <input type="checkbox" defaultChecked /> Pin to top
              </label>
              <button className="bg-wp-red text-white px-4 py-1.5 text-[10px] uppercase tracking-widest font-bold hover:bg-wp-black">Post update</button>
            </div>
          </div>

          <ol className="border-t border-wp-border pt-3 space-y-3">
            {[
              { time: '4:32 PM ET', title: 'Senate leaders reach agreement on short-term CR', pinned: true, body: 'Senate Majority Leader and Minority Leader announced a deal that would fund the government through Nov. 15, attached with supplemental disaster aid.' },
              { time: '4:15 PM ET', title: 'White House: President will sign clean CR', body: 'Press secretary tells reporters the President will sign a short-term extension if it reaches his desk before midnight.' },
              { time: '3:58 PM ET', title: 'House adjourns until Saturday', body: 'Lawmakers left the chamber shortly after the vote, setting up a weekend scramble in the Senate.' },
            ].map((u, i) => (
              <li key={i} className="flex gap-3 pb-3 border-b border-wp-border last:border-0">
                <div className="text-[11px] font-mono tabular-nums text-wp-gray w-20 flex-shrink-0 pt-0.5">{u.time}</div>
                <div className="flex-1">
                  {u.pinned && <div className="text-[9px] uppercase tracking-widest text-wp-red font-bold mb-0.5">Pinned</div>}
                  <div className="font-bold font-serif text-sm mb-1">{u.title}</div>
                  <div className="text-sm font-serif leading-snug text-wp-ink">{u.body}</div>
                  <div className="text-[10px] text-wp-gray mt-1 flex gap-2">
                    <button className="hover:underline">Edit</button>
                    <button className="hover:underline">Remove</button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
