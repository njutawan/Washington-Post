import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { addComment, getComments } from '@/lib/db';
import { csrfBlock } from '@/lib/csrf';

export async function GET(_: Request, { params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const list = await getComments(articleId);
  return NextResponse.json({ comments: list });
}

export async function POST(req: Request, { params }: { params: Promise<{ articleId: string }> }) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });
  }
  const { articleId } = await params;
  const { body } = await req.json();
  if (!body || typeof body !== 'string' || body.trim().length < 2) {
    return NextResponse.json({ error: 'Comment too short' }, { status: 400 });
  }
  const comment = await addComment({ articleId, userId: session.user.id, body });
  return NextResponse.json({ comment });
}
