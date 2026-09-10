'use client';

import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import MiniCrossword from '@/components/MiniCrossword';

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <main id="main-content" className="wp-container py-6">
        <Breadcrumbs items={[{ label: 'Games', href: '/games' }]} />

        <div className="border-b-4 border-wp-black mb-8 pb-3">
          <p className="kicker text-wp-red mb-1">Games</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h1 className="masthead-title text-4xl md:text-6xl">Games</h1>
            <p className="dek text-base text-wp-gray max-w-md">
              Play The Post&rsquo;s daily puzzles: The Mini, Crossword, Sudoku, and more.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <MiniCrossword />

          <div className="space-y-4">
            <a href="#" className="block border-2 border-wp-black bg-white p-5 hover:bg-wp-light transition group">
              <p className="kicker text-wp-red mb-2">Coming soon</p>
              <h3 className="headline text-2xl mb-1 group-hover:text-wp-link">The Crossword</h3>
              <p className="dek text-sm">The classic Sunday puzzle, daily at 10 p.m. ET.</p>
            </a>
            <a href="#" className="block border-2 border-wp-black bg-white p-5 hover:bg-wp-light transition group">
              <p className="kicker text-wp-red mb-2">Coming soon</p>
              <h3 className="headline text-2xl mb-1 group-hover:text-wp-link">Sudoku</h3>
              <p className="dek text-sm">Three difficulty levels. A new puzzle every day.</p>
            </a>
            <a href="#" className="block border-2 border-wp-black bg-white p-5 hover:bg-wp-light transition group">
              <p className="kicker text-wp-red mb-2">Coming soon</p>
              <h3 className="headline text-2xl mb-1 group-hover:text-wp-link">Word Builder</h3>
              <p className="dek text-sm">Find as many words as you can in two minutes.</p>
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
