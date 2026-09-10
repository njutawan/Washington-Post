import Link from 'next/link';
import { ChevronRightIcon } from './Icons';
import { absoluteUrl } from '@/lib/seo';

export type Crumb = {
  label: string;
  href?: string;
};

/**
 * Render a breadcrumb trail as clickable links, with Schema.org BreadcrumbList
 * microdata so crawlers that don't parse JSON-LD still pick up the hierarchy.
 *
 * Every intermediate crumb should have an `href`; the final item (current page)
 * omits `href` and gets aria-current="page".
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  // Build full crumb list starting with "Home"
  const full: Crumb[] = [{ label: 'Home', href: '/' }, ...items];

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6"
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      <ol className="flex flex-wrap items-center gap-1 text-xs font-sans text-wp-gray">
        {full.map((item, i) => {
          const position = i + 1;
          const isLast = i === full.length - 1;
          const isHome = i === 0;
          return (
            <li
              key={i}
              className="flex items-center gap-1"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {!isHome && <ChevronRightIcon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className={`hover:text-wp-red hover:underline tap-target ${isHome ? '' : 'uppercase tracking-wider'}`}
                  itemProp="item"
                  itemID={absoluteUrl(item.href)}
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
              ) : (
                <span
                  itemProp="item"
                  itemID={item.href ? absoluteUrl(item.href) : undefined}
                  className={
                    isLast
                      ? 'text-wp-black font-semibold uppercase tracking-wider'
                      : isHome
                        ? ''
                        : 'uppercase tracking-wider'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  <span itemProp="name">{item.label}</span>
                </span>
              )}
              <meta itemProp="position" content={String(position)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
