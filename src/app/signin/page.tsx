'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';

// When Clerk is configured it owns authentication, so the legacy form hands off
// to Clerk's route instead of showing a second, competing sign-in surface.
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Open-redirect guard (CWE-601): only accept same-origin relative paths.
 * `router.replace('https://evil.com')` performs a full navigation, so an
 * attacker-crafted `?callbackUrl=https://evil.com/phish` would bounce a
 * victim to the attacker's site right after sign-in. Absolute URLs and
 * protocol-relative (`//evil.com`) values are rejected.
 */
function safeCallbackUrl(raw: string | null): string {
  if (typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get('callbackUrl'));
  const { status } = useSession();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already authenticated? Bounce to the callback URL. This must happen in an
  // effect — calling router.replace during render is a React anti-pattern
  // (and triggers the "update during render" warning).
  useEffect(() => {
    // Clerk configured → this legacy page is a pass-through, not a second form.
    if (CLERK_ENABLED) {
      const q = callbackUrl && callbackUrl !== '/' ? `?redirect_url=${encodeURIComponent(callbackUrl)}` : '';
      router.replace(`/sign-in${q}`);
      return;
    }
    if (status === 'authenticated') router.replace(callbackUrl);
  }, [status, callbackUrl, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        name,
        mode,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError(res.error);
      } else {
        router.replace(callbackUrl);
        router.refresh();
      }
    } catch (e: any) {
      setError(e?.message || 'Unable to sign in. Check your credentials or try again later.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-wp-cream flex flex-col">
      <Masthead />
      <main id="main-content" className="wp-container py-8 md:py-16 flex-1">
        <Breadcrumbs items={[{ label: 'Sign in', href: '/signin' }]} />
        <div className="flex items-start justify-center">
          <div className="w-full max-w-md bg-white border-2 border-wp-black p-6 md:p-8">
          <div className="border-b-4 border-wp-black pb-3 mb-6">
            <p className="kicker text-wp-red mb-1">Account</p>
            <h1 className="headline text-3xl">{mode === 'signin' ? 'Sign in' : 'Create your account'}</h1>
            <p className="dek text-sm mt-2">
              {mode === 'signin'
                ? 'Sign in to save articles, comment, and manage your newsletters.'
                : 'Free to join. Takes less than a minute.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-wp-red text-wp-red text-sm font-sans" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="kicker text-wp-black block mb-1">Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-wp-border px-3 py-2.5 font-serif outline-none focus:border-wp-black"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="kicker text-wp-black block mb-1">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-wp-border px-3 py-2.5 font-serif outline-none focus:border-wp-black"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="kicker text-wp-black block mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-wp-border px-3 py-2.5 font-serif outline-none focus:border-wp-black"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={mode === 'signup' ? 15 : 1}
                maxLength={128}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-wp-black text-white py-3 font-sans font-bold uppercase tracking-wider text-sm hover:bg-wp-red transition disabled:opacity-50"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="text-xs font-sans text-wp-gray mt-5 text-center">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }}
              className="text-wp-link font-bold underline"
            >
              {mode === 'signin' ? 'Create one' : 'Sign in'}
            </button>
          </p>
          <p className="text-[11px] font-sans text-wp-gray mt-4 text-center">
            By continuing you agree to the Terms of Service and Privacy Policy.
          </p>
          <div className="mt-4 text-center">
            <Link href="/" className="text-xs font-sans text-wp-gray hover:text-wp-black underline">
              ← Back to homepage
            </Link>
          </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
