import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { toggleBookmark } from '@/lib/db';
import { csrfBlock } from '@/lib/csrf';

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  const { slug } = await params;
  const list = await toggleBookmark(session.user.id, slug);
  return NextResponse.json({ saved: list.includes(slug), bookmarks: list });
}
