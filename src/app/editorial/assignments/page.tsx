import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getAssignments } from '@/lib/editorialStore';
import { fileAssignment, claim } from './actions';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const user = await getEditorialUser();
  const open = getAssignments('open');
  const claimed = getAssignments('claimed');
  const BEATS = ['White House','Congress','Politics','Business','Markets','Tech','World','Sports','Style','Food','Climate','Investigations','Well+Being','Opinions','Photo','Video'];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b-2 border-wp-black">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Desk assignments</h1>
      </div>

      <form action={fileAssignment} className="bg-white border border-wp-border p-5 mb-6 grid md:grid-cols-[180px_minmax(0,1fr)_160px_auto] gap-3 items-end">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-wp-gray font-bold mb-1">Beat</label>
          <select name="beat" className="w-full px-2 py-2 border border-wp-border bg-white text-sm">
            {BEATS.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-wp-gray font-bold mb-1">Assignment / ask</label>
          <input name="summary" required className="w-full px-2 py-2 border border-wp-border text-sm" placeholder="Need a 600-worder on today's Fed decision by 4pm ET…" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-wp-gray font-bold mb-1">Due (ET)</label>
          <input name="dueDate" type="datetime-local" className="w-full px-2 py-2 border border-wp-border text-sm font-mono" />
        </div>
        <button className="bg-wp-black text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-red">File</button>
      </form>

      <div className="grid md:grid-cols-2 gap-6">
        <section>
          <h2 className="kicker text-wp-red text-xs uppercase tracking-[0.2em] font-bold mb-2">Open ({open.length})</h2>
          <ul className="bg-white border border-wp-border divide-y divide-wp-border">
            {open.map((a) => (
              <li key={a.id} className="p-3 flex items-start gap-3">
                <div className="w-9 h-9 bg-wp-black text-white flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0">
                  {a.beat.split(' ').map((w)=>w[0]).slice(0,2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-wp-red uppercase tracking-widest font-bold">{a.beat} desk</div>
                  <div className="text-sm font-serif leading-snug mb-1">{a.summary}</div>
                  <div className="flex items-center justify-between text-[11px] text-wp-gray">
                    <span>From {a.createdBy}{a.dueDate ? ` · Due ${new Date(a.dueDate).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}` : ''}</span>
                    <form action={claim}><input type="hidden" name="id" value={a.id} /><button className="text-wp-link hover:underline text-[11px] font-bold uppercase tracking-wider">Claim</button></form>
                  </div>
                </div>
              </li>
            ))}
            {open.length === 0 && <li className="p-6 text-sm italic text-wp-gray text-center">No open assignments.</li>}
          </ul>
        </section>
        <section>
          <h2 className="kicker text-wp-red text-xs uppercase tracking-[0.2em] font-bold mb-2">Claimed ({claimed.length})</h2>
          <ul className="bg-white border border-wp-border divide-y divide-wp-border">
            {claimed.map((a) => (
              <li key={a.id} className="p-3 flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-400 text-white flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0">
                  {a.beat.split(' ').map((w)=>w[0]).slice(0,2).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-wp-gray uppercase tracking-widest font-bold">{a.beat}</div>
                  <div className="text-sm font-serif leading-snug">{a.summary}</div>
                  <div className="text-[11px] text-wp-gray mt-1">Claimed by <span className="font-bold text-wp-black">{a.reporterName || 'Unassigned'}</span></div>
                </div>
              </li>
            ))}
            {claimed.length === 0 && <li className="p-6 text-sm italic text-wp-gray text-center">Nothing claimed yet.</li>}
          </ul>
        </section>
      </div>

      <p className="text-xs text-wp-gray font-sans mt-4">Signed in as {user.name}. Assignments from editors appear on this page for the entire newsroom.</p>
    </div>
  );
}
