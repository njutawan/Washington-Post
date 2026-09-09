import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Games',
  description: 'Play The Post\u2019s daily puzzles: The Mini, Sudoku, Tiles, and more.',
  alternates: { canonical: '/games' },
};

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
