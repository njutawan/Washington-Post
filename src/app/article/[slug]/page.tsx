import { notFound } from 'next/navigation';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import Sidebar from '@/components/Sidebar';
import ArticleImage from '@/components/ArticleImage';
import ArticlePageClient, { ArticleHeaderActions, ArticleActions } from '@/components/ArticlePageClient';
import ArticleToolbar from '@/components/ArticleToolbar';
import ReadAloudPlayer from '@/components/ReadAloudPlayer';
import InlineNewsletter from '@/components/InlineNewsletter';
import TopicTags from '@/components/TopicTags';
import MostRead from '@/components/MostRead';
import TOCWithRef from '@/components/TOCWithRef';
import MDXBody from '@/components/MDXBody';
import ElectionWidget from '@/components/ElectionWidget';
import { getArticleBySlug, getRelatedArticles } from '@/lib/data';
import { articleMetadata, articleJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { ClockIcon } from '@/components/Icons';
import Comments from '@/components/Comments';
import PaywallGate from '@/components/PaywallGate';
import BylineLink from '@/components/BylineLink';
import Link from 'next/link';
import { parseBylineNames } from '@/lib/data';
import AdSlot from '@/components/AdSlot';
import { getMdxArticle } from '@/lib/mdx';
import { inferTopics } from '@/lib/topics';

export const dynamicParams = true;

async function resolveArticle(slug: string) {
  const mdx = await getMdxArticle(slug).catch(() => null);
  if (mdx) return { article: mdx as any, Content: mdx.Content, isMdx: true as const };
  const legacy = getArticleBySlug(slug);
  if (!legacy) return null;
  return { article: legacy as any, Content: null as null, isMdx: false as const };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveArticle(slug);
  if (!resolved) return { title: 'Article not found' };
  return articleMetadata(resolved.article);
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveArticle(slug);
  if (!resolved) notFound();
  const { article, Content, isMdx } = resolved;

  // Extract extended longform fields (optionally supplied via MDX frontmatter;
  // fall back to sensible defaults for legacy stubs).
  const correction: string | undefined = (article as any).correction;
  const updatedAt: string | undefined = (article as any).updatedAt;
  const secondImage: string | undefined = (article as any).image2;
  const secondCaption: string | undefined = (article as any).caption2;
  const secondCredit: string | undefined = (article as any).credit2;
  const videoUrl: string | undefined = (article as any).videoUrl;
  const videoCaption: string | undefined = (article as any).videoCaption;
  const topics = ((article as any).topics as string[] | undefined) || inferTopics({
    category: article.category,
    kicker: article.kicker,
    title: article.title,
    dek: article.dek,
  });

  const { Content: _Content, ...articleForClient } = article as any;
  void _Content;

  const related = getRelatedArticles(articleForClient, 4);
  const fallbackBody = articleForClient.body || [
    'This story is still developing. Check back for more updates as our reporters gather additional information from the scene and from officials.',
    'The Washington Post is committed to bringing you accurate, timely reporting from our award-winning newsroom.',
  ];

  // Show the election widget on politics/shutdown stories
  const showElectionWidget =
    (article.categorySlug === 'politics' || /shutdown|election|congress|senate|house/i.test(article.title || ''));

  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <AdSlot slot="top-banner" className="py-3 border-b border-wp-border" />

      {/* Sticky toolbar: slides under the masthead while reading */}
      <ArticleToolbar
        article={articleForClient}
        audio={
          <span className="hidden sm:inline text-wp-red text-[11px] font-bold mr-1">
            ● Listen
          </span>
        }
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', item: '/' },
              ...(article.category && article.categorySlug
                ? [{ name: article.category, item: `/${article.categorySlug}` }]
                : []),
              { name: article.title },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
      />

      <main id="main-content" className="wp-container py-6">
        <Breadcrumbs
          items={[
            { label: article.category || 'News', href: article.categorySlug ? `/${article.categorySlug}` : undefined },
            { label: article.kicker || 'Article' },
          ]}
        />

        {/* 12-column layout: TOC | article | sidebar */}
        <div className="grid grid-cols-12 gap-6 lg:gap-8 mt-4">
          <aside className="hidden lg:block lg:col-span-2 order-1">
            <div id="toc-slot" className="relative">
              <TOCWithRef />
            </div>
          </aside>

          <article className="col-span-12 lg:col-span-7 order-2">
            {article.kicker && (
              <div className="kicker text-wp-red mb-3 text-sm">{article.kicker}</div>
            )}

            <h1
              className="headline text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight"
              style={{ viewTransitionName: 'vt-title', contain: 'layout' }}
            >
              {article.title}
            </h1>

            {article.dek && (
              <p className="dek text-xl md:text-2xl mb-5 text-wp-ink leading-snug font-serif italic border-l-4 border-wp-red pl-4">
                {article.dek}
              </p>
            )}

            {/* Correction / update banner (if frontmatter supplies one) */}
            {correction && (
              <div className="correction-banner">
                <span className="corr-label">Correction:</span>
                {correction}
              </div>
            )}
            {updatedAt && !correction && (
              <div className="correction-banner">
                <span className="corr-label">Updated:</span>
                This story was updated {updatedAt}.
              </div>
            )}

            {/* Byline block */}
            <div className="flex items-start gap-4 py-5 border-t-2 border-b border-wp-black mb-6">
              {(() => {
                const names = parseBylineNames(article.byline);
                const primaryName = names[0] || '';
                const primarySlug = primaryName
                  ? primaryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                  : '';
                const initial = primaryName.charAt(0).toUpperCase() || (article.byline || 'W').charAt(0).toUpperCase();
                return (
                  <>
                    {primarySlug ? (
                      <Link
                        href={`/author/${primarySlug}`}
                        className="w-12 h-12 rounded-full bg-wp-black text-white flex items-center justify-center font-serif font-bold text-lg flex-shrink-0 hover:bg-wp-red transition tap-target"
                        aria-label={`${primaryName} profile`}
                      >
                        {initial}
                      </Link>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-full bg-wp-black text-white flex items-center justify-center font-serif font-bold text-lg flex-shrink-0"
                        aria-hidden="true"
                      >
                        {initial}
                      </div>
                    )}
                  </>
                );
              })()}
              <div className="flex-1">
                {article.byline && (
                  <div className="font-sans text-sm">
                    <span className="font-bold"><BylineLink byline={article.byline} /></span>
                    <span className="text-wp-gray ml-2">· Staff writers</span>
                  </div>
                )}
                <div className="byline flex items-center flex-wrap gap-3 mt-1">
                  {article.dateline && <span className="uppercase tracking-wider font-bold text-wp-black text-xs">{article.dateline}</span>}
                  <span className="flex items-center gap-1">
                    <ClockIcon /> {article.time || 'Recently'}
                  </span>
                  {article.readTime && (
                    <span className="flex items-center gap-1">
                      <span aria-hidden="true">•</span> {article.readTime}
                    </span>
                  )}
                </div>
                <ArticleHeaderActions article={articleForClient} />
              </div>
            </div>

            {/* Listen / audio (TTS) bar */}
            <ReadAloudPlayer title={article.title} />

            {/* Dual hero: photo + video OR two photos */}
            {videoUrl ? (
              <div className="dual-hero two-up mb-6 md:mb-8 -mx-4 sm:mx-0">
                {article.image && (
                  <div className="relative h-[240px] sm:h-[320px] md:h-[380px] overflow-hidden bg-gray-100">
                    <ArticleImage src={article.image} alt={article.caption || article.title} fill priority sizes="50vw" className="object-cover" />
                  </div>
                )}
                <div className="relative aspect-video sm:h-[320px] md:h-[380px] overflow-hidden bg-black">
                  <iframe
                    src={videoUrl}
                    title={videoCaption || 'Related video'}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                  {videoCaption && (
                    <p className="text-[11px] font-sans text-white/70 absolute bottom-1 left-2 right-2 italic truncate">
                      {videoCaption}
                    </p>
                  )}
                </div>
              </div>
            ) : secondImage ? (
              <div className="dual-hero two-up mb-6 md:mb-8 -mx-4 sm:mx-0">
                <div className="relative h-[240px] sm:h-[320px] md:h-[380px] overflow-hidden bg-gray-100">
                  <ArticleImage src={article.image} alt={article.caption || article.title} fill priority sizes="50vw" className="object-cover" />
                </div>
                <div className="relative h-[240px] sm:h-[320px] md:h-[380px] overflow-hidden bg-gray-100">
                  <ArticleImage src={secondImage} alt={secondCaption || article.title} fill sizes="50vw" className="object-cover" />
                </div>
                {(article.caption || secondCaption) && (
                  <figcaption className="col-span-2 text-[12px] font-sans text-wp-gray mt-2 italic">
                    {article.caption}{secondCaption ? ` | ${secondCaption}` : ''}
                    {article.credit && <span className="ml-2 not-italic text-wp-gray/70">{article.credit}{secondCredit && `; ${secondCredit}`}</span>}
                  </figcaption>
                )}
              </div>
            ) : article.image ? (
              <figure className="mb-6 md:mb-8 -mx-4 sm:mx-0" style={{ viewTransitionName: 'vt-hero', contain: 'paint' }}>
                <div className="relative w-full h-[240px] sm:h-[320px] md:h-[420px] lg:h-[480px] overflow-hidden bg-gray-100">
                  <ArticleImage
                    src={article.image}
                    alt={article.caption || article.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 768px"
                    className="object-cover"
                    caption={article.caption}
                    credit={article.credit}
                  />
                </div>
              </figure>
            ) : null}

            <ArticlePageClient article={articleForClient}>
              <PaywallGate slug={slug} previewParagraphs={2}>
                <div id="article-body" className="article-body article-prose">
                  {isMdx && Content ? (
                    <MDXBody Content={Content} />
                  ) : (
                    <LegacyBody paragraphs={fallbackBody} pullQuote={article.pullQuote} />
                  )}

                  {/* Mid-article inline newsletter (WaPo classic longform placement) */}
                  <InlineNewsletter />

                  {/* Mid-article ad */}
                  <div className="my-8 py-4 border-y border-wp-border flex justify-center">
                    <AdSlot slot="mid-article" />
                  </div>

                  {/* Election widget: drops into politics-adjacent stories */}
                  {showElectionWidget && <ElectionWidget />}

                  {/* End-of-story marker */}
                  <div className="flex justify-center my-8">
                    <span className="w-16 h-0.5 bg-wp-black" />
                  </div>

                  {/* Topic chips */}
                  <TopicTags tags={topics} />

                  <div className="flex items-center justify-between border-t border-b border-wp-border py-4 my-4">
                    <p className="text-xs font-sans uppercase tracking-wider text-wp-gray">
                      {article.readTime || '5 min read'}
                    </p>
                    <ArticleActions article={articleForClient} />
                  </div>
                </div>

                <Comments articleId={article.id} />
              </PaywallGate>
            </ArticlePageClient>

            {/* Related stories */}
            <section className="mt-10">
              <div className="border-t-4 border-b border-wp-black py-2 mb-6">
                <h2 className="headline text-xl">Related Stories</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((a) => (
                  <Link key={a.id} href={`/article/${a.slug}`} className="block group">
                    {a.image && (
                      <div className="relative overflow-hidden bg-gray-100 mb-3 h-40 w-full">
                        <ArticleImage
                          src={a.image}
                          alt={a.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 360px"
                          className="object-cover group-hover:opacity-95 transition"
                        />
                      </div>
                    )}
                    {a.category && <div className="kicker text-wp-red mb-1">{a.category}</div>}
                    <h3 className="headline text-lg mb-1 group-hover:text-wp-link leading-tight">{a.title}</h3>
                    {a.byline && <div className="byline"><BylineLink byline={a.byline} /></div>}
                  </Link>
                ))}
              </div>
            </section>
          </article>

          {/* Right rail: sticky Most Read at top + Sidebar */}
          <aside className="col-span-12 lg:col-span-3 order-3">
            <div className="lg:sticky lg:top-20 space-y-8">
              <MostRead />
              <Sidebar />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function LegacyBody({ paragraphs, pullQuote }: { paragraphs: string[]; pullQuote?: string }) {
  const sizeCls = 'text-[17px] sm:text-lg lg:text-[1.2rem] leading-[1.7] lg:leading-[1.75]';
  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className={`font-body ${sizeCls} mb-5 text-wp-ink ${i === 0 ? 'has-dropcap' : ''}`}>
          {para}
        </p>
      ))}
      {pullQuote && (
        <blockquote className="my-8 md:my-10 py-6 px-4 md:px-6 border-t-4 border-b-4 border-wp-black">
          <p className="font-serif italic text-xl md:text-2xl lg:text-3xl leading-tight text-wp-black">
            {pullQuote}
          </p>
        </blockquote>
      )}
      <p className={`font-body ${sizeCls} mb-5 text-wp-ink`}>
        Senate Majority Leader Chuck Schumer (D-N.Y.) told reporters Tuesday he would put the House bill on the floor as soon as it arrived. &ldquo;The Senate will act quickly and responsibly to prevent a shutdown,&rdquo; Schumer said.
      </p>
      <p className={`font-body ${sizeCls} mb-5 text-wp-ink`}>
        But even if the bill clears the Senate with bipartisan support, the episode underscored the fragility of the current Congress &mdash; where a handful of hard-line members has repeatedly brought the nation within hours of a shutdown.
      </p>
      <p className={`font-body ${sizeCls} mb-5 text-wp-ink`}>
        At the White House, President Biden said he would sign the bill immediately, adding that &ldquo;no one benefits from a government shutdown &mdash; not the American people, not our economy, not our national security.&rdquo;
      </p>
    </>
  );
}
