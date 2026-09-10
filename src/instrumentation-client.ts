/**
 * Client-side instrumentation for Sentry (Next.js 15 / Turbopack-friendly).
 * The SDK recommends moving sentry.client.config.ts logic here so it works
 * with Turbopack; both entry points are kept for backwards compatibility.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    Sentry.browserTracingIntegration(),
  ],
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Automatically track client-side route navigations as performance spans
  beforeSend: (event) => event,
});

// Required hook for Next.js navigation instrumentation (since Sentry v9)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
