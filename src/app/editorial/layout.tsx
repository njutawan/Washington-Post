import Link from 'next/link';
import { getEditorialUser } from '@/lib/getEditorialUser';
import { ROLE_LABEL } from '@/lib/editorialAuth';
import { SignOutButton, UserButton } from '@clerk/nextjs';

const NAV: Array<{ section: string; items: Array<{ href: string; label: string; minRole: 'author' | 'editor' | 'admin' }> }> = [
  {
    section: 'Desk',
    items: [
      { href: '/editorial', label: 'Dashboard', minRole: 'author' },
      { href: '/editorial/stories', label: 'Stories', minRole: 'author' },
      { href: '/editorial/stories/new', label: '+ New story', minRole: 'author' },
      { href: '/editorial/assignments', label: 'Assignments', minRole: 'author' },
    ],
  },
  {
    section: 'Workflow',
    items: [
      { href: '/editorial/comments', label: 'Moderation', minRole: 'editor' },
      { href: '/editorial/liveblog', label: 'Live blog', minRole: 'editor' },
      { href: '/editorial/alerts', label: 'Breaking alerts', minRole: 'editor' },
      { href: '/editorial/media', label: 'Media library', minRole: 'author' },
    ],
  },
  {
    section: 'Desk management',
    items: [
      { href: '/editorial/analytics', label: 'Newsroom analytics', minRole: 'editor' },
      { href: '/editorial/staff', label: 'Staff & beats', minRole: 'admin' },
      { href: '/editorial/settings', label: 'Settings', minRole: 'admin' },
    ],
  },
];

function Clock() {
  // Tiny server-rendered ET timestamp — updates on load; JS keeps ticking in a small client block.
  const now = new Date();
  const et = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric', minute: '2-digit', hour12: true, weekday: 'short', month: 'short', day: 'numeric',
  }).format(now);
  return <span className="font-mono text-xs text-wp-gray">{et} ET</span>;
}

export default async function EditorialLayout({ children }: { children: React.ReactNode }) {
  const user = await getEditorialUser();

  // Filter nav to what this role can see
  const roleOrder: Record<string, number> = { author: 10, editor: 20, admin: 30 };
  const userRank = roleOrder[user.role] || 0;
  const nav = NAV.map((s) => ({
    ...s,
    items: s.items.filter((i) => userRank >= roleOrder[i.minRole]),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-[#1a1a1a] font-sans flex flex-col">
      {/* Top bar — Washington Post newsroom style (no white masthead; black-on-cream with red accents and a "FOR EDITORIAL STAFF" band) */}
      <div className="bg-wp-red text-white">
        <div className="wp-container py-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.25em] font-bold">
          <span>For editorial staff · Internal</span>
          <div className="flex items-center gap-4">
            <Clock />
            <Link href="/" className="hover:underline normal-case tracking-normal font-normal text-[11px]">← View site</Link>
          </div>
        </div>
      </div>
      <header className="bg-wp-cream border-b-4 border-wp-black">
        <div className="wp-container py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <Link href="/editorial" className="flex items-baseline gap-2">
              <span className="kicker text-wp-red text-xs uppercase tracking-[0.3em] font-bold">The Washington Post</span>
              <span className="masthead-title text-2xl md:text-3xl leading-none tracking-tight">Newsroom CMS</span>
            </Link>
            <span className="hidden md:inline-block text-xs font-sans uppercase tracking-widest text-wp-gray border-l border-wp-border pl-4">
              Democracy Dies in Darkness
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-wp-black text-white flex items-center justify-center font-bold text-xs">
                {user.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="leading-tight">
                <div className="font-bold text-sm">{user.name}</div>
                <div className="text-[11px] text-wp-gray uppercase tracking-wider">
                  {user.title || ROLE_LABEL[user.role]}{user.department ? ` · ${user.department}` : ''}
                </div>
              </div>
            </div>
            <form action="/api/auth/signout" method="post" className="text-xs">
              <button type="submit" className="uppercase tracking-wider text-wp-gray hover:text-wp-red">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 wp-container py-6 grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-6">
        {/* Sidebar nav */}
        <aside aria-label="Editorial sidebar" className="md:sticky md:top-2 md:self-start">
          <nav aria-label="Editorial navigation">
            {nav.map((section) => (
              <div key={section.section} className="mb-5">
                <div className="text-[10px] font-sans uppercase tracking-[0.2em] text-wp-gray font-bold mb-2">{section.section}</div>
                <ul className="space-y-0.5">
                  {section.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className="block px-2 py-1.5 text-sm text-wp-ink hover:bg-white hover:text-wp-red border-l-2 border-transparent hover:border-wp-red transition"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="mt-8 p-3 border border-dashed border-wp-border text-[11px] text-wp-gray leading-snug">
              <div className="kicker text-wp-red uppercase tracking-widest font-bold mb-1">Role</div>
              {ROLE_LABEL[user.role]}
              {user.department ? <div className="mt-1">Desk: {user.department}</div> : null}
            </div>
          </nav>
        </aside>

        <main id="main-content" className="min-w-0">
          {children}
        </main>
      </div>

      <footer className="border-t border-wp-border mt-8">
        <div className="wp-container py-4 flex items-center justify-between text-xs font-sans text-wp-gray">
          <span>© {new Date().getFullYear()} The Washington Post · Editorial CMS · For internal use only</span>
          <span>v1.0 · build {process.env.NEXT_PUBLIC_BUILD_ID || 'dev'}</span>
        </div>
      </footer>
    </div>
  );
}
