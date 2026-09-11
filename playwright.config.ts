import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // No screenshot baselines are committed yet (visual.spec.ts is designed to
  // run against a live production URL — see its header), so skip it in CI.
  testIgnore: process.env.CI ? ['./visual.spec.ts'] : [],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    // axe-core needs a real viewport for contrast calculations to be accurate
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    // Serve the production build (CI runs `next build` right before tests):
    // static routes are pre-rendered, so page loads are fast. `next dev`
    // compiles each route on first visit and blows the 15-min job timeout.
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile Safari (WebKit) — manual a11y runs ONLY. The iPhone 13 device
    // descriptor uses the WebKit engine, but CI installs Chromium only
    // (.github/workflows/ci.yml), so this project failed EVERY test in CI
    // with "browser executable doesn't exist" (the whole e2e job has never
    // been green for exactly this reason). Excluded from CI runs here;
    // run locally with: npx playwright install webkit && npx playwright test
    ...(process.env.CI
      ? []
      : [
          {
            name: 'mobile-safari',
            use: { ...devices['iPhone 13'] },
            grepInvert: /dark mode/, // color-scheme emulation conflicts with mobile in some versions
          },
        ]),
  ],
});
