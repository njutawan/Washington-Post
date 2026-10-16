import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';
import { withApi } from '@/lib/http-security';
export const dynamic = 'force-dynamic';
export const GET = withApi({ name: 'push-key' }, async () =>
  NextResponse.json({ publicKey: getVapidPublicKey() }),
);
