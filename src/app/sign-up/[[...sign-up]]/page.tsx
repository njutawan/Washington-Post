import type { Metadata } from 'next';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';

/**
 * Clerk's sign-up route. The repo's .env.example already advertises
 * NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup; this file provides the matching
 * /sign-up catch-all that Clerk's own components route through, and the env
 * value is updated to point here.
 *
 * Renders a pointer at the legacy form when Clerk isn't configured, rather
 * than throwing.
 */
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const metadata: Metadata = {
  title: 'Create an account | The Washington Post',
  robots: { index: false, follow: false },
};

export default function SignUpRoute() {
  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="wp-container py-10 md:py-16 flex-1 flex flex-col items-center">
        {CLERK_ENABLED ? (
          <SignUp fallbackRedirectUrl="/" signInUrl="/sign-in" />
        ) : (
          <div className="w-full max-w-md bg-white border-2 border-wp-black p-8 text-center">
            <p className="kicker text-wp-red mb-1">Not configured</p>
            <h1 className="headline text-2xl mb-3">Clerk sign-up is not enabled</h1>
            <p className="dek text-sm mb-6">
              Add your Clerk keys to <code className="font-mono text-xs">.env.local</code> to enable
              self-serve sign-up, or create an account through the demo form.
            </p>
            <Link
              href="/signin"
              className="inline-block bg-wp-black text-white px-5 py-3 font-sans font-bold uppercase tracking-wider text-xs hover:bg-wp-red transition"
            >
              Use demo sign-up
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
