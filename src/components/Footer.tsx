import Link from 'next/link';
import NewsletterSignup from './NewsletterSignup';

const footerSections = [
  {
    title: 'News',
    items: ['Politics', 'U.S. News', 'World', 'Investigations', 'Business', 'Tech', 'Climate', 'Science', 'Sports'],
  },
  {
    title: 'Opinion',
    items: ['Editorials', 'Columns', 'Letters', 'Op-Eds', 'Guest Opinions', 'Global Opinions'],
  },
  {
    title: 'Lifestyle',
    items: ['Style', 'Food', 'Travel', 'Well+Being', 'Arts & Entertainment', 'Books', 'Home'],
  },
  {
    title: 'More',
    items: ['Podcasts', 'Video', 'Newsletters', 'Games', 'Crosswords', 'WP Intelligence', 'Ripple', 'Obituaries'],
  },
];

const aboutLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Masthead', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact Us', href: '#' },
  { label: 'Advertise', href: '#' },
  { label: 'Ethics Policy', href: '#' },
  { label: 'Corrections', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-wp-black text-white mt-12 pb-[env(safe-area-inset-bottom)]" role="contentinfo" aria-label="Site footer">
      {/* Newsletter band */}
      <div className="border-b border-gray-700">
        <div className="wp-container py-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="kicker text-red-400 mb-2">Stay informed</p>
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
                  <li key={item}>
                    <a href="#" className="text-sm font-sans text-gray-300 hover:text-white hover:underline">
                      {item}
                    </a>
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
                  {item.href === '#' ? (
                    <a href={item.href} className="text-sm font-sans text-gray-300 hover:text-white hover:underline">
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="text-sm font-sans text-gray-300 hover:text-white hover:underline">
                      {item.label}
                    </Link>
                  )}
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
            <a href="#" className="text-gray-300 hover:text-white">Terms</a>
            <a href="#" className="text-gray-300 hover:text-white">Privacy</a>
            <a href="#" className="text-gray-300 hover:text-white">Cookies</a>
            <a href="#" className="text-gray-300 hover:text-white">Accessibility</a>
            <span className="hidden md:inline text-gray-400">|</span>
            <div className="flex gap-3">
              {['Twitter', 'Facebook', 'Instagram', 'YouTube'].map((s) => (
                <a key={s} href="#" className="text-gray-300 hover:text-white" aria-label={s}>{s[0]}</a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
