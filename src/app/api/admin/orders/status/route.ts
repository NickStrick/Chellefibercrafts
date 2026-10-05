import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { getOrder, updateOrderStatus } from '@/lib/ordersDb';
import { releaseSeats } from '@/lib/classSlotsDb';

const RELEASING_STATUSES = new Set(['CANCELLED', 'REFUNDED']);

type StatusBody = {
  businessId?: string;
  createdAtOrderId?: string;
  status?: string;
};

export async function PATCH(req: NextRequest) {
  const denied = guardAdmin(req);
  if (denied) return denied;

  let body: StatusBody | null = null;
  try {
    body = (await req.json()) as StatusBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || '';
  const requestedId = body?.businessId?.trim() || '';
  const businessId = envSiteId || requestedId;
  const createdAtOrderId = body?.createdAtOrderId?.trim() || '';
  const status = body?.status?.trim() || '';

  if (!businessId || !createdAtOrderId || !status) {
    return NextResponse.json(
      { error: 'businessId, createdAtOrderId, and status are required.' },
      { status: 400 }
    );
  }
  if (envSiteId && requestedId && requestedId !== envSiteId) {
    return NextResponse.json({ error: 'Invalid businessId for this site.' }, { status: 403 });
  }

  try {
    const nextStatus = status.toUpperCase();
    const shouldRelease = RELEASING_STATUSES.has(nextStatus);

    // Only release once — skip if the order was already in a released state.
    const order = shouldRelease ? await getOrder(businessId, createdAtOrderId) : null;
    const alreadyReleased = order ? RELEASING_STATUSES.has((order.status || '').toUpperCase()) : true;

    await updateOrderStatus(businessId, createdAtOrderId, status);

    if (shouldRelease && !alreadyReleased && order?.items?.length) {
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
    console.error('[orders] status update failed', err);
    return NextResponse.json({ error: 'Failed to update status.' }, { status: 500 });
  }
}
