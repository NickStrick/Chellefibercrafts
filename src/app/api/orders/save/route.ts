import { NextRequest, NextResponse } from 'next/server';
import { saveConfigJson } from '@/lib/s3-admin';

type OrderPayload = {
  orderId?: string;
  siteId?: string;
  createdAt?: string;
};

export async function POST(req: NextRequest) {
  let body: OrderPayload | null = null;
  try {
    body = (await req.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const siteId = body?.siteId || process.env.NEXT_PUBLIC_SITE_ID || 'site';
  const orderId = body?.orderId || `${Date.now()}`;
  const key = `${siteId}/orders/${orderId}.json`;

  const payload = {
    ...body,
    siteId,
    orderId,
    createdAt: body?.createdAt || new Date().toISOString(),
  };

  await saveConfigJson({ key, json: payload, cacheControl: 'no-store' });
  return NextResponse.json({ ok: true, key });
}
