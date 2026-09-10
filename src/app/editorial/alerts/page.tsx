import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getAlerts } from '@/lib/editorialStore';
import { postAlert, toggleAlert, removeAlert } from './actions';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  await getEditorialUser('editor');
  const alerts = getAlerts();

  return (
    <div>
      <div className="mb-4 pb-3 border-b-2 border-wp-black">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Breaking news alerts</h1>
        <p className="text-sm text-wp-gray font-sans mt-1">Push a red banner across the site. Use sparingly.</p>
      </div>

      <form action={postAlert} className="bg-white border border-wp-border p-5 mb-6 space-y-3">
        <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 items-center">
          <label className="text-[10px] uppercase tracking-widest text-wp-gray font-bold">Type</label>
          <select name="kind" className="px-2 py-1.5 border border-wp-border bg-white text-sm w-48">
            <option value="breaking">Breaking news (red)</option>
            <option value="correction">Correction</option>
            <option value="note">Editor&rsquo;s note</option>
          </select>
          <label className="text-[10px] uppercase tracking-widest text-wp-gray font-bold">Headline</label>
          <input name="headline" required className="px-3 py-2 border border-wp-border text-lg font-serif focus:outline-none focus:border-wp-black" placeholder="BREAKING: …" />
          <label className="text-[10px] uppercase tracking-widest text-wp-gray font-bold">Body</label>
          <textarea name="body" rows={2} className="px-3 py-2 border border-wp-border text-sm focus:outline-none focus:border-wp-black" placeholder="One sentence of context (optional)…" />
        </div>
        <div className="flex items-center justify-end pt-2 border-t border-wp-border">
          <button className="bg-wp-red text-white px-5 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-black transition">Push alert</button>
        </div>
      </form>

      <h2 className="headline text-lg mb-2">Active & recent alerts</h2>
      <ul className="bg-white border border-wp-border divide-y divide-wp-border">
        {alerts.map((a) => (
          <li key={a.id} className="p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest mb-1">
                <span className={`px-1.5 py-0.5 font-bold ${a.kind === 'breaking' ? 'bg-wp-red text-white' : a.kind === 'correction' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}>{a.kind}</span>
                {a.live && <span className="px-1.5 py-0.5 font-bold bg-wp-black text-white">LIVE</span>}
                <span className="text-wp-gray font-sans normal-case tracking-normal">{new Date(a.createdAt).toLocaleString()} · {a.createdBy}</span>
              </div>
              <div className="font-serif text-base leading-snug font-bold">{a.headline}</div>
              {a.body && <p className="text-sm text-wp-ink mt-1">{a.body}</p>}
            </div>
            <form action={toggleAlert} className="flex flex-col gap-1.5">
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="live" value={String(!a.live)} />
              <button className="text-[10px] uppercase tracking-widest px-2 py-1 border border-wp-black hover:bg-wp-black hover:text-white">{a.live ? 'Take down' : 'Reinstate'}</button>
            </form>
            <form action={removeAlert}>
              <input type="hidden" name="id" value={a.id} />
              <button className="text-[10px] uppercase tracking-widest px-2 py-1 text-wp-red hover:underline">Delete</button>
            </form>
          </li>
        ))}
        {alerts.length === 0 && <li className="p-8 text-center italic text-wp-gray">No alerts pushed yet.</li>}
      </ul>
    </div>
  );
}
