'use client';

import { useEffect, useMemo, useState } from 'react';

/**
 * A Tiles-style memory matching game: 16 face-down cards arranged in a 4x4
 * grid, each showing an emoji. Flip two; if they match they stay visible.
 * Track moves and time.
 */
const ICONS = ['🎨','🎭','🎪','🎯','🎲','🎸','🏆','📷'];
const TILE_BACK = '▓';

type Tile = { id: number; icon: string; flipped: boolean; matched: boolean };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTiles(): Tile[] {
  return shuffle([...ICONS, ...ICONS]).map((icon, i) => ({ id: i, icon, flipped: false, matched: false }));
}

export default function TilesGame() {
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [started, setStarted] = useState(false);

  const allMatched = useMemo(() => tiles.every((t) => t.matched), [tiles]);

  useEffect(() => {
    if (!started || allMatched) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [started, allMatched]);

  useEffect(() => {
    if (selected.length !== 2) return;
    const [a, b] = selected;
    setMoves((m) => m + 1);
    if (tiles[a].icon === tiles[b].icon) {
      // match
      setTimeout(() => {
        setTiles((t) => t.map((tile, i) => (i === a || i === b ? { ...tile, matched: true, flipped: true } : tile)));
        setSelected([]);
      }, 400);
    } else {
      setTimeout(() => {
        setTiles((t) => t.map((tile, i) => (i === a || i === b ? { ...tile, flipped: false } : tile)));
        setSelected([]);
      }, 800);
    }
  }, [selected, tiles]);

  function flip(i: number) {
    if (!started) setStarted(true);
    if (tiles[i].flipped || tiles[i].matched || selected.length >= 2) return;
    setTiles((t) => t.map((tile, idx) => (idx === i ? { ...tile, flipped: true } : tile)));
    setSelected((s) => [...s, i]);
  }

  function reset() {
    setTiles(buildTiles());
    setSelected([]);
    setMoves(0);
    setSeconds(0);
    setStarted(false);
  }

  return (
    <div className="bg-white border-2 border-wp-black p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="kicker text-wp-red mb-1">Memory match</p>
          <h3 className="headline text-2xl">Tiles</h3>
        </div>
        <div className="text-right">
          <p className="byline">Moves: <span className="font-bold">{moves}</span></p>
          <p className="byline">Time: <span className="font-bold tabular-nums">{seconds}s</span></p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-3" style={{ maxWidth: 320, margin: '0 auto' }}>
        {tiles.map((t, i) => {
          const isUp = t.flipped || t.matched;
          return (
            <button
              key={t.id}
              onClick={() => flip(i)}
              className={
                'aspect-square flex items-center justify-center text-2xl md:text-3xl font-bold border-2 transition-all duration-200 tap-target ' +
                (t.matched
                  ? 'bg-wp-green/20 border-wp-green text-wp-green'
                  : isUp
                    ? 'bg-white border-wp-black text-wp-black'
                    : 'bg-wp-black text-wp-black border-wp-black hover:border-wp-red')
              }
              aria-label={isUp ? `Tile ${t.icon}` : 'Hidden tile'}
            >
              {isUp ? t.icon : <span className="text-white/80" aria-hidden>{TILE_BACK}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-sans uppercase tracking-wider text-wp-gray">
          {allMatched ? '🎉 Complete!' : 'Match pairs of tiles.'}
        </p>
        <button
          onClick={reset}
          className="text-xs font-sans font-bold uppercase tracking-wider border-2 border-wp-black px-3 py-1.5 hover:bg-wp-black hover:text-white transition tap-target"
        >
          New game
        </button>
      </div>
    </div>
  );
}
