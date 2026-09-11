import type { Viewport } from 'next';
import './globals.css';
import './view-transitions.css';
import { ClerkProvider } from '@clerk/nextjs';
import { auth as nextAuth } from '@/auth';
import { PaywallProvider } from '@/lib/usePaywall';
import { siteMetadata, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import PWAInit from '@/components/PWAInit';
import SessionProvider from '@/components/SessionProvider';
import { ReadingProvider } from '@/components/ReadingProvider';
import Analytics from '@/components/Analytics';
import TopLoader from '@/components/TopLoader';
import PageTransitions from '@/components/PageTransitions';
import RouteLoadingBar from '@/components/RouteLoadingBar';
import { PodcastProvider } from '@/components/PodcastProvider';
import PodcastMiniPlayer from '@/components/PodcastMiniPlayer';
import GateInterceptor from '@/components/GateInterceptor';
import Toaster from '@/components/Toaster';
// Font CSS variables (--font-sans / --font-serif / --font-display) are
// declared in :root in globals.css, so we don't need a class here.

export const metadata = siteMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#121212',
};

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const ClerkWrap: React.FC<{ children: React.ReactNode }> = clerkKey
  ? ({ children }) => <ClerkProvider afterSignOutUrl="/">{children}</ClerkProvider>
  : ({ children }) => <>{children}</>;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await nextAuth();
  return (
    <ClerkWrap>
      <html lang="en">
        <head>
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#121212" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="apple-mobile-web-app-title" content="WaPo" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <link rel="preload" as="image" href="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1600&q=80" fetchPriority="high" />
        {/* Apply saved theme before paint to avoid FOUC. Must run synchronously
            in <head>, hence the eslint-disable (Next's no-sync-scripts rule). */}
        <script
          // eslint-disable-next-line @next/next/no-sync-scripts
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('wapo:theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        <link rel="alternate" type="application/rss+xml" title="The Washington Post — RSS Feed" href="/api/feed" />
      </head>
      <body className="antialiased pt-1 pb-16 md:pb-14">
        <SessionProvider session={session}>
          <PaywallProvider>
            <PodcastProvider>
              <ReadingProvider>
                {children}
                <PodcastMiniPlayer />
                <GateInterceptor />
                <Toaster />
              </ReadingProvider>
            </PodcastProvider>
          </PaywallProvider>
        </SessionProvider>
        <TopLoader />
        <RouteLoadingBar />
        <PageTransitions />
        <PWAInit />
        <Analytics />
      </body>
      </html>
    </ClerkWrap>
  );
}
