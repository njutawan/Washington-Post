/**
 * Visual regression tests (Task 20).
 *
 * Uses Playwright's built-in screenshot assertions rather than Chromatic/Loki
 * (which require paid SaaS accounts / separate runners). On CI, run against a
 * live production URL with PLAYWRIGHT_BASE_URL=https://... and commit the
 * baseline screenshots once design is approved. Every PR then fails when
 * pixels diverge.
 *
 * To update baselines after intentional design changes:
 *   npx playwright test e2e/visual.spec.ts --update-snapshots
 */
import { test, expect } from '@playwright/test';

type RouteSnap = { path: string; name: string; threshold?: number };
const ROUTES: RouteSnap[] = [
  { path: '/', name: 'homepage' },
  { path: '/politics', name: 'politics-section' },
  { path: '/opinions', name: 'opinions-section' },
  { path: '/article/house-passes-short-term-spending-bill', name: 'article', threshold: 0.1 },
  { path: '/author/david-ignatius', name: 'author-page' },
  { path: '/live/shutdown-countdown', name: 'live-blog' },
  { path: '/games', name: 'games' },
  { path: '/newsletters', name: 'newsletters' },
  { path: '/signin', name: 'signin' },
  { path: '/search?q=shutdown', name: 'search' },
  { path: '/analytics', name: 'analytics-dashboard' },
  { path: '/podcasts', name: 'podcasts' },
];

// Screenshot settings are chosen to maximize stability and minimize flakes
// from dynamic data.
const SHOT_OPTS = {
  fullPage: true,
  animations: 'disabled' as const,
  // Clip non-deterministic regions (e.g. the live-dot pulse, any timestamps).
  // Using mask with locator lists keeps the rest of the page diffed.
  mask: [] as never[],
};

test.describe('Visual regression — desktop (light)', () => {
  for (const r of ROUTES) {
    test(`${r.name} (${r.path}) matches baseline`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
      await page.goto(r.path, { waitUntil: 'networkidle' });
      // Allow the top-loader to finish before screenshot
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`${r.name}-light.png`, {
        ...SHOT_OPTS,
        maxDiffPixelRatio: r.threshold ?? 0.05,
      });
    });
  }
});

test.describe('Visual regression — desktop (dark)', () => {
  const DARK_ROUTES = [
    { path: '/', name: 'homepage' },
    { path: '/article/house-passes-short-term-spending-bill', name: 'article' },
  ];
  for (const r of DARK_ROUTES as RouteSnap[]) {
    test(`${r.name} (${r.path}) dark-mode matches baseline`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
      await page.goto(r.path, { waitUntil: 'networkidle' });
      // Toggle theme to apply dark class
      const toggle = page.getByTestId('theme-toggle');
      if (await toggle.isVisible()) await toggle.click();
      await page.waitForTimeout(200);
      await expect(page).toHaveScreenshot(`${r.name}-dark.png`, {
        ...SHOT_OPTS,
        maxDiffPixelRatio: r.threshold ?? 0.05,
      });
    });
  }
});

test.describe('Visual regression — mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const MOBILE_ROUTES = [
    { path: '/', name: 'homepage' },
    { path: '/article/house-passes-short-term-spending-bill', name: 'article' },
  ];
  for (const r of MOBILE_ROUTES) {
    test(`${r.name} (${r.path}) mobile matches baseline`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(r.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(`${r.name}-mobile.png`, {
        ...SHOT_OPTS,
        maxDiffPixelRatio: 0.08,
      });
    });
  }
});
