'use client';

import { useState } from 'react';

type Props = {
  newsletter?: string;
  blurb?: string;
};

/**
 * Inline newsletter signup (inserted mid-article in the longform body).
 * Matches the WaPo style: bold header, email input, black subscribe button,
 * privacy note.
 */
export default function InlineNewsletter({
  newsletter = 'The Morning Mix',
  blurb = 'A daily digest of what Washington is talking about — in your inbox before sunrise.',
}: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/.+@.+\..+/.test(email)) {
      setStatus('err');
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newsletter }),
      });
      if (!res.ok) throw new Error('bad');
      setStatus('ok');
    } catch {
      // Fall back to optimistic success (the endpoint is a stub in demo mode).
      setStatus('ok');
    }
  };

  return (
    <div className="newsletter-inline not-prose" aria-label={`Sign up for ${newsletter}`}>
      <div className="flex items-center justify-center">
        <div className="text-6xl" aria-hidden="true">📬</div>
      </div>
      <div>
        <p className="kicker text-wp-red mb-1">Newsletter</p>
        <h3 className="headline text-xl md:text-2xl leading-tight mb-1">
          Sign up for {newsletter}
        </h3>
        <p className="text-sm font-sans text-wp-gray mb-3">{blurb}</p>
        {status === 'ok' ? (
          <p className="text-sm font-sans text-wp-green font-bold">
            ✓ You&rsquo;re subscribed. Watch your inbox.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              aria-label="Email address"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 border border-wp-black px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-wp-red bg-white"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="bg-wp-black text-white px-5 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition disabled:opacity-50"
            >
              {status === 'loading' ? 'Signing up…' : 'Sign up'}
            </button>
          </form>
        )}
        {status === 'err' && (
          <p className="text-xs text-wp-red font-sans mt-1">Please enter a valid email address.</p>
        )}
        <p className="text-[11px] font-sans text-wp-gray mt-2">
          By signing up you agree to our Terms of Use and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
