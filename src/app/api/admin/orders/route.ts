import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { deleteOrder, getOrder, listOrdersByBusiness } from '@/lib/ordersDb';
import { releaseSeats } from '@/lib/classSlotsDb';

export async function GET(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const envSiteId = (process.env.NEXT_PUBLIC_SITE_ID || '').trim();
  const requestedId = (searchParams.get('businessId') || '').trim();
  const businessId = envSiteId || requestedId;
  if (!businessId.trim()) {
    return NextResponse.json({ error: 'businessId is required.' }, { status: 400 });
  }
  if (envSiteId && requestedId && requestedId !== envSiteId) {
    return NextResponse.json({ error: 'Invalid businessId for this site.' }, { status: 403 });
  }

  const fromISO = searchParams.get('from') || undefined;
  const toISO = searchParams.get('to') || undefined;
  const nextToken = searchParams.get('next') || undefined;
  const limitParam = searchParams.get('limit') || '';
  const limitRaw = Number.parseInt(limitParam, 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 25;

  try {
    const { items, nextToken: next } = await listOrdersByBusiness(businessId, {
      fromISO,
      toISO,
      nextToken,
      limit,
    });
    return NextResponse.json({ items, nextToken: next }, { status: 200 });
  } catch (err) {
    console.error('[orders] list failed', err);
    return NextResponse.json({ error: 'Failed to list orders.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  let body: { businessId?: string; createdAtOrderId?: string } | null = null;
  try {
    body = (await req.json()) as { businessId?: string; createdAtOrderId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || '';
  const requestedId = body?.businessId?.trim() || '';
  const businessId = envSiteId || requestedId;
  const createdAtOrderId = body?.createdAtOrderId?.trim() || '';

  if (!businessId || !createdAtOrderId) {
    return NextResponse.json(
      { error: 'businessId and createdAtOrderId are required.' },
      { status: 400 }
    );
  }
  if (envSiteId && requestedId && requestedId !== envSiteId) {
    return NextResponse.json({ error: 'Invalid businessId for this site.' }, { status: 403 });
  }

  try {
    const order = await getOrder(businessId, createdAtOrderId);
    await deleteOrder(businessId, createdAtOrderId);

    // Free up any class seats this order was holding.
    if (order?.items?.length) {
      await Promise.all(
        order.items.map((item) => {
          const classTimeId = (item as Record<string, unknown>).classTimeId;
          if (typeof classTimeId !== 'string') return Promise.resolve();
          const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
          return releaseSeats(businessId, classTimeId, qty).catch(() => {});
        })
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('[orders] delete failed', err);
    return NextResponse.json({ error: 'Failed to delete order.' }, { status: 500 });
  }
}
