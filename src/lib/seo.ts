import type { Metadata } from 'next';
import { getAllArticles, type Article, type Author } from './data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://washingtonpost-clone.example.com';
const SITE_NAME = 'The Washington Post';
const DEFAULT_OG_IMAGE = '/favicon.png';

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function siteMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${SITE_NAME} - Breaking news and latest headlines, U.S. news, world news, and video`,
      template: `%s - ${SITE_NAME}`,
    },
    description:
      'Breaking news and analysis on politics, business, world national news, entertainment more. In-depth DC, Virginia, Maryland news coverage including traffic, weather, crime, education, restaurant reviews and more.',
    keywords: [
      'news', 'politics', 'breaking news', 'Washington Post', 'US news', 'world news',
      'business', 'tech', 'sports', 'opinion', 'investigations', 'Washington DC', 'authors', 'columnists',
    ],
    authors: [{ name: 'The Washington Post Clone' }],
    publisher: SITE_NAME,
    alternates: { canonical: '/' },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url: SITE_URL,
      title: `${SITE_NAME} - Breaking news and latest headlines`,
      description:
        'Breaking news and analysis on politics, business, world national news, entertainment and more.',
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@washingtonpost',
      creator: '@washingtonpost',
      title: `${SITE_NAME} - Breaking news and latest headlines`,
      description: 'Breaking news and analysis from The Washington Post.',
      images: [DEFAULT_OG_IMAGE],
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      ],
      shortcut: '/favicon.ico',
      apple: '/favicon.png',
    },
    manifest: '/site.webmanifest',
    category: 'news',
  };
}

export function articleMetadata(article: Article): Metadata {
  const url = absoluteUrl(`/article/${article.slug}`);
  const image = article.image || DEFAULT_OG_IMAGE;
  const headline = article.title;
  const description = article.dek || `${article.byline || ''} — Read more at ${SITE_NAME}.`;
  return {
    title: headline,
    description,
    alternates: { canonical: `/article/${article.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: headline,
      description,
      publishedTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
      section: article.category,
      authors: article.byline ? [article.byline.replace(/^By\s+/, '')] : undefined,
      images: [{ url: image, width: 1400, height: 900, alt: headline }],
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: headline,
      description,
      images: [image],
    },
  };
}

export function sectionMetadata(slug: string, label: string, tagline: string): Metadata {
  return {
    title: `${label} - Latest News & Analysis`,
    description: tagline,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      type: 'website',
      url: absoluteUrl(`/${slug}`),
      title: `${label} - ${SITE_NAME}`,
      description: tagline,
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: label }],
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${label} - ${SITE_NAME}`,
      description: tagline,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export function authorMetadata(author: Author, articleCount: number): Metadata {
  const url = absoluteUrl(`/author/${author.slug}`);
  const title = `${author.name} — ${author.title || (author.isColumnist ? 'Columnist' : 'Staff writer')} | ${SITE_NAME}`;
  const description = author.bio
    ? `${author.name}. ${author.bio} Read ${articleCount} article${articleCount === 1 ? '' : 's'} by ${author.name} on ${SITE_NAME}.`
    : `Read ${articleCount} article${articleCount === 1 ? '' : 's'} by ${author.name} on ${SITE_NAME}.`;
  return {
    title,
    description,
    alternates: { canonical: `/author/${author.slug}` },
    openGraph: {
      type: 'profile',
      url,
      title: `${author.name} | ${SITE_NAME}`,
      description,
      images: author.avatar ? [{ url: author.avatar, width: 400, height: 400, alt: author.name }] : undefined,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary',
      title: `${author.name} | ${SITE_NAME}`,
      description,
      images: author.avatar ? [author.avatar] : [DEFAULT_OG_IMAGE],
    },
  };
}

export function articleJsonLd(article: Article) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.dek,
    image: article.image ? [article.image] : undefined,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: article.byline
      ? [
          {
            '@type': 'Person',
            name: article.byline.replace(/^By\s+/, '').split(' and ')[0],
          },
        ]
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/favicon.png') },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(`/article/${article.slug}`) },
    inLanguage: 'en-US',
    articleSection: article.category,
  };
}

export function authorJsonLd(author: Author, articles: Article[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: absoluteUrl(`/author/${author.slug}`),
    image: author.avatar,
    jobTitle: author.title,
    description: author.bio,
    sameAs: author.twitter ? [`https://twitter.com/${author.twitter.replace('@', '')}`] : undefined,
    worksFor: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: articles.slice(0, 5).map((a) => ({
      '@type': 'NewsArticle',
      headline: a.title,
      url: absoluteUrl(`/article/${a.slug}`),
    })),
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.png'),
    description:
      'The Washington Post provides breaking news and analysis on politics, business, world news, and more.',
  };
}

export function websiteJsonLd() {
  const articles = getAllArticles().slice(0, 10);
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(`/article/${a.slug}`),
        name: a.title,
      })),
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; item?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.item ? absoluteUrl(it.item) : undefined,
    })),
  };
}
