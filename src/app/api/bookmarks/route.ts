import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBookmarks } from '@/lib/db';
import { withApi, HttpError } from '@/lib/http-security';
export const GET = withApi({ name: 'bookmark-read' }, async () => {
  const s = await auth();
  if (!s?.user?.id) throw new HttpError(401, 'Sign in required');
  return NextResponse.json({ bookmarks: await getBookmarks(s.user.id) });
});
