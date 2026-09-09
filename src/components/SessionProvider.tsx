'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export default function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  // Optional: when omitted, next-auth fetches the session client-side so
  // server layouts using this provider stay static and cacheable.
  session?: any;
}) {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
}
