import { notFound } from 'next/navigation';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import Sidebar from '@/components/Sidebar';
import { ArticleCard } from '@/components/ArticleCard';
import LoadMore from '@/components/LoadMore';
import NewsletterSignup from '@/components/NewsletterSignup';
import { RssIcon, MailIcon } from '@/components/Icons';
import { getAuthorBySlug, getArticlesByAuthor, getAllAuthors, PAGE_SIZE } from '@/lib/data';
import { authorMetadata, authorJsonLd, breadcrumbJsonLd } from '@/lib/seo';

export const dynamicParams = true;

export async function generateStaticParams() {
  return getAllAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) return { title: 'Author not found' };
  return authorMetadata(author, getArticlesByAuthor(slug).length);
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const articles = getArticlesByAuthor(slug);
  const initial = articles.slice(0, PAGE_SIZE * 2);
  const more = articles.slice(PAGE_SIZE * 2);
  const initials = author.name.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', item: '/' },
              ...(author.isColumnist ? [{ name: 'Opinions', item: '/opinions' }] : []),
              { name: author.name },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(authorJsonLd(author, articles)) }}
      />

      <main id="main-content" className="wp-container py-6 md:py-10">
        <Breadcrumbs items={[
          { label: author.isColumnist ? 'Opinions' : 'Staff', href: author.isColumnist ? '/opinions' : undefined },
          { label: author.name },
        ]} />

        {/* Author masthead — large round avatar, big name, bio, contact */}
        <header className="border-b-4 border-wp-black pb-8 md:pb-10 mb-8 md:mb-10 pt-2 md:pt-4">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
            <div className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full overflow-hidden bg-wp-black flex-shrink-0 border-4 border-wp-black relative shadow-lg">
              {author.avatar ? (
                <img
                  src={author.avatar}
                  alt={author.name}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="flex items-center justify-center w-full h-full font-display font-black text-white text-6xl md:text-7xl">
                  {initials}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="kicker text-wp-red mb-2">
                {author.isColumnist ? 'Columnist' : 'Staff writer'}
              </p>
              <h1 className="masthead-title text-4xl md:text-6xl lg:text-7xl mb-2 md:mb-3 leading-none">
                {author.name}
              </h1>
              {author.title && (
                <p className="dek text-base md:text-lg text-wp-ink mb-4">{author.title}</p>
              )}
              {author.bio && (
                <p className="font-serif text-wp-ink text-[16px] md:text-lg leading-relaxed max-w-2xl mb-5">
                  {author.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm font-sans">
                <span className="text-wp-gray font-bold">
                  {articles.length} article{articles.length === 1 ? '' : 's'}
                </span>
                {author.twitter && (
                  <a
                    href={`https://twitter.com/${author.twitter.replace('@', '')}`}
                    className="flex items-center gap-1.5 text-wp-link hover:underline tap-target font-bold"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${author.name} on Twitter`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231m-1.16 17.52h1.833L7.084 4.126H5.117L17.084 19.77z"/></svg>
                    {author.twitter}
                  </a>
                )}
                {author.email && (
                  <a
                    href={`mailto:${author.email}`}
                    className="flex items-center gap-1.5 text-wp-link hover:underline tap-target"
                    aria-label={`Email ${author.name}`}
                  >
                    <MailIcon className="w-4 h-4" />
                    <span className="text-xs">Email</span>
                  </a>
                )}
                <Link
                  href={`/api/feed/author/${author.slug}`}
                  className="flex items-center gap-1.5 text-wp-gray hover:text-wp-black tap-target"
                  title={`RSS feed for ${author.name}`}
                >
                  <RssIcon className="w-4 h-4" />
                  <span className="text-xs uppercase tracking-wider">RSS</span>
                </Link>
              </div>

              {/* Newsletter CTA for columnists */}
              {author.isColumnist && (
                <div className="mt-5 max-w-md">
                  <Link
                    href="/newsletters"
                    className="inline-flex items-center gap-2 bg-wp-black text-white px-5 py-2.5 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition"
                  >
                    <span aria-hidden="true">📬</span>
                    Subscribe to {author.name.split(' ')[0]}&rsquo;s newsletter
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          <div className="md:col-span-2">
            {initial.length > 0 && (
              <>
                <div className="border-t-4 border-b border-wp-black py-2 mb-4 flex items-baseline justify-between">
                  <h2 className="headline text-xl">
                    {author.isColumnist ? 'Latest columns' : 'Latest articles'}
                  </h2>
                  <span className="byline">{articles.length} total</span>
                </div>
                <div className="divide-y divide-wp-border">
                  {initial.map((a) => (
                    <div key={a.id} className="py-5">
                      <ArticleCard article={a} variant={a.image ? 'large' : 'small'} />
                    </div>
                  ))}
                </div>
                {more.length > 0 && <LoadMore more={more} variant="small" />}
              </>
            )}
          </div>

          <aside className="md:col-span-1 space-y-8">
            {author.isColumnist && (
              <section className="bg-white border-2 border-wp-black p-5">
                <p className="kicker text-wp-red mb-2">About this columnist</p>
                {author.bio && (
                  <p className="font-serif text-wp-ink text-[15px] leading-relaxed mb-4">
                    {author.bio}
                  </p>
                )}
                <Link
                  href="/newsletters"
                  className="block w-full text-center bg-wp-black text-white px-4 py-3 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition tap-target"
                >
                  Get columns in your inbox
                </Link>
              </section>
            )}

            <Sidebar />
            <NewsletterSignup variant="large" />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
