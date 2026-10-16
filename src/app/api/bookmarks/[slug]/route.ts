import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { toggleBookmark } from '@/lib/db';
import { slugSchema } from '@/lib/security-input';
import { withApi, HttpError, readBody } from '@/lib/http-security';
export const POST = withApi(
  { name: 'bookmark-write', max: 30 },
  async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const s = await auth();
    if (!s?.user?.id) throw new HttpError(401, 'Sign in required');
    const { slug } = await params;
    if (!slugSchema.safeParse(slug).success)
      throw new HttpError(400, 'Invalid slug');
    // This route has no request payload; reject unexpected bodies rather than parse them.
    if (req.body) await readBody(req, 0);
    const list = await toggleBookmark(s.user.id, slug);
    return NextResponse.json({ saved: list.includes(slug), bookmarks: list });
  },
);
