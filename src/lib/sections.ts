import type { SectionConfig } from './data';

export type SubSection = {
  slug: string;
  label: string;
  description?: string;
};

export type SectionHierarchy = SectionConfig & {
  slug: string;
  /** Sub-navigation shown horizontally at the top of the section hub. */
  subsections?: SubSection[];
};

/**
 * Section hub data — sub-navigations for major sections. Slugs listed here
 * that are NOT already in topNav/subNav will be created as new pages via the
 * generic [section] route (e.g. /whitehouse, /courts, /ai, etc.).
 */
export const sections: Record<string, SectionHierarchy> = {
  politics: {
    slug: 'politics',
    label: 'Politics',
    tagline: 'Coverage of the White House, Congress, campaigns and political power in Washington.',
    accent: 'wp-red',
    heroImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1400&q=80',
    subsections: [
      { slug: 'whitehouse', label: 'White House', description: 'The Biden administration and West Wing.' },
      { slug: 'congress', label: 'Congress', description: 'The House and Senate.' },
      { slug: 'courts', label: 'Courts', description: 'The Supreme Court and federal judiciary.' },
      { slug: 'policy', label: 'Policy Analysis' },
      { slug: 'elections', label: 'Elections' },
    ],
  },
  business: {
    slug: 'business',
    label: 'Business',
    tagline: 'Markets, economics, companies and the economy that shapes American life.',
    accent: 'wp-ink',
    subsections: [
      { slug: 'markets', label: 'Markets' },
      { slug: 'economy', label: 'Economy' },
      { slug: 'technology', label: 'Technology' },
      { slug: 'personal-finance', label: 'Personal Finance' },
    ],
  },
  tech: {
    slug: 'tech',
    label: 'Technology',
    tagline: 'Silicon Valley, AI, gadgets, platforms and the future of the digital economy.',
    accent: 'wp-ink',
    subsections: [
      { slug: 'ai', label: 'Artificial Intelligence' },
      { slug: 'social-media', label: 'Social Media' },
      { slug: 'gadgets', label: 'Gadgets' },
      { slug: 'cybersecurity', label: 'Cybersecurity' },
    ],
  },
  world: {
    slug: 'world',
    label: 'World',
    tagline: 'International news, analysis and on-the-ground reporting.',
    accent: 'wp-red',
    subsections: [
      { slug: 'europe', label: 'Europe' },
      { slug: 'asia', label: 'Asia' },
      { slug: 'middle-east', label: 'Middle East' },
      { slug: 'americas', label: 'Americas' },
      { slug: 'africa', label: 'Africa' },
    ],
  },
  style: {
    slug: 'style',
    label: 'Style',
    tagline: 'Culture, movies, music, fashion and the arts.',
    accent: 'wp-red',
    subsections: [
      { slug: 'movies', label: 'Movies' },
      { slug: 'music', label: 'Music' },
      { slug: 'television', label: 'Television' },
      { slug: 'books', label: 'Books' },
      { slug: 'art-design', label: 'Art & Design' },
    ],
  },
  sports: {
    slug: 'sports',
    label: 'Sports',
    tagline: 'Coverage of Washington teams and national sports.',
    accent: 'wp-red',
    subsections: [
      { slug: 'commanders', label: 'Commanders' },
      { slug: 'wizards', label: 'Wizards' },
      { slug: 'capitals', label: 'Capitals' },
      { slug: 'nationals', label: 'Nationals' },
      { slug: 'nfl', label: 'NFL' },
      { slug: 'mlb', label: 'MLB' },
    ],
  },
  wellbeing: {
    slug: 'wellbeing',
    label: 'Well+Being',
    tagline: 'Science-backed advice for healthier living.',
    accent: 'wp-link',
    subsections: [
      { slug: 'health', label: 'Health' },
      { slug: 'science', label: 'Science' },
      { slug: 'fitness', label: 'Fitness' },
      { slug: 'food-well', label: 'Food' },
      { slug: 'mindfulness', label: 'Mindfulness' },
    ],
  },
  climate: {
    slug: 'climate',
    label: 'Climate',
    tagline: 'The environment, energy and the changing planet.',
    accent: 'wp-link',
    subsections: [
      { slug: 'weather', label: 'Weather' },
      { slug: 'energy', label: 'Energy' },
      { slug: 'environment', label: 'Environment' },
    ],
  },
  food: {
    slug: 'food',
    label: 'Food',
    tagline: 'Recipes, restaurant reviews, and dining out in D.C.',
    accent: 'wp-red',
    subsections: [
      { slug: 'recipes', label: 'Recipes' },
      { slug: 'restaurants', label: 'Restaurants' },
      { slug: 'drinks', label: 'Drinks' },
    ],
  },
  travel: {
    slug: 'travel',
    label: 'Travel',
    tagline: 'Where to go, what to know, and how to make the most of every trip.',
    accent: 'wp-link',
    subsections: [
      { slug: 'destinations', label: 'Destinations' },
      { slug: 'travel-tips', label: 'Travel Tips' },
      { slug: 'deals', label: 'Deals' },
    ],
  },
  investigations: {
    slug: 'investigations',
    label: 'Investigations',
    tagline: 'Accountability journalism.',
    accent: 'wp-black',
  },
  opinions: {
    slug: 'opinions',
    label: 'Opinions',
    tagline: 'Editorials, columns and letters.',
    accent: 'wp-black',
    subsections: [
      { slug: 'editorials', label: 'Editorials' },
      { slug: 'columns', label: 'Columns' },
      { slug: 'letters', label: 'Letters' },
      { slug: 'guest-opinions', label: 'Guest Opinions' },
    ],
  },
  obituaries: {
    slug: 'obituaries',
    label: 'Obituaries',
    tagline: 'Lives remembered.',
    accent: 'wp-ink',
  },
  advice: {
    slug: 'advice',
    label: 'Advice',
    tagline: 'Ask Amy, Carolyn Hax and more.',
    accent: 'wp-red',
  },
  local: {
    slug: 'local',
    label: 'D.C., Md. & Va.',
    tagline: 'Local news for the Washington region.',
    accent: 'wp-red',
    subsections: [
      { slug: 'dc', label: 'D.C.' },
      { slug: 'maryland', label: 'Maryland' },
      { slug: 'virginia', label: 'Virginia' },
      { slug: 'traffic', label: 'Traffic' },
      { slug: 'weather', label: 'Weather' },
    ],
  },
};

/** Map a sub-section slug back to its parent section label. */
export const subsectionParent: Record<string, { parent: string; label: string }> = {};
for (const [parentSlug, sec] of Object.entries(sections)) {
  for (const sub of sec.subsections || []) {
    subsectionParent[sub.slug] = { parent: parentSlug, label: sub.label };
  }
}
