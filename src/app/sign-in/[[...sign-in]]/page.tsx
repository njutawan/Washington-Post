import type { Metadata } from 'next';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';

/**
 * Clerk's sign-in route (catch-all so Clerk can drive its own sub-states —
 * password, OTP, SSO handoff — under this one path).
 *
 * Wired up via NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in in .env.example.
 * When Clerk isn't configured the route stays reachable but renders a pointer
 * at the legacy NextAuth form instead of throwing "Missing publishableKey".
 */
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export const metadata: Metadata = {
  title: 'Sign in | The Washington Post',
  robots: { index: false, follow: false },
};

export default function SignInRoute() {
  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="wp-container py-10 md:py-16 flex-1 flex flex-col items-center">
        {CLERK_ENABLED ? (
          <SignIn fallbackRedirectUrl="/" signUpUrl="/sign-up" />
        ) : (
          <div className="w-full max-w-md bg-white border-2 border-wp-black p-8 text-center">
            <p className="kicker text-wp-red mb-1">Not configured</p>
            <h1 className="headline text-2xl mb-3">Clerk sign-in is not enabled</h1>
            <p className="dek text-sm mb-6">
              Set <code className="font-mono text-xs">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and{' '}
              <code className="font-mono text-xs">CLERK_SECRET_KEY</code> in{' '}
              <code className="font-mono text-xs">.env.local</code> to activate Clerk, or use the
              email/password sign-in form.
            </p>
            <Link
              href="/signin"
              className="inline-block bg-wp-black text-white px-5 py-3 font-sans font-bold uppercase tracking-wider text-xs hover:bg-wp-red transition"
            >
              Use email sign-in
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
