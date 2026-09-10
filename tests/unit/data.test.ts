import { describe, it, expect } from 'vitest';
import {
  getAllArticles,
  getArticleBySlug,
  getArticlesBySection,
  getRelatedArticles,
  getSectionBySlug,
  topNav,
  subNav,
  columnists,
  theSeven,
} from '@/lib/data';

describe('data module', () => {
  it('getAllArticles returns a non-empty array with required fields', () => {
    const all = getAllArticles();
    expect(all.length).toBeGreaterThan(20);
    for (const a of all) {
      expect(a).toHaveProperty('id');
      expect(a).toHaveProperty('slug');
      expect(a).toHaveProperty('title');
      expect(typeof a.slug).toBe('string');
      expect(a.slug.length).toBeGreaterThan(0);
    }
  });

  it('getArticleBySlug returns undefined for missing slug', () => {
    expect(getArticleBySlug('no-such-article-xyz')).toBeUndefined();
  });

  it('getArticleBySlug returns the same article as found in getAllArticles', () => {
    const first = getAllArticles()[0];
    const found = getArticleBySlug(first.slug);
    expect(found).toBeDefined();
    expect(found?.id).toBe(first.id);
  });

  it('getArticlesBySection returns non-empty array for major sections', () => {
    expect(getArticlesBySection('politics').length).toBeGreaterThan(0);
    expect(getArticlesBySection('world').length).toBeGreaterThan(0);
    expect(getArticlesBySection('sports').length).toBeGreaterThan(0);
    // Unknown section falls back to first 12 articles
    expect(getArticlesBySection('nonexistent-slug').length).toBeGreaterThan(0);
  });

  it('getRelatedArticles excludes the current article', () => {
    const all = getAllArticles();
    const current = all[0];
    const related = getRelatedArticles(current, 3);
    expect(related.length).toBeLessThanOrEqual(3);
    for (const r of related) {
      expect(r.slug).not.toBe(current.slug);
    }
  });

  it('topNav contains expected top-level sections', () => {
    const labels = topNav.map((n) => n.slug);
    expect(labels).toContain('politics');
    expect(labels).toContain('world');
    expect(labels).toContain('business');
    expect(labels).toContain('sports');
  });

  it('getSectionBySlug resolves both topNav and subNav entries', () => {
    expect(getSectionBySlug('politics')).toBeDefined();
    expect(getSectionBySlug('newsletters')?.label).toBe('Newsletters');
    expect(getSectionBySlug('nonexistent')).toBeUndefined();
  });

  it('columnists have avatar/name/slug', () => {
    expect(columnists.length).toBeGreaterThan(0);
    for (const o of columnists) {
      expect(o).toHaveProperty('id');
      expect(o).toHaveProperty('name');
      expect(o).toHaveProperty('avatar');
    }
  });

  it('theSeven contains exactly seven items', () => {
    expect(theSeven.length).toBe(7);
    for (const s of theSeven) {
      expect(s).toHaveProperty('title');
    }
  });

  it('subNav contains newsletters', () => {
    expect(subNav.find((s) => s.slug === 'newsletters')).toBeDefined();
  });
});
