import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

type CloverChargeRequest = {
  amount: number;
  currency: string;
  source: string;
};

export async function POST(req: NextRequest) {
  let body: CloverChargeRequest | null = null;
  try {
    body = (await req.json()) as CloverChargeRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body?.amount || !body?.currency || !body?.source) {
    return NextResponse.json(
      { error: 'Missing required fields: amount, currency, source.' },
      { status: 400 },
    );
  }

  if (!Number.isFinite(body.amount) || body.amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 });
  }

  const privateToken = process.env.CLOVER_PRIVATE_TOKEN;
  const baseUrl = process.env.CLOVER_API_BASE_URL ?? 'https://scl-sandbox.dev.clover.com';

  if (!privateToken) {
    return NextResponse.json(
      { error: 'Server is missing CLOVER_PRIVATE_TOKEN.' },
      { status: 500 },
    );
  }

  const clientIp =
    req.headers.get('x-forwarded-for') ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1';

  const cloverRes = await fetch(`${baseUrl}/v1/charges`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${privateToken}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID(),
      'x-forwarded-for': clientIp,
    },
    body: JSON.stringify({
      amount: Math.round(body.amount),
      currency: body.currency.toLowerCase(),
      source: body.source,
    }),
  });

  let data: unknown = null;
  try {
    data = await cloverRes.json();
  } catch {
    // ignore non-json
  }

  if (!cloverRes.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? (data as { error?: { message?: string } }).error?.message ?? 'Clover charge failed.'
        : 'Clover charge failed.';
    return NextResponse.json({ error: message, details: data }, { status: cloverRes.status });
  }

  return NextResponse.json({ ok: true, charge: data });
}
