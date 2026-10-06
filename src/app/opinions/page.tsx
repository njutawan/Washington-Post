import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from 'next/link';
import ArticleImage from '@/components/ArticleImage';
import { opinions, columnists, getAllArticles, letters, cartoons } from '@/lib/data';
import NewsletterSignup from '@/components/NewsletterSignup';
import Sidebar from '@/components/Sidebar';
import EditorialCartoon from '@/components/EditorialCartoon';
import { breadcrumbJsonLd } from '@/lib/seo';

export default function OpinionsPage() {
  const lead = opinions[0];
  const topOpinions = opinions.slice(1, 4);
  const moreOpinions = opinions.slice(4);
  const editorials = getAllArticles().filter((a) => a.kicker === 'Editorial').slice(0, 3);
  const featuredColumnists = columnists.slice(0, 6);

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', item: '/' },
              { name: 'Opinions', item: '/opinions' },
            ]),
          ),
        }}
      />
      <main id="main-content" className="wp-container py-6 md:py-8">
        <Breadcrumbs items={[{ label: 'Opinions', href: '/opinions' }]} />

        {/* Opinions masthead — black accent, red kicker */}
        <div className="border-b-4 border-wp-black mb-6 md:mb-8 pb-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="kicker text-wp-red mb-1">Opinions</p>
              <h1 className="masthead-title text-5xl md:text-7xl lg:text-8xl leading-none">Opinions</h1>
              <p className="dek text-base mt-3 text-wp-gray max-w-2xl">
                Editorials, columns, cartoons and letters from The Post&rsquo;s editorial board,
                columnists, contributors and readers.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/columns" className="px-4 py-2 border border-wp-black text-xs font-sans font-bold uppercase tracking-wider hover:bg-wp-black hover:text-white">Columns</Link>
              <Link href="/editorials" className="px-4 py-2 border border-wp-border text-xs font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black hover:border-wp-black">Editorials</Link>
              <Link href="/letters" className="px-4 py-2 border border-wp-border text-xs font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black hover:border-wp-black">Letters</Link>
              <a href="#cartoons" className="px-4 py-2 border border-wp-border text-xs font-sans font-bold uppercase tracking-wider text-wp-gray hover:text-wp-black hover:border-wp-black">Cartoons</a>
            </div>
          </div>
        </div>

        {/* Lead opinion + 3 secondary — sidebar moves earlier on tablet */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 pb-8 border-b-2 border-wp-black mb-8">
          {/* Lead opinion */}
          <div className="md:col-span-2 md:border-r border-wp-border md:pr-6 lg:pr-8">
            <Link href={`/article/${lead.slug}`} className="group block">
              <div className="flex gap-5 items-start">
                {lead.image && (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-44 md:h-44 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-4 border-wp-black relative shadow-md">
                    <ArticleImage src={lead.image} alt={lead.byline || ''} fill rounded sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 176px" className="object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {lead.kicker && <div className="kicker text-wp-red mb-2">{lead.kicker}</div>}
                  <h2 className="headline italic font-serif text-2xl md:text-4xl leading-tight group-hover:text-wp-link mb-3">
                    &ldquo;{lead.title}&rdquo;
                  </h2>
                  <p className="byline font-bold text-wp-black">
                    {lead.byline}
                    {lead.authorTitle && <span className="text-wp-gray font-normal ml-2">· {lead.authorTitle}</span>}
                  </p>
                </div>
              </div>
            </Link>
          </div>

          {/* Top 3 opinions */}
          <div className="space-y-5">
            {topOpinions.map((op) => (
              <Link key={op.id} href={`/article/${op.slug}`} className="group flex gap-3 items-start pb-5 border-b border-wp-border last:border-b-0 last:pb-0">
                {op.image ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 relative border-2 border-wp-black">
                    <ArticleImage src={op.image} alt={op.byline || ''} fill rounded sizes="64px" className="object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full bg-wp-black text-white flex items-center justify-center font-serif font-bold flex-shrink-0 text-lg border-2 border-wp-black">
                    {(op.byline || 'W').charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {op.kicker && <div className="kicker text-wp-gray text-[10px] mb-1">{op.kicker}</div>}
                  <h3 className="headline italic text-base md:text-lg leading-snug group-hover:text-wp-link mb-1">
                    &ldquo;{op.title}&rdquo;
                  </h3>
                  <p className="byline font-bold text-wp-black">{op.byline}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* COLUMNISTS BLOCK — large round avatars (the WaPo signature look) */}
        <section className="mb-10">
          <div className="flex items-baseline justify-between border-t-4 border-b border-wp-black py-2 mb-5 md:mb-6">
            <h2 className="headline text-xl md:text-2xl">Columnists</h2>
            <Link href="/columns" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline tap-target">
              All columnists →
            </Link>
          </div>
          <p className="dek text-wp-gray mb-5 max-w-2xl">
            The voices shaping the debate — follow their latest analysis and subscribe to their newsletters.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 md:gap-5">
            {featuredColumnists.map((c) => (
              <Link key={c.id} href={`/author/${c.slug}`} className="text-center group block">
                <div className="w-24 h-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 rounded-full overflow-hidden bg-gray-100 mx-auto mb-3 border-[3px] border-wp-black relative shadow-md group-hover:border-wp-red group-hover:shadow-[0_0_0_3px_rgba(178,20,20,1)] transition">
                  {c.avatar ? (
                    <ArticleImage src={c.avatar} alt={c.name} fill rounded sizes="(max-width: 640px) 96px, 128px" className="object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full font-display font-black text-wp-black text-3xl">
                      {c.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="headline text-sm md:text-base font-bold leading-tight group-hover:text-wp-link mb-0.5">
                  {c.name}
                </h3>
                <p className="byline text-wp-gray text-[11px] leading-snug">{c.title}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Two-column body: editorial board + cartoons / letters + more opinions */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-10">
          <div className="md:col-span-2 space-y-8">

            {/* EDITORIAL BOARD CALLOUT */}
            <section className="bg-white border-4 border-wp-black p-5 md:p-7 relative">
              <span className="absolute -top-3 left-6 bg-wp-red text-white px-3 py-1 font-sans font-bold uppercase tracking-widest text-[10px]">
                Editorial Board
              </span>
              <div className="flex items-baseline justify-between border-b-2 border-wp-black pb-2 mb-4 pt-1">
                <h2 className="headline text-xl md:text-2xl">The Post&rsquo;s View</h2>
                <Link href="/editorials" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline tap-target">
                  All editorials →
                </Link>
              </div>
              <p className="dek text-wp-gray mb-5 text-sm">
                The unsigned editorials below represent the views of The Washington Post —
                the product of vigorous debate among the editorial board.
              </p>
              <div className="divide-y divide-wp-border">
                {editorials.length > 0 ? editorials.map((ed) => (
                  <Link key={ed.id} href={`/article/${ed.slug}`} className="group block py-3 first:pt-0">
                    <h3 className="headline italic text-lg md:text-xl leading-snug group-hover:text-wp-link mb-1">
                      &ldquo;{ed.title}&rdquo;
                    </h3>
                    <p className="byline">{ed.byline}</p>
                  </Link>
                )) : (
                  <p className="byline italic text-wp-gray">No editorials at this hour.</p>
                )}
              </div>
              <div className="mt-5 pt-4 border-t border-wp-border">
                <Link href="/letters" className="text-sm font-sans font-bold uppercase tracking-wider text-wp-red hover:underline tap-target">
                  Submit a letter to the editor →
                </Link>
              </div>
            </section>

            {/* CARTOONS / POLITICAL CARICATURES */}
            <section id="cartoons" aria-labelledby="cartoons-heading">
              <div className="flex items-baseline justify-between border-t-4 border-b border-wp-black py-2 mb-5">
                <h2 id="cartoons-heading" className="headline text-xl md:text-2xl">Cartoons</h2>
                <Link href="#" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline tap-target">
                  All cartoons →
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {cartoons.map((c) => (
                  <EditorialCartoon key={c.id} cartoon={c} />
                ))}
              </div>
            </section>

            {/* LETTERS TO THE EDITOR */}
            <section aria-labelledby="letters-heading">
              <div className="flex items-baseline justify-between border-t-4 border-b border-wp-black py-2 mb-5">
                <h2 id="letters-heading" className="headline text-xl md:text-2xl">Letters to the Editor</h2>
                <Link href="/letters" className="text-xs font-sans uppercase tracking-wider text-wp-link hover:underline tap-target">
                  More letters →
                </Link>
              </div>
              <div className="bg-white border-2 border-wp-black p-5 md:p-6 space-y-5">
                {letters.map((l) => (
                  <article key={l.id} className="border-b border-wp-border pb-5 last:border-b-0 last:pb-0">
                    <Link href={`/article/${l.slug}`} className="group block">
                      <h3 className="headline font-serif text-lg md:text-xl font-bold leading-snug group-hover:text-wp-link mb-2">
                        {l.title}
                      </h3>
                    </Link>
                    <p className="font-serif text-[15px] text-wp-ink leading-relaxed italic mb-2">
                      &ldquo;{l.excerpt}&rdquo;
                    </p>
                    <p className="byline text-wp-gray">
                      — Reader in {l.location}
                    </p>
                    {l.inResponseTo && (
                      <p className="mt-1 text-[11px] font-sans uppercase tracking-wider text-wp-gray">
                        In response to: <span className="normal-case italic tracking-normal text-wp-ink">{l.inResponseTo}</span>
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            {/* MORE OPINIONS */}
            <section>
              <div className="border-t-4 border-b border-wp-black py-2 mb-4">
                <h2 className="headline text-xl">More Opinions</h2>
              </div>
              <ul className="divide-y divide-wp-border">
                {moreOpinions.map((op) => (
                  <li key={op.id} className="py-4">
                    <Link href={`/article/${op.slug}`} className="group flex gap-3 items-start">
                      <div className="w-12 h-12 rounded-full bg-wp-black text-white flex items-center justify-center font-serif font-bold flex-shrink-0 text-sm border-2 border-wp-black">
                        {(op.byline || 'W').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {op.kicker && <div className="kicker text-wp-gray text-[10px] mb-1">{op.kicker}</div>}
                        <h3 className="headline italic text-lg leading-snug group-hover:text-wp-link mb-1">
                          &ldquo;{op.title}&rdquo;
                        </h3>
                        <p className="byline font-bold text-wp-black">{op.byline}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar */}
          <aside aria-label="More opinions" className="md:col-span-1 space-y-8">
            <section className="bg-wp-black text-white p-5">
              <p className="kicker text-wp-red mb-2">Opinions newsletter</p>
              <h3 className="headline text-xl mb-2 leading-tight">
                The best of Post Opinions, every morning.
              </h3>
              <p className="font-serif text-white/80 text-sm mb-4">
                Paul Waldman and Greg Sargent curate the sharpest commentary from across the political spectrum.
              </p>
              <Link href="/newsletters" className="block text-center bg-wp-red text-white px-4 py-3 font-sans font-bold uppercase text-xs tracking-wider hover:bg-white hover:text-wp-black transition tap-target">
                Sign up — it&rsquo;s free
              </Link>
            </section>

            <section className="bg-white border-2 border-wp-black p-5">
              <p className="kicker text-wp-red mb-2">Submit your views</p>
              <h3 className="headline text-lg mb-2">Write a letter to the editor</h3>
              <p className="font-serif text-wp-ink text-[15px] leading-relaxed mb-4">
                We read every submission. Letters under 200 words have the best chance of being published.
              </p>
              <Link href="/letters" className="inline-block border-2 border-wp-black px-4 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-black hover:text-white transition">
                Submit a letter
              </Link>
            </section>

            <Sidebar />
            <NewsletterSignup variant="large" />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
