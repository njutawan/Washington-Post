import { NextResponse } from 'next/server';
import { getAuthorBySlug, getArticlesByAuthor } from '@/lib/data';
import { absoluteUrl } from '@/lib/seo';

export const runtime = 'edge';
export const dynamic = 'force-static';
export const revalidate = 600;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  const articles = getArticlesByAuthor(slug).slice(0, 25);
  const now = new Date().toUTCString();

  const channelLink = absoluteUrl(`/author/${slug}`);
  const title = author
    ? `${author.name} — ${SITE_NAME()}`
    : `Author — The Washington Post`;
  const desc = author?.bio || `Articles by ${author?.name || 'this writer'}.`;

  const items = articles.map((a) => {
    const link = absoluteUrl(`/article/${a.slug}`);
    const descHtml =
      (a.dek ? escapeXml(a.dek) + ' ' : '') +
      (a.image ? `<img src="${a.image}" alt="" /><br/>` : '');
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${descHtml}</description>
      ${a.byline ? `<author>noreply@washingtonpost-clone.example.com (${escapeXml(a.byline.replace(/^By\s+/i, ''))})</author>` : ''}
      ${a.category ? `<category>${escapeXml(a.category)}</category>` : ''}
      <pubDate>${now}</pubDate>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${channelLink}</link>
    <description>${escapeXml(desc)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${absoluteUrl(`/api/feed/author/${slug}`)}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${absoluteUrl('/favicon.png')}</url>
      <title>${escapeXml(author?.name || 'Author')}</title>
      <link>${channelLink}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
    },
  });
}

function SITE_NAME() { return 'The Washington Post'; }
