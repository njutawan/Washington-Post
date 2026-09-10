import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBookmarks } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ bookmarks: [] });
  const list = await getBookmarks(session.user.id);
  return NextResponse.json({ bookmarks: list });
}
