import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import TheSeven from '@/components/TheSeven';
import SectionHeader from '@/components/SectionHeader';
import { ArticleCard } from '@/components/ArticleCard';
import PhotoGallery from '@/components/PhotoGallery';
import MiniCrossword from '@/components/MiniCrossword';
import ClipsGrid, { type Clip } from '@/components/ClipsGrid';
import MostRead from '@/components/MostRead';
import HomepageOpinions from '@/components/HomepageOpinions';
import LeadSplit from '@/components/LeadSplit';
import Link from 'next/link';
import {
  leadStory,
  topStories,
  sports,
  techBusiness,
  styleArts,
  wellbeing,
} from '@/lib/data';
import { fetchArticles, isSanityConfigured } from '@/lib/cms';

const essayPhotos = [
  { src: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80', caption: 'Capitol Hill at dusk as lawmakers raced to beat the shutdown deadline.', credit: 'Jabin Botsford for The Washington Post' },
  { src: 'https://images.unsplash.com/photo-1569163139394-de4e4f43e4e3?w=1200&q=80', caption: 'Campaign season kicks into high gear across battleground states.', credit: 'Salwan Georges for The Washington Post' },
  { src: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1200&q=80', caption: 'Traders on the floor of the New York Stock Exchange react to the jobs report.', credit: 'Ting Shen for The Washington Post' },
  { src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80', caption: 'Inside the West Wing as advisors huddled over the final bill text.', credit: 'Demetrius Freeman for The Washington Post' },
  { src: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&q=80', caption: 'Federal workers rallied outside the Department of Labor on Tuesday morning.', credit: 'Bill O\u2019Leary for The Washington Post' },
];

const clips: Clip[] = [
  { id: 'c1', title: 'Inside the shutdown deadline: how Congress got here', byline: 'The Video Desk', thumbnail: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80', duration: '4:32', href: '/video/congress-shutdown' },
  { id: 'c2', title: 'Fed signals rate cut — what it means for your wallet', byline: 'Rachel Siegel', thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80', duration: '2:18', href: '/video/fed-rate' },
  { id: 'c3', title: 'Eiffel Tower restrictions draw outrage in Paris', byline: 'World Desk', thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', duration: '1:47', href: '/video/eiffel' },
  { id: 'c4', title: 'Moment Renoir heist suspect is taken into custody', byline: 'World Desk', thumbnail: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80', duration: '0:59', href: '/video/renoir-heist' },
];

/** Two secondary "below-the-fold" stories arranged beside the top stories rail. */
const secondaryStories = [topStories[0], topStories[1]];
const moreTopStories = topStories.slice(2);

export default function Home() {
  return (
    <div className="min-h-screen bg-wp-cream">
      <Masthead />

      <main id="main-content" className="wp-container py-4 md:py-6">
        {/* ============ TOP BLOCK: LEAD (text left, image right) + right rail ============ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 pb-6 md:pb-8 border-b-2 border-wp-black">
          {/* Lead + secondary two-up */}
          <div className="md:col-span-8 lg:col-span-9">
            <LeadSplit article={leadStory} />

            <div className="mt-4 flex items-center gap-3 text-xs font-sans text-wp-gray flex-wrap border-t border-wp-border pt-3">
              <Link href="/live/shutdown-countdown" className="flex items-center gap-1 text-wp-red font-bold hover:underline">
                <span className="live-dot" /> Follow live updates
              </Link>
              <span aria-hidden="true">·</span>
              <span>Updated 2 minutes ago</span>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">
                <Link href={`/article/${leadStory.slug}`} className="hover:text-wp-link underline">
                  Read the full story →
                </Link>
              </span>
            </div>

            {/* Two secondary lead stories (images under headlines) */}
            <div className="grid sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-wp-border">
              {secondaryStories.map((story) => (
                <ArticleCard key={story.id} article={story} variant="large" showCategory={true} />
              ))}
            </div>
          </div>

          {/* Right rail: top stories list + live link */}
          <aside className="md:col-span-4 lg:col-span-3 md:border-l md:border-wp-border md:pl-6">
            <h2 className="kicker text-wp-black text-sm uppercase tracking-[0.15em] mb-3 border-b border-wp-border pb-2">
              Top Stories
            </h2>
            <ul>
              {moreTopStories.map((story, i) => (
                <li key={story.id} className={i === 0 ? 'pb-4' : 'pt-4 border-t border-wp-border'}>
                  <ArticleCard article={story} variant="small" showCategory={true} />
                </li>
              ))}
              <li className="pt-4 border-t border-wp-border">
                <Link href="/live/shutdown-countdown" className="group block">
                  <div className="kicker text-wp-red flex items-center gap-1 mb-1">
                    <span className="live-dot" /> Live
                  </div>
                  <p className="headline text-base leading-snug font-bold hover:text-wp-link">
                    Shutdown countdown: Follow real-time updates from the Hill
                  </p>
                  <p className="byline mt-1">Live blog</p>
                </Link>
              </li>
            </ul>

            <div className="mt-6">
              <MostRead />
            </div>
          </aside>
        </div>

        {/* ============ The Seven (carousel of developing stories) ============ */}
        <TheSeven />

        {/* ============ Opinions: 3–4 round columnists ============ */}
        <HomepageOpinions />

        {/* Clips: video grid with red play-button overlays + duration chips */}
        <ClipsGrid clips={clips} />

        {/* Promo bar: Games + Newsletters */}
        <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <Link href="/games" className="flex items-center gap-4 border-2 border-wp-black p-4 bg-white hover:bg-wp-light transition group">
            <div className="text-3xl md:text-4xl flex-shrink-0" aria-hidden="true">🧩</div>
            <div className="min-w-0">
              <p className="kicker text-wp-red mb-1">Games</p>
              <h3 className="headline text-base md:text-lg group-hover:text-wp-link leading-tight">Play today&rsquo;s Mini Crossword</h3>
              <p className="text-xs font-sans text-wp-gray mt-0.5">New puzzle every day.</p>
            </div>
          </Link>
          <Link href="/newsletters" className="flex items-center gap-4 border-2 border-wp-black p-4 bg-white hover:bg-wp-light transition group">
            <div className="text-3xl md:text-4xl flex-shrink-0" aria-hidden="true">📬</div>
            <div className="min-w-0">
              <p className="kicker text-wp-red mb-1">Newsletters</p>
              <h3 className="headline text-base md:text-lg group-hover:text-wp-link leading-tight">Get The Morning Mix in your inbox</h3>
              <p className="text-xs font-sans text-wp-gray mt-0.5">Hand-curated, before sunrise.</p>
            </div>
          </Link>
        </div>

        {/* ============ Main grid: section channels + sidebar ============ */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mt-6 md:mt-8">
          <div className="md:col-span-2 space-y-8 md:space-y-10">
            <section>
              <SectionHeader title="Business &amp; Technology" kicker="Markets" color="wp-red" href="/business" />
              <div className="grid sm:grid-cols-2 gap-6">
                <ArticleCard article={techBusiness[0]} variant="large" />
                <div className="space-y-0">
                  {techBusiness.slice(1).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="small" />
                  ))}
                </div>
              </div>
            </section>

            <MiniCrossword />

            <section>
              <SectionHeader title="Well+Being" kicker="Health &amp; Science" href="/wellbeing" />
              <div className="grid sm:grid-cols-2 gap-6">
                <ArticleCard article={wellbeing[0]} variant="large" />
                <div className="space-y-0">
                  {wellbeing.slice(1).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="small" />
                  ))}
                </div>
              </div>
            </section>

            <section>
              <SectionHeader title="Style &amp; Arts" kicker="Culture" href="/style" />
              <div className="grid sm:grid-cols-2 gap-6">
                <ArticleCard article={styleArts[0]} variant="large" />
                <div className="space-y-0">
                  {styleArts.slice(1).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="small" />
                  ))}
                </div>
              </div>
            </section>

            <section>
              <SectionHeader title="Sports" kicker="From The Field" href="/sports" />
              <div className="grid sm:grid-cols-2 gap-6">
                <ArticleCard article={sports[0]} variant="large" />
                <div className="space-y-0">
                  {sports.slice(1).map((a) => (
                    <ArticleCard key={a.id} article={a} variant="small" />
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="md:col-span-1">
            <Sidebar />
          </div>
        </div>

        <PhotoGallery photos={essayPhotos} title="In Focus: A week in Washington" />
      </main>

      <Footer />
    </div>
  );
}
