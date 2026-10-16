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
    // Build workers do not serve sessions or mutations. Never bypass validation
    // with a deployment flag at request-serving runtime.
    if (process.env.NEXT_PHASE !== 'phase-production-build') {
      const { validateRuntimeConfig } = await import('./lib/security-config');
      validateRuntimeConfig();
      if (process.env.NODE_ENV === 'production') {
        const { database } = await import('./lib/storage');
        const db=database();
        const role=await db.query("SELECT current_setting('is_superuser') AS superuser");
        if(role.rows[0].superuser==='on') throw new Error('Runtime database role must not be superuser');
        await db.query('SELECT 1 FROM app_documents,security_audit,security_limits,security_leases LIMIT 0');
      }
    }
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Captures errors from nested React Server Components.
export const onRequestError = Sentry.captureRequestError;
