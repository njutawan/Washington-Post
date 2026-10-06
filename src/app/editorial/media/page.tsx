import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { getMedia } from '@/lib/editorialStore';

export const dynamic = 'force-dynamic';

export default async function MediaLibrary() {
  await getEditorialUser();
  const items = getMedia();
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4 pb-3 border-b-2 border-wp-black">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Media library</h1>
        <button className="bg-wp-red text-white px-4 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-black">+ Upload</button>
      </div>
      <p className="text-sm text-wp-gray font-sans mb-4">Wire photos, staff photography, video b-roll and graphics. In production this would integrate with the Photo desk&rsquo;s DAM (Woodwing/AP/Lake). For this demo, we surface recently used Unsplash assets.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=600&q=80',
          'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=600&q=80',
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80',
          'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&q=80',
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80',
          'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
          'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80',
          'https://images.unsplash.com/photo-1545479834-2e1b31e6f107?w=600&q=80',
          'https://images.unsplash.com/photo-1598387947332-c3220f06e4f8?w=600&q=80',
          'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80',
        ].map((src, i) => (
          <div key={i} className="relative aspect-square bg-wp-light overflow-hidden group border border-wp-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="w-full h-full object-cover group-hover:opacity-90 transition" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-[10px] p-1.5 font-mono opacity-0 group-hover:opacity-100 transition">
              photo_{i+1}.jpg · 600×600
            </div>
          </div>
        ))}
        {items.map((m) => (
          <div key={m.id} className="relative aspect-square bg-wp-light overflow-hidden group border border-wp-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
