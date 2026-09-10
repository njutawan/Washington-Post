import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { toggleBookmark } from '@/lib/db';

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  const { slug } = await params;
  const list = await toggleBookmark(session.user.id, slug);
  return NextResponse.json({ saved: list.includes(slug), bookmarks: list });
}
