import { securityLog } from './security-log';
/**
 * Minimal email delivery wrapper.
 *
 * - If RESEND_API_KEY is set, sends via Resend's REST API (no SDK dep needed).
 * - Otherwise falls back to a dev-mode in-memory outbox so subscribe flows
 *   still work without network access. The outbox is preserved for the life
 *   of the server process (good enough for a clone; in production use a real
 *   provider: Resend, Postmark, Buttondown, Mailchimp, etc.).
 */

export type EmailMessage = {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
};

type OutboxEntry = EmailMessage & { sentAt: string };
const outbox: OutboxEntry[] = [];

const DEFAULT_FROM = 'The Washington Post Clone <no-reply@washingtonpost-clone.example.com>';

export async function sendEmail(msg: EmailMessage): Promise<{ ok: boolean; provider: 'resend' | 'stub'; id?: string; error?: string }> {
  const from = msg.from || DEFAULT_FROM;
  const payload: EmailMessage = { ...msg, from };

  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(5000),
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: payload.from,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          headers: payload.headers,
        }),
      });
      if (!res.ok) {
        securityLog('email_failed');
        return { ok: false, provider: 'resend', error: 'Email delivery failed' };
      }
      const data = await res.json() as { id?: string };
      return { ok: true, provider: 'resend', id: data.id };
    } catch {
      securityLog('email_failed');
      return { ok: false, provider: 'resend', error: 'Email delivery unavailable' };
    }
  }

  if (process.env.NODE_ENV === 'production') return { ok:false,provider:'resend',error:'Email delivery not configured' };
  // Bounded local/test stub only; no PII logging.
  const entry: OutboxEntry = { ...payload, sentAt: new Date().toISOString() };
  if(outbox.length>=100)outbox.shift();
  outbox.push(entry);
  return { ok: true, provider: 'stub', id: `stub-${outbox.length}` };
}

export function getOutbox(): OutboxEntry[] {
  return outbox.slice();
}

export function clearOutbox(): void {
  outbox.length = 0;
}
