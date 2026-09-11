'use client';

/**
 * Fixed bottom navigation bar for mobile (<768px).
 *
 * Five always-visible entries mirror the tab bar pattern used by the NYTimes,
 * CNN, and WaPo native apps: Home / Sections / Search / Saved / Subscribe.
 * Hidden on md+ where the primary/secondary nav is fully visible.
 *
 * - Highlights the current route via usePathname()
 * - Positions itself ABOVE the podcast mini-player when audio is active
 *   (body.podcast-playing is toggled from the PodcastProvider).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, SectionsIcon, SearchIcon, BookmarkIcon, EnvelopeIcon } from './Icons';

const TABS = [
  { href: '/',            label: 'Home',      Icon: HomeIcon,     match: 'exact' as const },
  { href: '/politics',    label: 'Sections',  Icon: SectionsIcon, match: 'prefix' as const },
  { href: '/search',      label: 'Search',    Icon: SearchIcon,   match: 'exact' as const },
  { href: '/bookmarks',   label: 'Saved',     Icon: BookmarkIcon, match: 'prefix' as const },
  { href: '/subscribe',   label: 'Subscribe', Icon: EnvelopeIcon, match: 'prefix' as const },
];

export default function BottomNav() {
  const pathname = usePathname() || '/';

  function isActive(href: string, mode: 'exact' | 'prefix') {
    if (mode === 'exact') return pathname === href;
    // For Sections we also want /politics, /world, /business, /us-news etc
    // but NOT /article, /author, /live, /video (article content pages).
    if (href === '/politics') {
      // Treat top-level section routes and their subsections as "Sections".
      // Static/utility routes like /signin, /account, /games etc return false.
      const sectionSlugs = [
        'politics','opinions','us-news','style','investigations','wellbeing',
        'business','tech','world','local','sports','wp-intelligence','ripple',
        'games','newsletters','climate','food','travel','obituaries',
        'whitehouse','congress','courts','policy','elections',
        'markets','economy','technology','personal-finance','ai','social-media',
        'gadgets','cybersecurity','europe','asia','middle-east','americas','africa',
        'movies','music','television','books','art-design',
        'commanders','wizards','capitals','nationals','nfl','mlb',
        'health','science','fitness','food-well','mindfulness',
        'weather','energy','environment','recipes','restaurants','drinks',
        'destinations','travel-tips','deals','editorials','columns','letters',
        'guest-opinions','dc','maryland','virginia','traffic','advice',
      ];
      const seg = pathname.replace(/^\//, '').split('/')[0];
      return sectionSlugs.includes(seg);
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav className="mobile-bottom-nav" role="navigation" aria-label="Primary">
      {TABS.map(({ href, label, Icon, match }) => {
        const active = isActive(href, match);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            data-active={active ? 'true' : 'false'}
            className="tap-target"
          >
            <Icon className="w-[22px] h-[22px]" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
