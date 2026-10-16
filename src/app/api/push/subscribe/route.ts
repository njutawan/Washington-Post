import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  addSubscription,
  removeSubscription,
  isValidPushEndpoint,
} from '@/lib/push';
import { readJson, withApi, HttpError } from '@/lib/http-security';
export const dynamic = 'force-dynamic';
const key = (bytes: number) =>
  z
    .string()
    .regex(/^[A-Za-z0-9_-]+$/)
    .max(256)
    .refine((v) => Buffer.from(v, 'base64url').length === bytes);
const endpoint = z.string().max(2048).refine(isValidPushEndpoint);
const topics = z
  .array(
    z.enum([
      'breaking',
      'politics',
      'world',
      'business',
      'sports',
      'entertainment',
      'tech',
    ]),
  )
  .max(7)
  .optional();
export const POST = withApi(
  { name: 'push-subscribe', max: 10 },
  async (req: Request) => {
    const data = await readJson(
      req,
      z
        .object({
          subscription: z
            .object({
              endpoint,
              expirationTime: z.number().nullable().optional(),
              keys: z.object({ p256dh: key(65), auth: key(16) }).strict(),
            })
            .strict(),
          topics,
        })
        .strict(),
      4096,
    );
    const ok = await addSubscription(data.subscription, {
      topics: data.topics,
    });
    if (!ok) throw new HttpError(409, 'Subscription unavailable');
    return NextResponse.json({ ok: true });
  },
);
export const DELETE = withApi(
  { name: 'push-unsubscribe', max: 10 },
  async (req: Request) => {
    const data = await readJson(
      req,
      z.object({ endpoint, auth: key(16) }).strict(),
      4096,
    );
    await removeSubscription(data.endpoint, data.auth);
    return NextResponse.json({ ok: true });
  },
);
