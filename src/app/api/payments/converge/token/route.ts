import { NextRequest, NextResponse } from 'next/server';

type TokenRequest = {
  amountCents: number;
  currency?: string;
  transactionType?: string; // e.g. "ccsale"
};

function formatAmount(cents: number) {
  return (Math.max(0, Math.round(cents)) / 100).toFixed(2);
}

export async function POST(req: NextRequest) {
  let body: TokenRequest | null = null;
  try {
    body = (await req.json()) as TokenRequest;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!body || !Number.isFinite(body.amountCents) || body.amountCents <= 0) {
    return NextResponse.json({ error: 'amountCents must be a positive number.' }, { status: 400 });
  }

  const merchantId = process.env.CONVERGE_MERCHANT_ID?.trim();
  const accountId = (process.env.CONVERGE_ACCOUNT_ID?.trim() || merchantId)?.trim();
  const userId = process.env.CONVERGE_USER_ID?.trim();
  const pin = process.env.CONVERGE_PIN?.trim();
  const baseUrl = (process.env.CONVERGE_API_BASE_URL ?? 'https://api.convergepay.com').trim();
  const transactionType = body.transactionType ?? 'ccsale';

  if (!accountId || !userId || !pin) {
    return NextResponse.json(
      { error: 'Server is missing CONVERGE_ACCOUNT_ID/CONVERGE_MERCHANT_ID, CONVERGE_USER_ID, or CONVERGE_PIN.' },
      { status: 500 }
    );
  }

  const params = new URLSearchParams();
  // Converge docs refer to this as "ssl_account_id" (formerly "ssl_merchant_id").
  // Send both for compatibility across gateways/accounts.
  params.set('ssl_account_id', accountId);
  params.set('ssl_merchant_id', accountId);
  params.set('ssl_user_id', userId);
  params.set('ssl_pin', pin);
  params.set('ssl_transaction_type', transactionType);
  params.set('ssl_amount', formatAmount(body.amountCents));

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/hosted-payments/transaction_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    return NextResponse.json(
      { error: 'Failed to create Converge transaction token.', status: res.status, details: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const token = text.trim();
  if (!token) {
    return NextResponse.json({ error: 'Converge token endpoint returned empty response.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, token });
}
