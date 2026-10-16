'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { UserIcon } from './Icons';

function LegacyAccountControls() {
  const { data: session, status } = useSession();
  const [acctOpen, setAcctOpen] = useState(false);

  if (status === 'authenticated' && session?.user) {
    return (
      <div className="relative">
        <button
          onClick={() => setAcctOpen((o) => !o)}
          onBlur={() => setTimeout(() => setAcctOpen(false), 150)}
          aria-label="Account menu"
          aria-expanded={acctOpen}
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
          <div className="absolute right-0 top-full mt-1 w-56 bg-white border-2 border-wp-black shadow-lg z-50">
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
  return <LegacyAccountControls />;
}
