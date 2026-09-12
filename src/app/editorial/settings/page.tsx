import { getEditorialUser } from '@/lib/getEditorialUser';

export const dynamic = 'force-dynamic';

export default async function EditorialSettings() {
  await getEditorialUser('admin');
  return (
    <div>
      <div className="mb-4 pb-3 border-b-2 border-wp-black">
        <h1 className="masthead-title text-2xl md:text-3xl leading-none">Newsroom settings</h1>
        <p className="text-sm text-wp-gray font-sans mt-1">Managing-editor configuration. Changes affect the live site.</p>
      </div>

      <div className="grid gap-5 max-w-3xl">
        <section className="bg-white border border-wp-border p-5">
          <h2 className="headline text-lg mb-3">Paywall &amp; meter</h2>
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 text-sm">
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Free articles / mo</label>
            <input type="number" defaultValue={3} className="px-2 py-1 border border-wp-border w-24 font-mono" />
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Hard paywall</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> <span>Lock content entirely for non-subscribers</span></label>
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Incognito detection</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> <span>Count private-window reads</span></label>
          </div>
        </section>

        <section className="bg-white border border-wp-border p-5">
          <h2 className="headline text-lg mb-3">Breaking news banner</h2>
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 text-sm">
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Default behavior</label>
            <select className="border border-wp-border px-2 py-1 bg-white"><option>Dismissible per story</option><option>Site-wide until cleared</option></select>
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Push notifications</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> <span>Send web push on breaking</span></label>
          </div>
        </section>

        <section className="bg-white border border-wp-border p-5">
          <h2 className="headline text-lg mb-3">Comments &amp; community</h2>
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 text-sm">
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Moderation</label>
            <select className="border border-wp-border px-2 py-1 bg-white"><option>Pre-moderation (default)</option><option>Post-moderation</option><option>Disabled</option></select>
            <label className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold">Auto-flag threshold</label>
            <input type="number" defaultValue={3} className="px-2 py-1 border border-wp-border w-24 font-mono" />
          </div>
        </section>

        <section className="bg-white border border-wp-border p-5">
          <h2 className="headline text-lg mb-3">Integrations</h2>
          <div className="grid grid-cols-[200px_minmax(0,1fr)] gap-3 text-sm font-mono">
            <div className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold font-sans">Resend API</div>
            <code className="text-xs text-wp-gray p-2 bg-wp-cream border border-wp-border">RESEND_API_KEY={process.env.RESEND_API_KEY ? '•••••••• (set)' : '(not set — using stub outbox)'}</code>
            <div className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold font-sans">Clerk</div>
            <code className="text-xs text-wp-gray p-2 bg-wp-cream border border-wp-border">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '•••••••• (set)' : '(not set)'}</code>
            <div className="pt-1 text-[11px] uppercase tracking-widest text-wp-gray font-bold font-sans">Sanity CMS</div>
            <code className="text-xs text-wp-gray p-2 bg-wp-cream border border-wp-border">NEXT_PUBLIC_SANITY_PROJECT_ID={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '(not set — local MDX active)'}</code>
          </div>
        </section>

        <div className="flex items-center justify-end gap-3">
          <button className="bg-wp-black text-white px-5 py-2 font-bold uppercase text-xs tracking-wider hover:bg-wp-red">Save settings</button>
        </div>
      </div>
    </div>
  );
}
