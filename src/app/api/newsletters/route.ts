import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setNewsletterPrefs, findUserById } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ preferences: {} });
  const u = await findUserById(session.user.id);
  return NextResponse.json({ preferences: u?.newsletterPreferences || {} });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  const { preferences } = await req.json();
  const prefs = await setNewsletterPrefs(session.user.id, preferences || {});
  return NextResponse.json({ preferences: prefs });
}
