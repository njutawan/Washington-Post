import type { Metadata } from 'next';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import { absoluteUrl, breadcrumbJsonLd } from '@/lib/seo';

const PRINCIPLES = [
  {
    number: '01',
    title: 'Read without friction',
    body: 'A considered reading surface with responsive editorial layouts, accessible controls, dark mode and a focused article experience.',
  },
  {
    number: '02',
    title: 'Follow the story',
    body: 'Live coverage, instant search, reading history, saved stories and newsletters make it easy to move from a headline to context.',
  },
  {
    number: '03',
    title: 'See the newsroom',
    body: 'An editorial workspace brings assignments, story states, alerts, moderation and publishing workflows into the product.',
  },
  {
    number: '04',
    title: 'Build for everyone',
    body: 'Keyboard navigation, reduced-motion support, contrast-conscious themes and automated accessibility checks are part of the baseline.',
  },
];

const EXPERIENCES = [
  {
    eyebrow: 'For readers',
    title: 'The daily edition',
    body: 'Browse the front page, move across sections and settle into long-form reporting that feels at home on every screen.',
    href: '/',
    cta: 'Open the homepage',
  },
  {
    eyebrow: 'For the desk',
    title: 'The newsroom',
    body: 'Move a story from pitch to publication, coordinate coverage and manage the work that happens behind the masthead.',
    href: '/editorial',
    cta: 'Visit Editorial CMS',
  },
  {
    eyebrow: 'For the moment',
    title: 'Live coverage',
    body: 'Follow a developing story through a reverse-chronological live blog with fresh updates and a clear reading rhythm.',
    href: '/live/shutdown-countdown',
    cta: 'Watch the live blog',
  },
];

