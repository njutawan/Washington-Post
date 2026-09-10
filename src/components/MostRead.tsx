import Link from 'next/link';
import { mostRead } from '@/lib/data';

/**
 * WaPo-style "Most Read" right-rail module: thick black top-border, kicker,
 * giant serif numerals, bold headline — no thumbs, no category labels.
 */
export default function MostRead({ items = mostRead }: { items?: string[] }) {
  return (
    <section className="border-t-4 border-b border-wp-black pt-3 pb-2">
      <h2 className="kicker text-wp-black text-sm mb-3 uppercase tracking-[0.15em]">
        Most Read
      </h2>
      <ol>
        {items.slice(0, 5).map((headline, i) => (
          <li key={i} className="flex gap-4 py-3 border-b border-wp-border last:border-b-0 items-start">
            <span
              aria-hidden="true"
              className="masthead-title text-wp-black text-4xl leading-none mt-[-4px] w-10 flex-shrink-0 text-center"
            >
              {i + 1}
            </span>
            <Link
              href={`/search?q=${encodeURIComponent(headline)}`}
              className="headline text-base leading-snug hover:text-wp-link font-bold font-sans pt-1"
            >
              {headline}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
