'use client';

/**
 * Thin fixed-to-top red progress bar that grows with scroll depth on article
 * pages. Mounted from ArticlePage. z-indexed above the masthead so it's
 * always visible; offset by 1px because body has pt-1.
 */
export default function ReadingProgressBar({ progress }: { progress: number }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <>
      <div className="h-1" aria-hidden="true" />
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-wp-light z-[60] pointer-events-none"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
      >
        <div
          className="h-full bg-wp-red transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </>
  );
}
