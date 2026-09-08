'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { UserIcon } from './Icons';

/**
 * The nav's account controls.
 *
 * Exactly ONE set of controls ever renders:
 *  - Clerk's, when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is configured, or
 *  - the legacy NextAuth menu, when it is not (so the demo sign-in keeps working).
 *
 * This is why the whole block is gated here instead of living inline in
 * <Masthead/>: rendering Clerk's components without <ClerkProvider> throws, and
 * rendering both sets would give signed-in users two avatars.
 *
 * Note on the component API: `<Show>` is the Core 3 replacement for
 * `<SignedIn>`/`<SignedOut>` — those were removed in @clerk/nextjs@7 and render
 * them throws (see @clerk/nextjs/dist/types/removedControlComponents.d.ts).
 */
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

function ClerkAccountControls() {
  return (
    <>
      {/* Signed out: offer both entry points. Buttons use Clerk's default
          (full-page) navigation so they respect
          NEXT_PUBLIC_CLERK_SIGN_IN_URL / _SIGN_UP_URL. */}
      <Show when="signed-out">
        {/* v7's control buttons accept no className prop (only mode + redirect
            props + children), so the WaPo look is applied to the <button> Clerk
            renders via descendant variants on the wrapper. */}
        <span className="[&_button]:px-2 [&_button]:py-1 [&_button]:font-sans [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-[11px] [&_button]:text-wp-black [&_button]:hover:text-wp-red [&_button]:transition">
          <SignInButton />
        </span>
        <span className="hidden sm:inline-block [&_button]:bg-wp-black [&_button]:text-white [&_button]:px-3 [&_button]:py-2 [&_button]:font-sans [&_button]:font-bold [&_button]:uppercase [&_button]:tracking-wider [&_button]:text-[11px] [&_button]:hover:bg-wp-red [&_button]:transition [&_button]:ml-1">
          <SignUpButton>Create free account</SignUpButton>
        </span>
      </Show>

      {/* Signed in: Clerk's menu carries profile, account and sign-out. */}
      <Show when="signed-in">
        <div className="flex items-center gap-2 pl-1">
          <Link
            href="/account"
            className="hidden md:inline text-[11px] font-sans uppercase tracking-widest text-wp-gray hover:text-wp-red"
          >
            Your account
          </Link>
          <UserButton />
        </div>
      </Show>
    </>
  );
}

function LegacyAccountControls() {
  const { data: session, status } = useSession();
  const [acctOpen, setAcctOpen] = useState(false);

  if (status === 'authenticated' && session?.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setAcctOpen((o) => !o)}
          aria-label="Account menu"
          aria-expanded={acctOpen}
          aria-haspopup="menu"
          className="w-10 h-10 flex items-center justify-center hover:bg-wp-light text-wp-black hover:text-wp-red transition tap-target"
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <span className="w-7 h-7 rounded-full bg-wp-black text-white flex items-center justify-center font-display font-black text-sm">
              {(session.user.name || session.user.email || 'R').charAt(0).toUpperCase()}
            </span>
          )}
        </button>
        {acctOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-56 bg-white border-2 border-wp-black shadow-lg z-50"
            onKeyDown={(e) => { if (e.key === 'Escape') setAcctOpen(false); }}
          >
            <div className="px-4 py-3 border-b border-wp-border">
              <p className="font-sans font-bold text-sm truncate">{session.user.name}</p>
              <p className="font-sans text-xs text-wp-gray truncate">{session.user.email}</p>
            </div>
            <ul className="py-1 text-sm font-sans">
              <li><Link href="/account" onClick={() => setAcctOpen(false)} className="block px-4 py-2 hover:bg-wp-light">Your account</Link></li>
              <li><Link href="/account#saved" onClick={() => setAcctOpen(false)} className="block px-4 py-2 hover:bg-wp-light">Saved stories</Link></li>
              <li><Link href="/newsletters" onClick={() => setAcctOpen(false)} className="block px-4 py-2 hover:bg-wp-light">Newsletters</Link></li>
              <li className="border-t border-wp-border my-1" />
              <li><Link href="/editorial" onClick={() => setAcctOpen(false)} className="block px-4 py-2 hover:bg-wp-light text-wp-red font-bold uppercase text-[11px] tracking-widest">Newsroom CMS</Link></li>
              <li>
                <button
                  onMouseDown={(e) => { e.preventDefault(); signOut({ callbackUrl: '/' }); }}
                  className="block w-full text-left px-4 py-2 hover:bg-wp-light text-wp-red"
                >
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/signin"
      className="w-10 h-10 flex items-center justify-center hover:bg-wp-light text-wp-black hover:text-wp-red transition tap-target"
      aria-label="Sign in"
    >
      <UserIcon className="w-[18px] h-[18px]" />
    </Link>
  );
}

export default function AuthControls() {
  return CLERK_ENABLED ? <ClerkAccountControls /> : <LegacyAccountControls />;
}
