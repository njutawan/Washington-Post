import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="flex-1 max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mb-8">
          <div className="kicker text-wp-red mb-4">Error 404</div>
          <h1 className="masthead-title text-7xl md:text-9xl text-wp-black mb-4">404</h1>
          <div className="w-24 h-0.5 bg-wp-black mx-auto mb-8" />
        </div>
        <h2 className="headline text-2xl md:text-3xl mb-4">
          This story could not be found.
        </h2>
        <p className="dek text-lg mb-8 max-w-xl mx-auto">
          The page you are looking for may have been moved, renamed, or never existed. Perhaps one
          of today&rsquo;s top stories will lead you back to what matters.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 mb-12">
          <Link
            href="/"
            className="bg-wp-black text-white px-6 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-red transition"
          >
            Return to the homepage
          </Link>
          <Link
            href="/politics"
            className="border-2 border-wp-black px-6 py-3 font-sans font-bold uppercase text-sm tracking-wider hover:bg-wp-black hover:text-white transition"
          >
            Browse Politics
          </Link>
        </div>
        <div className="text-left border-t-4 border-wp-black pt-8 max-w-2xl mx-auto">
          <p className="kicker text-wp-black mb-4 text-sm">In today&rsquo;s paper</p>
          <ul className="space-y-3">
            {[
              { href: '/politics', label: 'Politics' },
              { href: '/world', label: 'World' },
              { href: '/business', label: 'Business & Tech' },
              { href: '/sports', label: 'Sports' },
              { href: '/style', label: 'Style & Arts' },
              { href: '/opinions', label: 'Opinions' },
              { href: '/games', label: 'Games' },
            ].map((s) => (
              <li key={s.href} className="border-b border-wp-border pb-3">
                <Link href={s.href} className="headline text-lg hover:text-wp-link">
                  Go to {s.label} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
