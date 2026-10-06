import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getStories, getComments } from '@/lib/editorialStore';

export const dynamic = 'force-dynamic';

export default async function NewsroomAnalytics() {
  await getEditorialUser('editor');
  const stories = getStories().filter((s) => s.status === 'published').slice(0, 10);
  const pending = getComments({ status: 'pending' });
  // Build deterministic-ish fake traffic numbers from slug hash
  function num(slug: string) {
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  return (
    <div>
      <div className="mb-4 pb-3 border-b-2 border-wp-black flex items-baseline justify-between">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Newsroom analytics</h1>
        <span className="text-[10px] uppercase tracking-widest text-wp-gray font-sans">Last 24 hours · ET</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ['Total pageviews', '1,284,502', '+12.4%'],
          ['Unique visitors', '428,110', '+5.1%'],
          ['Subscriptions started', '842', '+3.8%'],
          ['Avg engaged time', '3:42', '+0:18'],
        ].map(([l, v, d]) => (
          <div key={l} className="bg-white border border-wp-border p-4">
            <div className="text-[10px] uppercase tracking-widest text-wp-gray font-bold">{l}</div>
            <div className="text-3xl font-display font-black tabular-nums mt-1">{v}</div>
            <div className="text-[11px] text-wp-green font-sans">{d}</div>
          </div>
        ))}
      </div>

      <section className="bg-white border border-wp-border mb-6">
        <div className="p-3 border-b border-wp-border flex items-baseline justify-between">
          <h2 className="headline text-lg">Top stories (24h)</h2>
          <span className="text-[10px] uppercase tracking-widest text-wp-gray font-sans">By pageviews</span>
        </div>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-widest text-wp-gray bg-wp-cream">
            <tr><th className="text-left py-2 px-3 w-10">#</th><th className="text-left py-2 px-3">Headline</th><th className="text-left py-2 px-3 hidden md:table-cell">Desk</th><th className="text-right py-2 px-3">Views</th><th className="text-right py-2 px-3 hidden md:table-cell">Subs conv.</th></tr>
          </thead>
          <tbody>
            {stories.map((s, i) => {
              const views = 120000 - i * 8200 + (num(s.slug) % 7000);
              const conv = (0.8 + (num(s.slug) % 120)/200).toFixed(2);
              return (
                <tr key={s.id} className="border-t border-wp-border hover:bg-[#faf7f0]">
                  <td className="py-2 px-3 font-mono tabular-nums text-wp-gray">{i+1}</td>
                  <td className="py-2 px-3">
                    <Link href={`/article/${s.slug}`} className="font-serif hover:text-wp-link block">{s.title}</Link>
                    <div className="text-[10px] text-wp-gray font-sans">{s.authorName}</div>
                  </td>
                  <td className="py-2 px-3 text-xs hidden md:table-cell">{s.category}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums">{views.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-wp-green hidden md:table-cell">{conv}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white border border-wp-border p-4">
          <h2 className="headline text-lg mb-2">Desk performance</h2>
          <ul className="space-y-2 text-sm font-sans">
            {['Politics','Business','World','Sports','Opinions','Style','Tech','Well+Being'].map((d, i) => {
              const pct = 35 - i*3.2;
              return (
                <li key={d}>
                  <div className="flex justify-between text-xs mb-0.5"><span className="font-bold">{d}</span><span className="tabular-nums text-wp-gray">{pct.toFixed(1)}%</span></div>
                  <div className="h-2 bg-wp-border"><div className="h-full bg-wp-red" style={{ width: `${pct*2.5}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="bg-white border border-wp-border p-4">
          <h2 className="headline text-lg mb-2">Moderation health</h2>
          <ul className="space-y-2 text-sm font-serif">
            <li className="flex justify-between border-b border-wp-border pb-2"><span>Pending comments</span><span className="font-mono font-bold">{pending.length}</span></li>
            <li className="flex justify-between border-b border-wp-border pb-2"><span>Auto-flagged (24h)</span><span className="font-mono font-bold text-wp-red">18</span></li>
            <li className="flex justify-between border-b border-wp-border pb-2"><span>Avg moderator response</span><span className="font-mono font-bold">7m 42s</span></li>
            <li className="flex justify-between"><span>Removed (policy)</span><span className="font-mono font-bold">4</span></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
