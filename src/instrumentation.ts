/**
 * Sentry server-side instrumentation hook for Next.js App Router.
 * Imports Sentry so server-side errors and performance spans are captured
 * automatically (including route handlers and SSR errors).
 *
 * Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Captures errors from nested React Server Components.
export const onRequestError = Sentry.captureRequestError;
