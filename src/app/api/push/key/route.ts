import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/lib/push';

// Cache the key response since it never changes at runtime.
export const revalidate = false;
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { publicKey: getVapidPublicKey() },
    {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    },
  );
}
