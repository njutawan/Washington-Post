import { describe, it, expect } from 'vitest';
import { absoluteUrl, articleMetadata, siteMetadata, articleJsonLd } from '@/lib/seo';
import { getAllArticles } from '@/lib/data';

describe('seo helpers', () => {
  it('absoluteUrl concatenates correctly', () => {
    expect(absoluteUrl('/politics')).toMatch(/\/politics$/);
    expect(absoluteUrl('politics')).toMatch(/\/politics$/);
  });

  it('siteMetadata contains title and openGraph', () => {
    const meta = siteMetadata();
    expect(meta.title).toBeDefined();
    expect(meta.openGraph).toBeDefined();
    expect(meta.twitter).toBeDefined();
    expect(meta.robots).toBeDefined();
  });

  it('articleMetadata produces OG article metadata for an article', () => {
    const a = getAllArticles()[0];
    const meta = articleMetadata(a);
    expect(meta.title).toBe(a.title);
    expect(meta.openGraph).toBeDefined();
    expect((meta.openGraph as any).type).toBe('article');
  });

  it('articleJsonLd produces valid NewsArticle schema', () => {
    const a = getAllArticles()[0];
    const ld = articleJsonLd(a) as any;
    expect(ld['@type']).toBe('NewsArticle');
    expect(ld.headline).toBe(a.title);
    expect(ld.publisher.name).toBeTruthy();
  });
});
