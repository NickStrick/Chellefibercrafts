import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { getConfigFromS3 } from '@/lib/configStore';
import { createOrder } from '@/lib/ordersDb';

function pickString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

type EmailTestBody = {
  businessDisplayName?: string;
  businessNotificationEmail?: string;
};

export async function POST(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || '';
  if (!envSiteId) {
    return NextResponse.json({ error: 'Missing NEXT_PUBLIC_SITE_ID.' }, { status: 500 });
  }

  const variant = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? 'published') as 'draft' | 'published';

  try {
    let body: EmailTestBody | null = null;
    try {
      body = (await req.json()) as EmailTestBody;
    } catch {
      body = null;
    }

    const bodyDisplayName = pickString(body?.businessDisplayName).trim();
    const bodyEmail = pickString(body?.businessNotificationEmail).trim();

    const cfg = (await getConfigFromS3(variant)) as any;
    const general = (cfg?.settings?.general ?? {}) as Record<string, unknown>;
    const businessDisplayName =
      bodyDisplayName ||
      pickString(general?.businessDisplayName).trim() ||
      pickString(cfg?.meta?.title).trim() ||
      pickString(cfg?.meta?.name).trim() ||
      envSiteId;
    const businessEmail =
      bodyEmail ||
      pickString(general?.businessNotificationEmail).trim() ||
      pickString(cfg?.settings?.payments?.supportEmail).trim() ||
      pickString(cfg?.settings?.general?.supportEmail).trim();

    if (!businessEmail) {
      return NextResponse.json(
        {
          error:
            'Missing business notification email. Set Settings → General → Business Notification Email (or Settings → Payments → Support Email), then try again.',
        },
        { status: 400 }
      );
    }

    const order = await createOrder({
      businessId: envSiteId,
      customerEmail: businessEmail,
      customerName: 'Test Customer',
      items: [{ name: 'Email Test Order', quantity: 1, price: 0.01, total: 0.01 }],
      total: 0.01,
      currency: 'USD',
      status: 'PLACED',
      businessDisplayName,
      businessNotificationEmail: businessEmail,
      testEmail: true,
      notes: 'Admin email test order (1 cent)',
    });

    return NextResponse.json(
      {
        ok: true,
        order: {
          businessId: order.businessId,
          orderId: order.orderId,
          createdAt: order.createdAt,
          createdAtOrderId: order.createdAtOrderId,
          expiresAt: order.expiresAt,
          status: order.status,
          customerEmail: order.customerEmail,
          total: order.total,
          currency: order.currency,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[orders-email-test] failed', err);
    return NextResponse.json({ error: 'Failed to create test order.' }, { status: 500 });
  }
}
