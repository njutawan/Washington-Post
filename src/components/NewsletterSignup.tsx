'use client';

import { useState } from 'react';
import { track } from '@/lib/track';

export default function NewsletterSignup({ variant = 'inline' }: { variant?: 'inline' | 'large' }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubmitted(true);
      track('newsletter_subscribe', { props: { variant } });
    }
  };

  if (submitted) {
    return (
      <div className={
        variant === 'large'
          ? 'border-2 border-wp-black p-6 bg-wp-light text-center'
          : 'border-t border-wp-border pt-4 text-sm font-sans text-wp-green'
      }>
        <p className="font-bold mb-1 text-wp-black">✓ You\u2019re subscribed</p>
        <p className="text-wp-gray text-xs">
          Thank you for signing up. Watch your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className="border-2 border-wp-black p-6 bg-wp-light">
        <div className="kicker text-wp-red mb-2">The Morning Mix</div>
        <h3 className="headline text-2xl mb-2">Start your day informed.</h3>
        <p className="dek text-sm mb-4">
          The day\u2019s most important news and commentary, delivered to your inbox before sunrise. Every weekday. Free.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="flex-1 px-4 py-3 border border-wp-border bg-white font-serif outline-none focus:border-wp-black text-base"
            aria-label="Email address"
          />
          <button
            type="submit"
            className="bg-wp-black text-white px-6 py-3 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red transition"
          >
            Sign Up
          </button>
        </form>
        <p className="text-xs font-sans text-wp-gray mt-2">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    );
  }

  // Inline variant (for footer)
  return (
    <div>
      <h3 className="kicker text-white mb-2 text-[13px]">Newsletters</h3>
      <p className="text-sm font-sans text-gray-300 mb-3">
        Get the day\u2019s top stories delivered to your inbox each morning.
      </p>
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 text-white placeholder:text-gray-400 text-sm font-sans outline-none focus:border-white"
          aria-label="Email address"
        />
        <button
          type="submit"
          className="bg-white text-black px-4 py-2 font-sans font-bold uppercase text-xs tracking-wider hover:bg-wp-red hover:text-white transition"
        >
          Join
        </button>
      </form>
    </div>
  );
}
