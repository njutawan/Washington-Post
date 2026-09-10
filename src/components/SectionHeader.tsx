import Link from 'next/link';

export default function SectionHeader({
  title,
  kicker,
  color = 'wp-black',
  href,
}: {
  title: string;
  kicker?: string;
  color?: string;
  href?: string;
}) {
  return (
    <div className="border-t-4 border-b border-wp-black py-2 mb-4 flex items-baseline justify-between">
      <div>
        {kicker && <div className="kicker text-wp-red mb-0.5">{kicker}</div>}
        <h2 className={'headline text-xl md:text-2xl ' + (color === 'wp-red' ? 'text-wp-red' : 'text-wp-black')}>
          {title}
        </h2>
      </div>
      <Link
        href={href || '#'}
        className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline whitespace-nowrap ml-4"
      >
        See more →
      </Link>
    </div>
  );
}
