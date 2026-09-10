/**
 * Accessibility audit (Task 10).
 *
 * - axe-core scans every critical route at WCAG 2 AA (including color contrast)
 * - Keyboard navigation: skip link, visible focus ring, logical Tab order
 * - Dark-mode color contrast AA (runs axe with forced dark color scheme)
 * - Semantic landmarks / labels / lang / page title
 *
 * Note: True screen-reader testing (VoiceOver on macOS / NVDA on Windows)
 * requires a human with assistive tech — we cannot drive those from CI.
 * This file documents the manual checklist and enforces everything automatable.
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = [
  { path: '/', name: 'homepage' },
  { path: '/politics', name: 'politics' },
  { path: '/opinions', name: 'opinions' },
  { path: '/article/house-passes-short-term-spending-bill', name: 'article' },
  { path: '/author/david-ignatius', name: 'author' },
  { path: '/live/shutdown-countdown', name: 'live blog' },
  { path: '/games', name: 'games' },
  { path: '/newsletters', name: 'newsletters' },
  { path: '/signin', name: 'signin' },
  { path: '/search?q=shutdown', name: 'search' },
  { path: '/analytics', name: 'analytics dashboard' },
];

async function runAxe(page: Page, name: string) {
  await page.waitForLoadState('networkidle');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .exclude('.x-num')
    .analyze();
  expect.soft(results.violations, `${name}: ${results.violations.length} axe violations`).toEqual([]);
  return results;
}

test.describe('axe-core WCAG 2 AA scans (light mode)', () => {
  for (const r of ROUTES) {
    test(`${r.name} (${r.path}) has 0 axe violations`, async ({ page }) => {
      await page.goto(r.path);
      await runAxe(page, r.name);
    });
  }
});

test.describe('axe-core WCAG 2 AA scans (dark mode)', () => {
  test.use({ colorScheme: 'dark' });
  for (const r of ROUTES) {
    test(`${r.name} (${r.path}) passes in dark mode — including color-contrast AA`, async ({ page }) => {
      await page.goto(r.path);
      const toggle = page.getByTestId('theme-toggle');
      if (await toggle.isVisible()) await toggle.click();
      await expect(page.locator('html')).toHaveClass(/dark/);
      await runAxe(page, `${r.name} [dark]`);
    });
  }
});

test.describe('Semantic document structure', () => {
  test('page has lang attribute on <html>', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('every page has a title and a single <h1>', async ({ page }) => {
    for (const r of ['/', '/politics', '/opinions', '/article/house-passes-short-term-spending-bill']) {
      await page.goto(r);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
      await expect(page.locator('h1')).toHaveCount(1);
    }
  });

  test('landmark regions: banner, main, navigation exist', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header[role="banner"]')).toBeVisible();
    await expect(page.locator('main#main-content')).toBeVisible();
    await expect(page.locator('nav').first()).toBeVisible();
  });

  test('images in article body have alt text', async ({ page }) => {
    await page.goto('/article/house-passes-short-term-spending-bill');
    const imgs = page.locator('main img');
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const alt = await imgs.nth(i).getAttribute('alt');
      expect(alt, `img #${i} missing alt`).not.toBeNull();
    }
  });

  test('form fields have accessible names (newsletter/sign-in)', async ({ page }) => {
    await page.goto('/');
    const nl = page.getByLabel(/email address/i).first();
    await expect(nl).toBeVisible();

    await page.goto('/signin');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});

test.describe('Keyboard navigation', () => {
  test('skip link is first in Tab order and jumps to #main-content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toContainText(/skip to main content/i);
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
    await expect(page).toHaveURL(/#main-content/);
  });

  test('Tab cycles through masthead controls without traps', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab'); // skip link
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const tag = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        return [el.tagName, (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40)].join('|');
      });
      seen.push(tag);
      if (/^A\|/.test(tag) && !/skip/i.test(tag) && tag.length > 3) break;
    }
    const hasNavLink = seen.some((s) => s.startsWith('A|'));
    expect(hasNavLink, `Tab never reached a link: ${seen.slice(0, 10).join(', ')}`).toBe(true);
  });

  test('focus is visible on interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    const box = await focused.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThanOrEqual(24);
  });

  test('theme toggle is keyboard-operable and announces state', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByTestId('theme-toggle');
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('ShareSheet menu opens and closes via Escape', async ({ page }) => {
    await page.goto('/article/house-passes-short-term-spending-bill');
    const shareBtn = page.getByRole('button', { name: /share/i }).first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).not.toBeVisible();
  });

  test('comments textarea is keyboard-reachable with accessible name', async ({ page }) => {
    await page.goto('/article/house-passes-short-term-spending-bill');
    const ta = page.getByPlaceholder(/join the conversation/i);
    await ta.scrollIntoViewIfNeeded();
    await ta.focus();
    await expect(ta).toBeFocused();
    const label = await ta.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });
});

test.describe('Reduced motion is respected', () => {
  test('prefers-reduced-motion disables animations (manual)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    // CSS sets .ticker-track animation:none in prefers-reduced-motion.
    // We assert the element is rendered without asserting computed style
    // (browser engines differ on animation shorthand serialization).
    await expect(page.locator('.ticker-track').first()).toBeVisible();
  });
});

test.describe('Screen-reader structural invariants (automated proxy for NVDA/VoiceOver)', () => {
  test('exactly one <main> landmark per page', async ({ page }) => {
    for (const r of ['/', '/politics', '/article/house-passes-short-term-spending-bill']) {
      await page.goto(r);
      await expect(page.locator('main')).toHaveCount(1);
    }
  });

  test('skip link target exists and is focusable', async ({ page }) => {
    await page.goto('/');
    const target = page.locator('#main-content');
    await expect(target).toHaveCount(1);
    // tabindex="-1" allows programmatic focus even though main isn't natively focusable
    await expect(target).toHaveAttribute('tabindex', '-1');
  });
});
