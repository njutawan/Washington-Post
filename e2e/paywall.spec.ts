import { test, expect } from '@playwright/test';

test.describe('Paywall flow', () => {
  test.beforeEach(async ({ page }) => {
    // Reset reading state before each test (anonymous, no articles read)
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('paywall triggers after 3 free articles and modal offers /subscribe link', async ({ page }) => {
    const articles = [
      '/article/house-passes-short-term-spending-bill',
      '/article/crypto-empire-collapse',
      '/article/renoir-paintings-missing-french-museum-heist',
      '/article/oil-rockets-toward-100-per-barrel',
    ];
    // Visit first three articles (free)
    for (let i = 0; i < 3; i++) {
      await page.goto(articles[i]!);
      await expect(page.locator('h1').first()).toBeVisible();
    }
    // Fourth article — paywall modal should open
    await page.goto(articles[3]!);
    const modal = page.getByRole('dialog', { name: /free stories/i });
    await expect(modal).toBeVisible();
    // Subscribe link points to /subscribe
    await expect(modal.getByRole('link', { name: /subscribe now/i })).toHaveAttribute('href', /\/subscribe/);
    // Sign in link present
    await expect(modal.getByRole('link', { name: /already a subscriber/i })).toBeVisible();
  });

  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: /skip to main content/i });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});