export const metadata: Metadata = {
  title: 'About this project',
  description:
    'Learn about the Washington Post-inspired digital newsroom demo, its reading experience and the production-minded features behind it.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/about'),
    title: 'About this project | The Washington Post',
    description:
      'A Washington Post-inspired digital newsroom demo designed as a complete reading and editorial experience.',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', item: '/' },
              { name: 'About', item: '/about' },
            ]),
          ),
        }}
      />

      <main id="main-content">
        <section className="bg-wp-black text-white border-b-4 border-wp-red">
          <div className="wp-container py-10 md:py-16 lg:py-20">
            <nav aria-label="Breadcrumb" className="mb-8 text-xs font-sans uppercase tracking-wider text-white/60">
              <Link href="/" className="hover:text-white hover:underline">Home</Link>
              <span className="px-2" aria-hidden="true">/</span>
              <span className="text-white" aria-current="page">About</span>
            </nav>
            <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(15rem,0.55fr)] gap-10 lg:gap-16 items-end">
              <div>
                <p className="kicker text-wp-red mb-3">About the project</p>
                <h1 className="masthead-title text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] text-white max-w-4xl">
                  A newsroom experience, built for the web.
                </h1>
                <p className="font-serif text-lg md:text-xl leading-relaxed text-white/80 mt-6 max-w-2xl">
                  This is an independent, Washington Post-inspired product demo that pairs the ritual of a great newspaper with the mechanics of a modern digital newsroom.
                </p>
              </div>
              <div className="border-l-2 border-wp-red pl-5 md:pl-6 pb-1">
                <p className="kicker text-white/60 mb-2">The idea</p>
                <p className="font-serif text-xl md:text-2xl leading-snug text-white">
                  Familiar on the outside. Thoughtful, fast and production-minded underneath.
                </p>
              </div>
            </div>

            <div className="mt-10 md:mt-14 grid sm:grid-cols-3 border-t border-white/25">
              <div className="py-5 sm:pr-6 border-b sm:border-b-0 sm:border-r border-white/25">
                <p className="kicker text-wp-red mb-2">One experience</p>
                <p className="font-serif text-lg leading-snug">Reading, listening, watching and playing — in one edition.</p>
              </div>
              <div className="py-5 sm:px-6 border-b sm:border-b-0 sm:border-r border-white/25">
                <p className="kicker text-wp-red mb-2">Two perspectives</p>
                <p className="font-serif text-lg leading-snug">A polished reader product and a working editorial desk.</p>
              </div>
              <div className="py-5 sm:pl-6">
                <p className="kicker text-wp-red mb-2">Always considered</p>
                <p className="font-serif text-lg leading-snug">Responsive, accessible and ready for unreliable connections.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="wp-container py-12 md:py-16">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <p className="kicker text-wp-red mb-2">What it explores</p>
              <h2 className="headline text-3xl md:text-4xl leading-tight">The feel of the paper. The possibilities of the platform.</h2>
            </div>
            <div className="lg:col-span-8 font-serif text-lg md:text-xl text-wp-ink leading-relaxed space-y-5">
              <p>
                Great news products do more than arrange headlines. They create a pace: a useful front page, a calm place to read, reliable ways to return to a story, and just enough interaction to make the edition feel alive.
              </p>
              <p>
                This project turns that point of view into a full-stack Next.js build. It includes editorial content, reader accounts, metered access, live updates, search, audio, video, games and an internal CMS — all held together by a newspaper-inspired design system.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y-4 border-wp-black bg-white">
          <div className="wp-container py-10 md:py-14">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-wp-border pb-5 mb-1">
              <div>
                <p className="kicker text-wp-red mb-2">The standard</p>
                <h2 className="headline text-3xl md:text-4xl">Four choices behind the experience</h2>
              </div>
              <p className="byline max-w-md">The interface is designed to be useful at the desk, on the train and everywhere in between.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-wp-border">
              {PRINCIPLES.map((principle) => (
                <article key={principle.number} className="py-7 sm:px-5 first:pl-0 last:pr-0">
                  <p className="font-display text-4xl text-wp-red leading-none mb-5" aria-hidden="true">{principle.number}</p>
                  <h3 className="headline text-xl mb-2">{principle.title}</h3>
                  <p className="font-serif text-wp-ink leading-relaxed">{principle.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="wp-container py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-t-4 border-b border-wp-black py-3 mb-6">
            <div>
              <p className="kicker text-wp-red mb-1">Start exploring</p>
              <h2 className="headline text-3xl md:text-4xl">Choose your way in</h2>
            </div>
            <p className="dek max-w-lg">Each route shows a different part of the product: the edition, the operation and the story as it unfolds.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {EXPERIENCES.map((experience, index) => (
              <Link
                key={experience.title}
                href={experience.href}
                className={
                  'group relative flex flex-col min-h-[18rem] p-6 border-2 border-wp-black transition duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_0_rgba(180,0,1,1)] ' +
                  (index === 1 ? 'bg-wp-black text-white' : 'bg-wp-cream')
                }
              >
                <p className={'kicker mb-auto ' + (index === 1 ? 'text-wp-red' : 'text-wp-red')}>{experience.eyebrow}</p>
                <div className="pt-10">
                  <h3 className="headline text-2xl mb-3">{experience.title}</h3>
                  <p className={'font-serif leading-relaxed mb-6 ' + (index === 1 ? 'text-white/75' : 'text-wp-ink')}>{experience.body}</p>
                  <span className="font-sans font-bold uppercase tracking-wider text-xs group-hover:underline">
                    {experience.cta} <span aria-hidden="true">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-wp-light border-t border-wp-border">
          <div className="wp-container py-10 md:py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="kicker text-wp-red mb-2">A clear note</p>
              <h2 className="headline text-2xl md:text-3xl mb-2">Made to learn, test and share.</h2>
              <p className="font-serif text-wp-ink max-w-2xl leading-relaxed">
                This independent demo is created for educational purposes and is not affiliated with, endorsed by or connected to The Washington Post.
              </p>
            </div>
            <a
              href="https://github.com/njutawan/Washington-Post"
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-center bg-wp-black text-white px-5 py-3 font-sans font-bold uppercase tracking-wider text-xs hover:bg-wp-red transition tap-target"
            >
              View the source
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
