import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setNewsletterPrefs, findUserById } from '@/lib/db';
import { withApi, readJson, HttpError } from '@/lib/http-security';
import { newsletterSchema } from '@/lib/security-input';
export const dynamic = 'force-dynamic';
export const GET = withApi({ name: 'newsletter-read' }, async () => {
  const s = await auth();
  if (!s?.user?.id) throw new HttpError(401, 'Sign in required');
  const u = await findUserById(s.user.id);
  return NextResponse.json({ preferences: u?.newsletterPreferences || {} });
});
export const PUT = withApi(
  { name: 'newsletter-write', max: 10, windowMs: 3600000 },
  async (req: Request) => {
    const s = await auth();
    if (!s?.user?.id) throw new HttpError(401, 'Sign in required');
    const { preferences } = await readJson(req, newsletterSchema, 2048);
    // Preferences only. No anonymous recipient, email override, automatic email,
    // or welcome template until a verified double-opt-in delivery flow exists.
    return NextResponse.json({
      preferences: await setNewsletterPrefs(
        s.user.id,
        Object.fromEntries(
          Object.entries(preferences).filter(
            (entry): entry is [string, boolean] =>
              typeof entry[1] === 'boolean',
          ),
        ),
      ),
    });
  },
);
