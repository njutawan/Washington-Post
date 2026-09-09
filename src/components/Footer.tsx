import Link from 'next/link';
import NewsletterSignup from './NewsletterSignup';
import { TwitterIcon, FacebookIcon, InstagramIcon, YoutubeIcon } from './Icons';

const footerSections = [
  {
    title: 'News',
    items: [
      { label: 'Politics', href: '/politics' },
      { label: 'U.S. News', href: '/us-news' },
      { label: 'World', href: '/world' },
      { label: 'Investigations', href: '/investigations' },
      { label: 'Business', href: '/business' },
      { label: 'Tech', href: '/tech' },
      { label: 'Climate', href: '/climate' },
      { label: 'Sports', href: '/sports' },
      { label: 'D.C., Md. & Va.', href: '/local' },
    ],
  },
  {
    title: 'Opinion',
    items: [
      { label: 'Editorials', href: '/opinions' },
      { label: 'Columns', href: '/opinions' },
      { label: 'Letters', href: '/opinions' },
      { label: 'Op-Eds', href: '/opinions' },
      { label: 'Guest Opinions', href: '/opinions' },
      { label: 'Global Opinions', href: '/opinions' },
    ],
  },
  {
    title: 'Lifestyle',
    items: [
      { label: 'Style', href: '/style' },
      { label: 'Food', href: '/food' },
      { label: 'Travel', href: '/travel' },
      { label: 'Well+Being', href: '/wellbeing' },
      { label: 'Advice', href: '/advice' },
      { label: 'Climate', href: '/climate' },
      { label: 'Obituaries', href: '/obituaries' },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'Podcasts', href: '/podcasts' },
      { label: 'Video', href: '/video' },
      { label: 'Newsletters', href: '/newsletters' },
      { label: 'Games', href: '/games' },
      { label: 'Crosswords', href: '/games' },
      { label: 'WP Intelligence', href: '/wp-intelligence' },
      { label: 'Ripple', href: '/ripple' },
      { label: 'Obituaries', href: '/obituaries' },
    ],
  },
];

const aboutLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Masthead', href: '/about#masthead' },
  { label: 'Careers', href: '/about#careers' },
  { label: 'Contact Us', href: '/about#contact' },
  { label: 'Advertise', href: '/about#contact' },
  { label: 'Ethics Policy', href: '/about#ethics' },
  { label: 'Corrections', href: '/about#corrections' },
];

const socialLinks = [
  { label: 'Twitter', href: 'https://twitter.com/washingtonpost' },
  { label: 'Facebook', href: 'https://facebook.com/washingtonpost' },
  { label: 'Instagram', href: 'https://instagram.com/washingtonpost' },
  { label: 'YouTube', href: 'https://youtube.com/washingtonpost' },
];

export default function Footer() {
  return (
    <footer className="bg-wp-black text-white mt-12 pb-[env(safe-area-inset-bottom)]" role="contentinfo" aria-label="Site footer">
      {/* Newsletter band */}
      <div className="border-b border-gray-700">
        <div className="wp-container py-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="kicker text-wp-red mb-2">Stay informed</p>
              <h2 className="masthead-title text-3xl md:text-4xl mb-3">The Morning Mix</h2>
              <p className="font-sans text-gray-300 text-sm max-w-md">
                The day’s most important news and commentary — before sunrise, every weekday.
                Written by our editors, delivered to your inbox for free.
              </p>
            </div>
            <div>
              <NewsletterSignup variant="inline" />
            </div>
          </div>
        </div>
      </div>

      <div className="wp-container py-10">
        <div className="border-b border-gray-700 pb-8 mb-8">
          <h2 className="masthead-title text-4xl md:text-5xl text-white mb-2">The Washington Post</h2>
          <p className="text-sm font-sans text-gray-400 italic">&ldquo;Democracy Dies in Darkness&rdquo;</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="kicker text-white mb-3 text-[13px]">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm font-sans text-gray-300 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="kicker text-white mb-3 text-[13px]">About</h3>
            <ul className="space-y-2">
              {aboutLinks.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm font-sans text-gray-300 hover:text-white hover:underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social / app links */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="text-xs font-sans text-gray-400">
            © {new Date().getFullYear()} The Washington Post Clone · Built for demo purposes with Next.js & Tailwind CSS.
          </div>
          <div className="flex items-center gap-4 text-xs font-sans text-gray-400">
            <Link href="/about#terms" className="hover:text-white">Terms</Link>
            <Link href="/about#privacy" className="hover:text-white">Privacy</Link>
            <Link href="/about#cookies" className="hover:text-white">Cookies</Link>
            <Link href="/about#accessibility" className="hover:text-white">Accessibility</Link>
            <span className="hidden md:inline text-gray-600">|</span>
            <div className="flex gap-2">
              {[
                { label: 'Twitter', Icon: TwitterIcon },
                { label: 'Facebook', Icon: FacebookIcon },
                { label: 'Instagram', Icon: InstagramIcon },
                { label: 'YouTube', Icon: YoutubeIcon },
              ].map(({ label, Icon }) => {
                const social = socialLinks.find((s) => s.label === label);
                return (
                  <a
                    key={label}
                    href={social?.href || '/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-11 h-11 md:w-9 md:h-9 inline-flex items-center justify-center border border-gray-700 text-gray-300 hover:text-white hover:border-white transition"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
