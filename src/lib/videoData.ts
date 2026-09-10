/**
 * Video library data. Each video maps to a public-domain / sample MP4 URL so
 * the /video/[slug] page can render a real <video> player. In production these
 * URLs would point to Mux/Cloudfront/Brightcove signed URLs; here we use
 * Google's publicly hosted sample MP4s (gtv-videos-bucket) which are safe for
 * demos and carry no attribution requirement.
 */
export type Video = {
  id: string;
  slug: string;
  title: string;
  description: string;
  byline: string;
  category: string;
  categorySlug: string;
  duration: string;
  thumbnail: string;
  src: string;
  captionsSrc?: string;
  publishedAt: string;
  related?: string[]; // article slugs
};

// Use multiple distinct sample MP4s so different videos play different clips.
const BUCKET = 'https://storage.googleapis.com/gtv-videos-bucket/sample';

export const VIDEOS: Video[] = [
  {
    id: 'v1',
    slug: 'congress-shutdown',
    title: 'Inside the shutdown deadline: how Congress got here',
    description:
      'Washington Post reporters break down the final hours of negotiation on Capitol Hill as lawmakers raced to pass a short-term spending bill before the midnight deadline.',
    byline: 'The Video Desk',
    category: 'Politics',
    categorySlug: 'politics',
    duration: '4:32',
    thumbnail: 'https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=1280&q=80',
    src: `${BUCKET}/BigBuckBunny.mp4`,
    publishedAt: '2026-09-10T18:00:00Z',
    related: ['house-passes-short-term-spending-bill', 'senate-spending-vote-saturday'],
  },
  {
    id: 'v2',
    slug: 'fed-rate',
    title: 'Fed signals rate cut — what it means for your wallet',
    description:
      'Rachel Siegel explains how the Federal Reserve\u2019s latest decision could move mortgage rates, credit card APRs and savings yields in the months ahead.',
    byline: 'Rachel Siegel',
    category: 'Business',
    categorySlug: 'business',
    duration: '2:18',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1280&q=80',
    src: `${BUCKET}/ElephantsDream.mp4`,
    publishedAt: '2026-09-10T15:30:00Z',
    related: ['fed-inflation-mistake', 'small-business-insurance'],
  },
  {
    id: 'v3',
    slug: 'eiffel',
    title: 'Eiffel Tower restrictions draw outrage in Paris',
    description:
      'Parisians and tourists react after the landmark restricted access for female staff during a private event hosted by a Hindu religious leader.',
    byline: 'World Desk',
    category: 'World',
    categorySlug: 'world',
    duration: '1:47',
    thumbnail: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1280&q=80',
    src: `${BUCKET}/ForBiggerBlazes.mp4`,
    publishedAt: '2026-09-10T12:00:00Z',
    related: ['eiffel-tower-hindu-group'],
  },
  {
    id: 'v4',
    slug: 'renoir-heist',
    title: 'Moment Renoir heist suspect is taken into custody',
    description:
      'French police released security-camera footage showing the arrest of a man suspected in the theft of two Renoir paintings from a museum outside Nice.',
    byline: 'World Desk',
    category: 'World',
    categorySlug: 'world',
    duration: '0:59',
    thumbnail: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=1280&q=80',
    src: `${BUCKET}/ForBiggerEscapes.mp4`,
    publishedAt: '2026-09-10T10:15:00Z',
    related: ['renoir-paintings-missing-french-museum-heist'],
  },
  {
    id: 'v5',
    slug: 'commanders-sideline',
    title: 'From the sideline: Commanders chase first 2-0 start in years',
    description:
      'Barry Svrluga breaks down what the Commanders\u2019 Week 1 win tells us about the team\u2019s playoff chances this season.',
    byline: 'Barry Svrluga',
    category: 'Sports',
    categorySlug: 'sports',
    duration: '3:04',
    thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1280&q=80',
    src: `${BUCKET}/ForBiggerFun.mp4`,
    publishedAt: '2026-09-10T09:00:00Z',
    related: ['commanders-real-football', 'nfl-week-2-picks'],
  },
  {
    id: 'v6',
    slug: 'cold-plunge-science',
    title: 'Are cold plunges actually good for you?',
    description:
      'Well+Being reporters review the latest research on ice baths, cold showers and what the science actually says about recovery and longevity.',
    byline: 'Kelyn Soong',
    category: 'Well+Being',
    categorySlug: 'wellbeing',
    duration: '5:12',
    thumbnail: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1280&q=80',
    src: `${BUCKET}/ForBiggerJoyrides.mp4`,
    publishedAt: '2026-09-09T16:30:00Z',
    related: ['cold-plunge-benefits', 'stop-stretching-before-running'],
  },
  {
    id: 'v7',
    slug: 'ai-valuations-bubble',
    title: 'Why AI startup valuations are starting to look like 2021',
    description:
      'Gerrit De Vynck on the flood of late-stage capital into unprofitable AI companies and why some investors are warning of a correction.',
    byline: 'Gerrit De Vynck',
    category: 'Tech',
    categorySlug: 'tech',
    duration: '6:45',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1280&q=80',
    src: `${BUCKET}/ForBiggerMeltdowns.mp4`,
    publishedAt: '2026-09-09T13:00:00Z',
    related: ['ai-startup-valuations-2021', 'iphone-subscriptions'],
  },
  {
    id: 'v8',
    slug: 'telluride-holmes-doc',
    title: 'Telluride debut: the new Elizabeth Holmes documentary',
    description:
      'Ann Hornaday reviews \u201cBad Blood: The Final Chapter,\u201d which premiered over the weekend and is already drawing Oscar buzz.',
    byline: 'Ann Hornaday',
    category: 'Style',
    categorySlug: 'style',
    duration: '3:27',
    thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1280&q=80',
    src: `${BUCKET}/Sintel.mp4`,
    publishedAt: '2026-09-09T11:00:00Z',
    related: ['elizabeth-holmes-documentary'],
  },
];

export function getVideoBySlug(slug: string): Video | null {
  return VIDEOS.find((v) => v.slug === slug) || null;
}

export function getAllVideos(): Video[] {
  return VIDEOS;
}
