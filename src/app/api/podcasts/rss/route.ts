import { NextResponse } from 'next/server';
import { EPISODES } from '@/lib/podcast';

// No edge runtime: Next.js ignores force-static on edge routes; keep this
// feed prerendered at build time on the default Node.js runtime.
export const dynamic = 'force-static';
export const revalidate = 600;

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c] as string));
}

/**
 * RSS 2.0 feed for the Post Reports podcast. Feed validators & podcast apps
 * (Apple Podcasts, Pocket Casts, Overcast) can subscribe to this URL.
 */
export function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://wapo.example.com';
  const items = EPISODES.map((ep) => `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${base}/podcasts</link>
      <description>${escapeXml(ep.description)}</description>
      <guid isPermaLink="false">${escapeXml(ep.id)}</guid>
      <pubDate>${new Date(ep.date).toUTCString()}</pubDate>
      <enclosure url="${escapeXml(ep.url)}" length="0" type="audio/mpeg" />
      <itunes:duration>${escapeXml(ep.durationLabel)}</itunes:duration>
      ${ep.author ? `<itunes:author>${escapeXml(ep.author)}</itunes:author>` : ''}
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Post Reports</title>
    <link>${base}/podcasts</link>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} The Washington Post</copyright>
    <description>The Washington Post's flagship daily news podcast. Twenty minutes, every weekday.</description>
    <itunes:author>The Washington Post</itunes:author>
    <itunes:explicit>no</itunes:explicit>
    <itunes:image href="${base}/favicon.png" />
    <image>
      <url>${base}/favicon.png</url>
      <title>Post Reports</title>
      <link>${base}/podcasts</link>
    </image>
    ${items}
  </channel>
</rss>`;
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
    },
  });
}
