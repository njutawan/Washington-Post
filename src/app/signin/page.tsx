'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Masthead from '@/components/Masthead';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const { status } = useSession();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (status === 'authenticated') {
    router.replace(callbackUrl);
  }

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
      setError(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = () => signIn('demo', { callbackUrl });
  const signInGoogle = () => signIn('google', { callbackUrl });

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

          {/* OAuth / Demo */}
          <div className="space-y-2 mb-6">
            {process.env.NODE_ENV !== 'production' || true ? (
              <button
                onClick={signInDemo}
                className="w-full py-3 bg-wp-red text-white font-sans font-bold uppercase tracking-wider text-sm hover:bg-wp-black transition"
                type="button"
              >
                Try the Demo Account (1-click)
              </button>
            ) : null}
            <button
              onClick={signInGoogle}
              className="w-full py-3 border-2 border-wp-black font-sans font-bold text-sm hover:bg-wp-light transition flex items-center justify-center gap-2"
              type="button"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Continue with Google
            </button>
            <button
              type="button"
              disabled
              className="w-full py-3 border-2 border-wp-border font-sans font-bold text-sm text-wp-gray cursor-not-allowed flex items-center justify-center gap-2"
              title="Configure APPLE_ID / APPLE_SECRET env vars to enable"
            >
              Continue with Apple <span className="text-[10px] font-normal">(coming soon)</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-wp-border" />
            <span className="text-xs font-sans uppercase tracking-widest text-wp-gray">or</span>
            <div className="flex-1 h-px bg-wp-border" />
          </div>

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
                minLength={4}
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
            By continuing you agree to the demo Terms of Service and Privacy Policy.
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
