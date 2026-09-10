'use client';

import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';

/** Per-route error boundary styled with WaPo masthead/footer (unlike global-error which is the bare fallback). */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="kicker text-wp-red mb-4">Something went wrong</p>
        <h1 className="masthead-title text-5xl md:text-7xl mb-6">We hit an error.</h1>
        <div className="w-20 h-0.5 bg-wp-black mx-auto mb-6" />
        <p className="dek text-lg mb-8 max-w-xl mx-auto">
          Our engineers have been notified. You can try reloading this page, or
          head back to the homepage to pick up where you left off.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="bg-wp-black text-white px-6 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition tap-target"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border-2 border-wp-black px-6 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-black hover:text-white transition tap-target"
          >
            Go to homepage
          </Link>
        </div>
        {error.digest && (
          <p className="mt-10 text-xs font-mono text-wp-gray">Error ID: {error.digest}</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
