'use client';

import { useEffect, useMemo, useState } from 'react';

// A fixed daily-ish puzzle (hard-coded starter for the demo). 0 = empty.
// Valid Sudoku solution is implied; for demo we do not validate the full
// solution, just row/col/box conflicts on the currently selected number.
const PUZZLE: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

export default function SudokuGame() {
  const [grid, setGrid] = useState<number[][]>(() => PUZZLE.map((r) => [...r]));
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const fixed = useMemo(() => PUZZLE.map((r) => r.map((v) => v !== 0)), []);

  function conflicts(r: number, c: number, n: number): boolean {
    if (n === 0) return false;
    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === n) return true;
      if (i !== r && grid[i][c] === n) return true;
    }
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = br; i < br + 3; i++)
      for (let j = bc; j < bc + 3; j++)
        if ((i !== r || j !== c) && grid[i][j] === n) return true;
    return false;
  }

  function setNum(n: number) {
    if (!selected) return;
    const { r, c } = selected;
    if (fixed[r][c]) return;
    const next = grid.map((row) => [...row]);
    next[r][c] = n;
    setGrid(next);
    if (n !== 0 && conflicts(r, c, n)) setMistakes((m) => m + 1);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selected) return;
      const num = parseInt(e.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= 9) setNum(num);
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setNum(0);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, grid]);

  const complete = grid.every((row, r) => row.every((v, c) => v !== 0 && !conflicts(r, c, v)));

  return (
    <div className="bg-white border-2 border-wp-black p-5">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="kicker text-wp-red mb-1">Daily puzzle</p>
          <h3 className="headline text-2xl">Sudoku</h3>
        </div>
        <p className="byline">Mistakes: <span className={mistakes > 0 ? 'text-wp-red font-bold' : ''}>{mistakes}</span></p>
      </div>

      <div className="flex justify-center mb-4">
        <div className="inline-grid grid-cols-9 border-2 border-wp-black bg-wp-black" style={{ width: 'min(90vw, 360px)' }}>
          {grid.map((row, r) =>
            row.map((v, c) => {
              const isSel = selected?.r === r && selected?.c === c;
              const sameNum = selected && v !== 0 && grid[selected.r][selected.c] === v;
              const inLine = selected && (selected.r === r || selected.c === c ||
                (Math.floor(selected.r / 3) === Math.floor(r / 3) && Math.floor(selected.c / 3) === Math.floor(c / 3)));
              const conflict = v !== 0 && conflicts(r, c, v);
              const borderR = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-wp-black' : 'border-r border-r-wp-border';
              const borderB = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-wp-black' : 'border-b border-b-wp-border';
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => setSelected({ r, c })}
                  className={
                    'aspect-square flex items-center justify-center font-serif text-xl md:text-2xl font-black tabular-nums transition ' +
                    borderR + ' ' + borderB + ' ' +
                    (fixed[r][c] ? 'bg-wp-cream text-wp-black' : 'bg-white text-wp-blue') + ' ' +
                    (isSel ? 'bg-wp-red/20 ring-2 ring-inset ring-wp-red' : '') + ' ' +
                    (inLine && !isSel ? 'bg-wp-light' : '') + ' ' +
                    (sameNum && !isSel ? 'bg-wp-red/10' : '') + ' ' +
                    (conflict ? '!bg-wp-red/30 !text-wp-red' : '')
                  }
                >
                  {v !== 0 ? v : ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex justify-center gap-1 mb-2 flex-wrap">
        {[1,2,3,4,5,6,7,8,9].map((n) => (
          <button
            key={n}
            onClick={() => setNum(n)}
            className="w-9 h-10 md:w-10 md:h-11 border-2 border-wp-black bg-white font-display font-black text-lg hover:bg-wp-black hover:text-white transition tap-target"
          >{n}</button>
        ))}
        <button
          onClick={() => setNum(0)}
          className="w-9 h-10 md:w-10 md:h-11 border-2 border-wp-border text-wp-gray font-sans text-xs font-bold uppercase hover:border-wp-black transition tap-target"
        >Erase</button>
      </div>

      {complete && (
        <p className="text-center font-sans font-bold text-wp-green text-sm mt-2">
          ✓ Complete — well played!
        </p>
      )}
      <p className="text-center text-[11px] font-sans uppercase tracking-wider text-wp-gray mt-2">
        Click a cell then type or tap a number.
      </p>
    </div>
  );
}
