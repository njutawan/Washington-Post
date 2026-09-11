import { NextResponse } from 'next/server';
import { getAllArticles } from '@/lib/data';
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

export async function GET() {
  const articles = getAllArticles().slice(0, 30);
  const now = new Date().toUTCString();

  const items = articles.map((a) => {
    const link = absoluteUrl(`/article/${a.slug}`);
    // Escape the text FIRST, then append the <img> tag — escaping the whole
    // string would turn the intentionally-injected tag into literal text
    // (`&lt;img …&gt;`) in RSS readers. `a.image` comes from in-repo data
    // (trusted), not user input.
    const text = escapeXml(a.dek || '');
    const desc = (text ? `${text} ` : '') + (a.image ? `<img src="${a.image}" alt="" /><br/>` : '');
    return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${desc}</description>
      ${a.byline ? `<author>noreply@washingtonpost-clone.example.com (${escapeXml(a.byline.replace(/^By\s+/, ''))})</author>` : ''}
      ${a.category ? `<category>${escapeXml(a.category)}</category>` : ''}
      <pubDate>${now}</pubDate>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Washington Post — Top Stories</title>
    <link>${absoluteUrl('/')}</link>
    <description>Breaking news and analysis on politics, business, world national news, entertainment and more.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${absoluteUrl('/api/feed')}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${absoluteUrl('/favicon.png')}</url>
      <title>The Washington Post</title>
      <link>${absoluteUrl('/')}</link>
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
