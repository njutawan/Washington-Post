'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';

export default function OfflinePage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="flex-1 max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="kicker text-wp-red mb-4">No connection</div>
        <h1 className="headline text-4xl md:text-6xl mb-6">You appear to be offline.</h1>
        <p className="dek text-lg mb-8 max-w-xl mx-auto">
          We couldn&rsquo;t reach The Washington Post. Check your internet connection and try
          again, or return to a story you&rsquo;ve recently visited.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-wp-black text-white px-6 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition"
          >
            Go back
          </button>
          <Link
            href="/"
            className="border-2 border-wp-black px-6 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-black hover:text-white transition"
          >
            Homepage
          </Link>
        </div>
        <p className="text-xs font-sans text-wp-gray mt-10">
          Tip: articles you&rsquo;ve already opened are available to read offline.
        </p>
      </main>
      <Footer />
    </div>
  );
}
