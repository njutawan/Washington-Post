import { notFound } from 'next/navigation';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import Sidebar from '@/components/Sidebar';
import SectionHeader from '@/components/SectionHeader';
import { ArticleCard } from '@/components/ArticleCard';
import LoadMore from '@/components/LoadMore';
import NewsletterSignup from '@/components/NewsletterSignup';
import ArticleImage from '@/components/ArticleImage';
import { sectionMetadata, breadcrumbJsonLd } from '@/lib/seo';
import {
  getSectionBySlug,
  getArticlesBySection,
  topNav,
  subNav,
  PAGE_SIZE,
} from '@/lib/data';
import { sections, subsectionParent } from '@/lib/sections';

export function generateStaticParams() {
  const topLevel = [...topNav, ...subNav].filter((s) => s.slug !== 'opinions');
  const sub = Object.values(sections).flatMap((s) =>
    (s.subsections || []).map((ss) => ({ section: ss.slug })),
  );
  return [...topLevel.map((s) => ({ section: s.slug })), ...sub];
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const sec = getSectionBySlug(section);
  if (!sec) return { title: 'Section not found' };
  const cfg = sections[section] || { tagline: `Latest ${sec.label} news and analysis.` };
  return sectionMetadata(section, sec.label, cfg.tagline || `Latest ${sec.label} news and analysis.`);
}

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const sec = getSectionBySlug(section);
  if (!sec) notFound();

  const topHier = sections[section] || null;
  const subInfo = subsectionParent[section];
  const parentHier = subInfo ? sections[subInfo.parent] : null;
  const label = sec.label;
  const tagline =
    topHier?.tagline ||
    parentHier?.subsections?.find((s) => s.slug === section)?.description ||
    parentHier?.tagline ||
    `Latest ${label} news and analysis.`;
  const accent = topHier?.accent || parentHier?.accent || 'wp-black';
  const heroImage = topHier?.heroImage;
  const accentCls = accent === 'wp-red' ? 'text-wp-red' : accent === 'wp-link' ? 'text-wp-link' : 'text-wp-black';
  const accentBg = accent === 'wp-red' ? 'bg-wp-red' : accent === 'wp-link' ? 'bg-wp-link' : 'bg-wp-black';

  const articles = getArticlesBySection(section);
  const initial = articles.slice(0, PAGE_SIZE);
  const more = articles.slice(PAGE_SIZE);

  const lead = initial[0];
  const secondary = initial.slice(1, 4);
  const rest = initial.slice(4);

  const hasHero = !!heroImage && section !== 'wellbeing' && section !== 'food';
  const isPhotoFirst = section === 'food' || section === 'travel';

  const subNavItems = topHier?.subsections || parentHier?.subsections || [];
  const parentSlug = subInfo?.parent || null;

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', item: '/' },
              ...(parentSlug && parentHier ? [{ name: parentHier.label, item: `/${parentSlug}` }] : []),
              { name: label, item: `/${section}` },
            ]),
          ),
        }}
      />
      <main id="main-content" className="wp-container py-6">
        <Breadcrumbs items={[
          ...(parentSlug && parentHier ? [{ label: parentHier.label, href: `/${parentSlug}` }] : []),
          { label, href: `/${section}` },
        ]} />

        {/* Accent color identity bar */}
        <div className={`h-1 w-16 mb-4 ${accentBg}`} />

        {/* Masthead */}
        <div className="border-b-4 border-wp-black mb-6 pb-3">
          <p className={`kicker ${accentCls} mb-1`}>{parentSlug ? parentHier?.label : 'Section'}</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="headline text-4xl md:text-6xl">{label}</h1>
              <p className="dek text-base mt-2 text-wp-gray max-w-2xl">{tagline}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/${section}`} className="px-3 py-1.5 bg-wp-black text-white text-[11px] font-sans font-bold uppercase tracking-wider hover:bg-wp-red transition">Latest</Link>
              <a href="#most-read" className="px-3 py-1.5 border border-wp-border text-[11px] font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black">Most Read</a>
              <a href="#analysis" className="px-3 py-1.5 border border-wp-border text-[11px] font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black">Analysis</a>
            </div>
          </div>
        </div>

        {/* Sub-navigation (Politics → White House, Congress, Courts…) */}
        {subNavItems.length > 0 && (
          <nav className="border-b border-wp-border mb-6 -mx-4 sm:mx-0 overflow-x-auto">
            <ul className="flex gap-6 px-4 sm:px-0 whitespace-nowrap">
              {parentSlug && parentHier && (
                <li>
                  <Link href={`/${parentSlug}`} className="block py-2 text-[12px] md:text-[13px] font-sans uppercase tracking-wider text-wp-gray hover:text-wp-black">
                    ← All {parentHier.label}
                  </Link>
                </li>
              )}
              {subNavItems.map((s) => {
                const active = s.slug === section;
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/${s.slug}`}
                      className={
                        'block py-2 text-[12px] md:text-[13px] font-sans font-bold uppercase tracking-wider border-b-2 transition ' +
                        (active
                          ? 'text-wp-black border-wp-black'
                          : 'text-wp-gray border-transparent hover:text-wp-black hover:border-wp-border')
                      }
                    >
                      {s.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Hero */}
        {hasHero && heroImage && lead && (
          <section className="mb-6 md:mb-8 group cursor-pointer -mx-4 sm:mx-0">
            <Link href={`/article/${lead.slug}`}>
            <div className="relative overflow-hidden bg-gray-900 h-[240px] sm:h-[320px] md:h-[400px] lg:h-[440px]">
              <ArticleImage
                src={heroImage}
                alt={lead.title}
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white max-w-3xl">
                {lead.category && <div className="kicker text-wp-red mb-2">{lead.category}</div>}
                <h2 className="headline text-2xl md:text-4xl lg:text-5xl mb-3 leading-tight group-hover:underline">
                  {lead.title}
                </h2>
                {lead.dek && <p className="dek text-base md:text-lg text-gray-200 mb-2 max-w-2xl">{lead.dek}</p>}
                {(lead.byline || lead.time) && (
                  <p className="byline text-gray-300 flex items-center gap-2">
                    {lead.byline && <span>{lead.byline}</span>}
                    {lead.time && <span>· {lead.time}</span>}
                  </p>
                )}
              </div>
            </div>
            </Link>
          </section>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!hasHero && lead && (
              <div className="pb-8 border-b border-wp-border mb-8">
                <ArticleCard article={lead} variant={isPhotoFirst && lead.image ? 'large' : 'lead'} />
              </div>
            )}

            {secondary.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6 pb-8 border-b border-wp-border mb-8">
                {secondary.map((a) => (
                  <div key={a.id}>
                    <ArticleCard article={a} variant={a.image ? 'medium' : 'small'} />
                  </div>
                ))}
              </div>
            )}

            <SectionHeader title={hasHero ? 'Top Stories' : 'More Top Stories'} kicker={label} href={`/${section}`} />
            <div className="grid md:grid-cols-2 gap-x-6 gap-y-0">
              {rest.map((a) => (
                <ArticleCard key={a.id} article={a} variant={a.image ? 'medium' : 'small'} />
              ))}
            </div>

            {more.length > 0 && <LoadMore more={more} variant="small" />}
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Sidebar />
            <NewsletterSignup variant="large" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
