import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { columnists } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  await getEditorialUser('admin');
  // Build a simulated roster from columnists + a few news-side staff
  const news = [
    { name: 'Matea Gold', title: 'National political investigations editor', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80' },
    { name: 'Krissah Thompson', title: 'Managing editor for diversity and standards', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80' },
    { name: 'Steven Ginsberg', title: 'Senior managing editor', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80' },
    { name: 'Cathy Merida', title: 'Investigations editor', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80' },
  ];
  const people = [...news, ...columnists.map(c => ({ name: c.name, title: c.title, avatar: c.avatar }))];

  return (
    <div>
      <div className="mb-4 pb-3 border-b-2 border-wp-black flex items-baseline justify-between">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Staff &amp; beats</h1>
        <button className="bg-wp-red text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-black">+ Invite staff</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {people.map((p) => (
          <div key={p.name} className="bg-white border border-wp-border p-4 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.avatar} alt="" className="w-20 h-20 rounded-full mx-auto mb-2 object-cover border-2 border-wp-black" />
            <div className="font-bold text-sm font-serif">{p.name}</div>
            <div className="text-[11px] text-wp-gray uppercase tracking-wider mt-0.5 font-sans">{p.title}</div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <select className="text-[10px] border border-wp-border bg-white px-1">
                <option>Author</option>
                <option>Editor</option>
                <option selected={p.title?.toLowerCase().includes('editor') || p.title?.toLowerCase().includes('managing')}>Admin</option>
                <option>Reader</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-wp-gray font-sans mt-6 leading-relaxed">
        Roles and permissions are provisioned via Clerk Organizations / public metadata in production.
        For sandbox review, use <code className="font-mono">NEXT_PUBLIC_DEMO_EDITOR_ROLE=admin</code> (or <code>editor</code>/<code>author</code>) to impersonate roles without Clerk.
      </p>
    </div>
  );
}
