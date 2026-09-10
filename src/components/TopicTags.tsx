import Link from 'next/link';

type Props = {
  /** e.g. ["Congress","Government Shutdown","House Republicans","Mike Johnson"] */
  tags: string[];
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Related-topic chips that appear at the bottom of an article — WaPo
 *  always has 3–6 of these rounded grey/black pills. */
export default function TopicTags({ tags }: Props) {
  if (!tags.length) return null;
  return (
    <div className="mt-8 mb-6 not-prose">
      <p className="kicker text-wp-black mb-3 text-[11px] uppercase tracking-[0.15em] font-bold">
        Related Topics
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(t)}`}
            className="topic-chip"
          >
            {t}
          </Link>
        ))}
      </div>
    </div>
  );
}
