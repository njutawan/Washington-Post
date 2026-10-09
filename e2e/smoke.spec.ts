import { test, expect } from '@playwright/test';

const ROUTES = [
  { path: '/', name: 'homepage', selector: 'h1' },
  { path: '/politics', name: 'politics', selector: 'h1' },
  { path: '/world', name: 'world', selector: 'h1' },
  { path: '/opinions', name: 'opinions', selector: 'h1' },
  { path: '/games', name: 'games', selector: 'h1' },
  { path: '/newsletters', name: 'newsletters', selector: 'h1' },
  { path: '/about', name: 'about', selector: 'h1' },
  { path: '/live/shutdown-countdown', name: 'live blog', selector: 'h1' },
  { path: '/search?q=shutdown', name: 'search', selector: 'main' },
];

test.describe('Smoke tests — critical routes load', () => {
  for (const r of ROUTES) {
    test(`${r.name} (${r.path}) returns 200 and has ${r.selector}`, async ({ page }) => {
      const response = await page.goto(r.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator(r.selector).first()).toBeVisible();
    });
  }
});

test('homepage shows the masthead title', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=The Washington Post').first()).toBeVisible();
});

test('article page renders and shows byline', async ({ page }) => {
  await page.goto('/article/house-passes-short-term-spending-bill');
  const article = page.locator('article').first();
  await expect(article).toBeVisible();
  await expect(article.getByText(/Marianna Sotomayor/i).first()).toBeVisible();
});

test('games page renders mini crossword cells', async ({ page }) => {
  await page.goto('/games');
  // 5x5 grid cells rendered
  await expect(page.locator('.x-cell')).toHaveCount(25);
});

test('404 page renders for unknown route', async ({ page }) => {
  const resp = await page.goto('/this-route-does-not-exist-xyz');
  expect(resp?.status()).toBe(404);
  await expect(page.getByText(/could not be found/i).first()).toBeVisible();
});

test('skip link is focusable (accessibility)', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  await expect(focused).toContainText(/skip/i);
});

test('RSS feed is valid XML', async ({ page }) => {
  const resp = await page.goto('/api/feed');
  expect(resp?.status()).toBe(200);
  const text = await resp!.text();
  expect(text).toContain('<?xml');
  expect(text).toContain('<rss');
  expect(text).toContain('<channel>');
});
