'use client';

import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import MiniCrossword from '@/components/MiniCrossword';
import SudokuGame from '@/components/SudokuGame';
import TilesGame from '@/components/TilesGame';

const GAMES = [
  { name: 'The Mini', cadence: 'Daily', blurb: 'A quick bite-sized crossword in under a minute.', color: 'bg-wp-red' },
  { name: 'Sudoku', cadence: 'Daily', blurb: 'Classic logic puzzle at three difficulties.', color: 'bg-blue-700' },
  { name: 'Tiles', cadence: 'Anytime', blurb: 'Match pairs in this calming memory game.', color: 'bg-emerald-700' },
  { name: 'On the Record', cadence: 'Weekly', blurb: 'A news trivia quiz from the week\u2019s headlines.', color: 'bg-amber-700' },
];

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
              Play The Post&rsquo;s daily puzzles: The Mini, Sudoku, Tiles, and more.
            </p>
          </div>
        </div>

        {/* Game rail */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {GAMES.map((g) => (
            <a key={g.name} href={`#${g.name.toLowerCase().replace(/\s+/g, '-')}`} className="block bg-white border-2 border-wp-black p-3 hover:border-wp-red transition group">
              <div className={`${g.color} text-white text-[10px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 inline-block mb-2`}>{g.cadence}</div>
              <h2 className="headline text-base font-bold leading-tight group-hover:text-wp-link">{g.name}</h2>
              <p className="byline text-wp-gray text-[11px] mt-1">{g.blurb}</p>
            </a>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          <div id="the-mini">
            <MiniCrossword />
          </div>
          <div id="sudoku">
            <SudokuGame />
          </div>
          <div id="tiles" className="md:col-span-2">
            <TilesGame />
          </div>

          {/* KenKen / Mahjong coming-soon cards */}
          <a href="#" className="block border-2 border-wp-black bg-white p-5 hover:bg-wp-light transition group">
            <p className="kicker text-wp-red mb-2">Coming soon</p>
            <h3 className="headline text-2xl mb-1 group-hover:text-wp-link">KenKen</h3>
            <p className="dek text-sm">Arithmetic meets logic. Daily easy/hard puzzles.</p>
          </a>
          <a href="#" className="block border-2 border-wp-black bg-white p-5 hover:bg-wp-light transition group">
            <p className="kicker text-wp-red mb-2">Coming soon</p>
            <h3 className="headline text-2xl mb-1 group-hover:text-wp-link">Mahjong</h3>
            <p className="dek text-sm">The classic tile-matching solitaire — one hand per day.</p>
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
