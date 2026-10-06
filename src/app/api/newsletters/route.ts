import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { setNewsletterPrefs, findUserById } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { csrfBlock } from '@/lib/csrf';

const NEWSLETTER_NAMES: Record<string, string> = {
  'morning-mix': 'The Morning Mix',
  'politics': 'Politics A.M.',
  'opinions-today': 'Opinions Today',
  'tech': 'Technology',
  'world': 'World Briefing',
  'food': 'Voraciously',
  'wellbeing': 'Well+Being',
  'sports': 'Sports',
  'business': 'Business',
  'weekend': 'The Weekend Read',
};

/**
 * In-memory fallback store for anonymous users (no auth session).
 * Keyed by a cookie id set below; persists for the server process lifetime
 * — enough for the demo. Authenticated users still read/write via the db.
 */
const anonymousStore: Map<string, Record<string, boolean>> = new Map();
const ANON_COOKIE = 'wapo_anon_id';

function getAnonId(req: Request): string {
  const m = req.headers.get('cookie')?.match(new RegExp(`${ANON_COOKIE}=([^;]+)`));
  return m?.[1] || crypto.randomUUID();
}

export async function GET(req: Request) {
  const session = await auth();
  if (session?.user?.id) {
    const u = await findUserById(session.user.id);
    return NextResponse.json({ preferences: u?.newsletterPreferences || {} });
  }
  const id = getAnonId(req);
  return NextResponse.json(
    { preferences: anonymousStore.get(id) || {} },
    { headers: { 'Set-Cookie': `${ANON_COOKIE}=${id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax` } }
  );
}

export async function PUT(req: Request) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  const session = await auth();
  const { preferences, email } = await req.json();
  if (session?.user?.id) {
    const prefs: Record<string, boolean> = (await setNewsletterPrefs(session.user.id, preferences || {})) || {};
    // Welcome/follow-up email for newly added newsletters
    const newlySubscribed = Object.entries(prefs).filter(([, v]) => v).map(([k]) => k);
    const recipient = session.user.email || email;
    if (newlySubscribed.length && recipient) {
      sendWelcomeEmail(recipient, newlySubscribed).catch((e) => console.warn('[newsletters] welcome email failed:', e));
    }
    return NextResponse.json({ preferences: prefs });
  }
  const id = getAnonId(req);
  const prev = anonymousStore.get(id) || {};
  const cleaned: Record<string, boolean> = {};
  Object.entries(preferences || {}).forEach(([k, v]) => { if (v) cleaned[k] = true; });
  anonymousStore.set(id, cleaned);
  // Welcome email for anonymous subscribers (best-effort; only if they passed email)
  const newlySubscribed = Object.keys(cleaned).filter((k) => !prev[k]);
  if (newlySubscribed.length && email) {
    sendWelcomeEmail(email, newlySubscribed).catch((e) => console.warn('[newsletters] welcome email failed:', e));
  }
  return NextResponse.json(
    { preferences: cleaned },
    { headers: { 'Set-Cookie': `${ANON_COOKIE}=${id}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax` } }
  );
}

async function sendWelcomeEmail(to: string, subscribed: string[]) {
  const names = subscribed.map((s) => NEWSLETTER_NAMES[s] || s).join(', ');
  await sendEmail({
    to,
    from: 'The Washington Post Clone <newsletters@washingtonpost-clone.example.com>',
    subject: `You're subscribed to ${subscribed.length === 1 ? 'The Morning Mix' : 'Washington Post newsletters'}`,
    text: `Welcome! You've signed up for: ${names}.\n\nThis is a demo clone of The Washington Post. No real email will be sent in the sandbox; production would use Resend/Buttondown.`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;">
        <h1 style="font-family:'Postoni',Georgia,serif;">Welcome to The Washington Post</h1>
        <p style="font-size:16px;line-height:1.5;">You're now subscribed to: <strong>${names}</strong>.</p>
        <p style="font-size:14px;color:#666;">This is a demo clone. Email delivery uses the in-app stub when <code>RESEND_API_KEY</code> is not configured — set the env var in production to send real mail via Resend.</p>
        <hr style="border:0;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#999;">The Washington Post Clone · Demo environment</p>
      </div>
    `,
  });
}
