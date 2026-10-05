import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { saveConfigJson } from '@/lib/s3-admin';

type DeliveryAddressPayload = {
  address: string;
  confirmed?: boolean;
  fulfillment?: 'pickup' | 'delivery';
  siteId?: string;
  s3Prefix?: string;
};

export async function POST(req: NextRequest) {
  let body: DeliveryAddressPayload | null = null;
  try {
    body = (await req.json()) as DeliveryAddressPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.address || !body.address.trim()) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 });
  }

  const siteId = body.siteId || process.env.NEXT_PUBLIC_SITE_ID || 'site';
  const prefix =
    body.s3Prefix?.trim() || `orders/${siteId}/delivery/`;
  const key = `${prefix.replace(/\/?$/, '/')}${Date.now()}-${crypto.randomUUID()}.json`;

  const payload = {
    address: body.address.trim(),
    confirmed: body.confirmed === true,
    fulfillment: body.fulfillment ?? 'delivery',
    siteId,
    createdAt: new Date().toISOString(),
  };

  await saveConfigJson({ key, json: payload, cacheControl: 'no-store' });
  return NextResponse.json({ ok: true });
}
