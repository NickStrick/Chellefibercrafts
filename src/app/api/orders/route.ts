import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/ordersDb';
import { reserveSeats, releaseSeats, SlotFullError } from '@/lib/classSlotsDb';
import { getObjectJson } from '@/lib/s3-admin';
import { normalizeClassItems } from '@/lib/siteConfigSections';
import type { OrderItem } from '@/types/orders';
import type { SiteConfig } from '@/types/site';

type CreateOrderBody = {
  businessId?: string;
  siteId?: string;
  customerEmail?: string;
  customerName?: string;
  items?: OrderItem[];
  total?: number;
  currency?: string;
  status?: string;
  notes?: string;
  [key: string]: unknown;
};

export async function POST(req: NextRequest) {
  let body: CreateOrderBody | null = null;
  try {
    body = (await req.json()) as CreateOrderBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const envSiteId = process.env.NEXT_PUBLIC_SITE_ID || '';
  const requestedId = (body?.businessId || body?.siteId || '').trim();
  const businessId = envSiteId || requestedId;
  if (!businessId.trim()) {
    return NextResponse.json({ error: 'businessId is required.' }, { status: 400 });
  }
  if (envSiteId && requestedId && requestedId !== envSiteId) {
    return NextResponse.json({ error: 'Invalid businessId for this site.' }, { status: 403 });
  }

  const customerEmail = body?.customerEmail?.trim() || '';
  if (!customerEmail) {
    return NextResponse.json({ error: 'customerEmail is required.' }, { status: 400 });
  }

  const items = Array.isArray(body?.items) ? body?.items : null;
  if (!items) {
    return NextResponse.json({ error: 'items must be an array.' }, { status: 400 });
  }

  const total = typeof body?.total === 'number' ? body.total : NaN;
  if (!Number.isFinite(total)) {
    return NextResponse.json({ error: 'total must be a number.' }, { status: 400 });
  }

  const currency = body?.currency?.trim() || '';
  if (!currency) {
    return NextResponse.json({ error: 'currency is required.' }, { status: 400 });
  }

  const { customerName, status, notes, ...rest } = body || {};

  // Reserve seats for any class-booking items before the order is created, so we
  // never create an order for a slot that's actually full. Sequential reserve with
  // compensating rollback on failure (not a single atomic transaction, but good
  // enough to prevent overbooking under normal concurrency).
  const classReservations: { classTimeId: string; qty: number }[] = [];
  const classItems = items.filter(
    (it): it is OrderItem & { classTimeId: string } => typeof (it as Record<string, unknown>).classTimeId === 'string'
  );

  if (classItems.length > 0) {
    try {
      const config = await getObjectJson<SiteConfig>({ key: `configs/${businessId}/site.json` });
      // `normalizeClassItems` resolves `times` from the legacy `classTimeIds` +
      // shared pool for old-shape stored configs, so this works regardless of
      // whether the site has been re-saved through the new admin UI yet.
      const items = normalizeClassItems(config?.classes);
      const capacityById = new Map(
        items.flatMap((c) => c.times ?? []).map((t) => [t.id, t.capacity] as const)
      );

      for (const item of classItems) {
        const classTimeId = item.classTimeId as string;
        const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        try {
          await reserveSeats(businessId, classTimeId, qty, capacityById.get(classTimeId));
          classReservations.push({ classTimeId, qty });
        } catch (err) {
          // Roll back anything we already reserved for this order attempt.
          await Promise.all(
            classReservations.map((r) => releaseSeats(businessId, r.classTimeId, r.qty).catch(() => {}))
          );
          if (err instanceof SlotFullError) {
            return NextResponse.json(
              { error: 'That class time just filled up — please pick another time.' },
              { status: 409 }
            );
          }
          throw err;
        }
      }
    } catch (err) {
      console.error('[orders] class seat reservation failed', err);
      return NextResponse.json({ error: 'Failed to reserve class seats.' }, { status: 500 });
    }
  }

  try {
    const order = await createOrder({
      businessId,
      customerEmail,
      customerName,
      items,
      total,
      currency,
      status,
      notes,
      ...rest,
    });

    console.log('[orders] created', {
      businessId: order.businessId,
      orderId: order.orderId,
      createdAt: order.createdAt,
      createdAtOrderId: order.createdAtOrderId,
      status: order.status,
      total: order.total,
      currency: order.currency,
      itemsCount: order.items?.length ?? 0,
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
          customerName: order.customerName,
          total: order.total,
          currency: order.currency,
          items: order.items,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[orders] create failed', err);
    // Order row failed to write — release any seats we reserved above so they aren't stuck.
    await Promise.all(
      classReservations.map((r) => releaseSeats(businessId, r.classTimeId, r.qty).catch(() => {}))
    );
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}
