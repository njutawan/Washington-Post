import { redactTelemetry } from './lib/security-log';
/**
 * Client-side instrumentation for Sentry (Next.js 15 / Turbopack-friendly).
 * The SDK recommends moving sentry.client.config.ts logic here so it works
 * with Turbopack; both entry points are kept for backwards compatibility.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  sendDefaultPii: false,
  beforeSend: (event) => redactTelemetry(event),
  beforeSendTransaction: (event) => redactTelemetry(event),
  beforeBreadcrumb: (breadcrumb) => redactTelemetry(breadcrumb),
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  debug: false,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  integrations: [

    Sentry.browserTracingIntegration(),
  ],
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Automatically track client-side route navigations as performance spans

});

// Required hook for Next.js navigation instrumentation (since Sentry v9)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
