import Link from 'next/link';
import { slugify } from '@/lib/data';

/**
 * Server component that renders an article byline with clickable author links.
 * Splits on " and " and "," to create multiple linked author segments.
 */
export default function BylineLink({ byline }: { byline?: string }) {
  if (!byline) return null;

  // Strip "By " prefix; we re-add it
  const raw = byline.replace(/^By\s+/i, '');
  // Split on " and " or commas
  const parts = raw
    .split(/\s+and\s+|,\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <>
      <span>By </span>
      {parts.map((p, idx) => {
        const isLast = idx === parts.length - 1;
        const prefix =
          parts.length === 1 ? '' : isLast ? 'and ' : '';
        const suffix =
          parts.length === 1 ? '' : isLast ? '' : parts.length > 2 ? ', ' : ' ';
        if (p.toLowerCase() === 'the editorial board') {
          return (
            <span key={idx}>
              {prefix}
              {p}
              {suffix}
            </span>
          );
        }
        return (
          <span key={idx}>
            {prefix}
            <Link
              href={`/author/${slugify(p)}`}
              className="hover:text-wp-red hover:underline"
            >
              {p}
            </Link>
            {suffix}
          </span>
        );
      })}
    </>
  );
}
