import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import { breadcrumbJsonLd } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'About The Washington Post: our newsroom, masthead, careers, ethics policy, corrections, and contact information.',
  alternates: { canonical: '/about' },
};

const SECTIONS = [
  {
    id: 'masthead',
    title: 'Masthead',
    body: 'Our newsroom is led by experienced editors across politics, investigations, business, technology, world news, sports, and opinion. A full staff directory ships with the production newsroom.',
  },
  {
    id: 'careers',
    title: 'Careers',
    body: 'We hire reporters, editors, engineers, designers, and product thinkers who care about independent journalism. Open roles are listed on our careers portal.',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    body: 'News tips: tips@washingtonpost-clone.example.com. Advertising: ads@washingtonpost-clone.example.com. Reader support: help@washingtonpost-clone.example.com.',
  },
  {
    id: 'ethics',
    title: 'Ethics Policy',
    body: 'We report without fear or favor. Our journalists avoid conflicts of interest, disclose relevant relationships, and never accept gifts or favors from sources.',
  },
  {
    id: 'corrections',
    title: 'Corrections',
    body: 'When we get something wrong, we correct it promptly and transparently. Corrections appear at the foot of the article with a timestamp.',
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    body: 'By using this site you agree to our terms: content is for personal, non-commercial use; accounts must not be shared abusively; we may update these terms with notice.',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    body: 'We collect the minimum data needed to run the site — reading preferences, newsletter choices, and account details — and never sell personal information.',
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    body: 'We use essential cookies for sign-in and preferences, plus optional analytics cookies you can decline. Manage choices in your browser settings.',
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    body: 'We aim for WCAG 2.2 AA: keyboard-navigable pages, visible focus, reduced-motion support, captions on video, and screen-reader-tested templates.',
  },
];

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
              { name: 'About Us', item: '/about' },
            ]),
          ),
        }}
      />
      <main id="main-content" className="wp-container py-6 md:py-8 max-w-3xl">
        <Breadcrumbs items={[{ label: 'About Us', href: '/about' }]} />
        <p className="kicker text-wp-red mb-1">About</p>
        <h1 className="headline text-4xl md:text-5xl mb-3">About Us</h1>
        <p className="dek text-lg text-wp-gray mb-8">
          Independent journalism since 1877 — &ldquo;Democracy Dies in Darkness.&rdquo;
        </p>
        <div className="space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-heading`} className="scroll-mt-24">
              <h2 id={`${s.id}-heading`} className="headline text-2xl mb-2">
                {s.title}
              </h2>
              <p className="font-serif text-wp-ink leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
