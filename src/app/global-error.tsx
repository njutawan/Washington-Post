'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Global error boundary for the App Router. Captures client-side runtime errors
 * to Sentry and renders a fallback UI.
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/global-error
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Georgia, serif', background: '#f7f3ec', color: '#111' }}>
        <div style={{ maxWidth: 640, margin: '6rem auto', padding: '0 1.5rem' }}>
          <p style={{ font: 'bold 11px/1 "Franklin Gothic", sans-serif', letterSpacing: 2, textTransform: 'uppercase', color: '#b80f2a' }}>
            Something went wrong
          </p>
          <h1 style={{ font: 'bold 36px/1.2 Georgia, serif', margin: '0.75rem 0 1rem' }}>
            We hit an error loading this page.
          </h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#444' }}>
            Our engineers have been notified. You can try reloading, or head back to the home page.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => reset()}
              style={{
                background: '#111', color: '#fff', border: 'none', padding: '0.75rem 1.25rem',
                font: 'bold 11px/1 "Franklin Gothic", sans-serif', letterSpacing: 2, textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <Link href="/" style={{
              display: 'inline-block', padding: '0.75rem 1.25rem', border: '2px solid #111', color: '#111',
              font: 'bold 11px/1 "Franklin Gothic", sans-serif', letterSpacing: 2, textTransform: 'uppercase',
              textDecoration: 'none',
            }}>
              Home
            </Link>
          </div>
          {error.digest && (
            <p style={{ marginTop: '2rem', fontSize: 12, color: '#888', fontFamily: 'monospace' }}>
              Error ID: {error.digest}
            </p>
          )}
          {/* Fallback NextError component for dev details */}
          {process.env.NODE_ENV !== 'production' && (
            <div style={{ marginTop: '2rem' }}>
              <NextError statusCode={500} />
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
