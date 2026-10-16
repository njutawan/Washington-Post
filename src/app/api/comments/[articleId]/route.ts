import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { addComment, getComments } from '@/lib/db';
import { withApi, readJson, HttpError } from '@/lib/http-security';
import { idSchema } from '@/lib/security-input';
import { consumeLimit } from '@/lib/rate-limit';
type Context = { params: Promise<{ articleId: string }> };
export const GET = withApi(
  { name: 'comments-read' },
  async (_: Request, { params }: Context) => {
    const { articleId } = await params;
    if (!idSchema.safeParse(articleId).success)
      throw new HttpError(400, 'Invalid article');
    return NextResponse.json({ comments: await getComments(articleId) });
  },
);
export const POST = withApi(
  { name: 'comments-write', max: 10 },
  async (req: Request, { params }: Context) => {
    const s = await auth();
    if (!s?.user?.id) throw new HttpError(401, 'Sign in required');
    if (!(await consumeLimit('comments-user:' + s.user.id, 10, 60000)).allowed)
      throw new HttpError(429, 'Too many comments');
    const { articleId } = await params;
    if (!idSchema.safeParse(articleId).success)
      throw new HttpError(400, 'Invalid article');
    const { body } = await readJson(
      req,
      z.object({ body: z.string().trim().min(2).max(1000) }).strict(),
      8192,
    );
    return NextResponse.json({
      comment: await addComment({ articleId, userId: s.user.id, body }),
    });
  },
);
