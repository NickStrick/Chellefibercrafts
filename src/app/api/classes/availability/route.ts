import { NextRequest, NextResponse } from 'next/server';
import { getObjectJson } from '@/lib/s3-admin';
import { getBookedCounts } from '@/lib/classSlotsDb';
import { normalizeClassItems } from '@/lib/siteConfigSections';
import type { SiteConfig } from '@/types/site';

// Public endpoint: lets the storefront calendar show live remaining-seat counts
// without needing admin auth. Missing/unlimited capacity => remaining: null.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = (searchParams.get('businessId') || '').trim();
  const idsParam = searchParams.get('classTimeIds') || '';
  const classTimeIds = idsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required.' }, { status: 400 });
  }
  if (classTimeIds.length === 0) {
    return NextResponse.json({ availability: {} });
  }

  try {
    const [config, booked] = await Promise.all([
      getObjectJson<SiteConfig>({ key: `configs/${businessId}/site.json` }),
      getBookedCounts(businessId, classTimeIds),
    ]);

    // `normalizeClassItems` resolves `times` from the legacy `classTimeIds` +
    // shared pool for old-shape stored configs, so this works regardless of
    // whether the site has been re-saved through the new admin UI yet.
    const items = normalizeClassItems(config?.classes);
    const capacityById = new Map(
      items.flatMap((c) => c.times ?? []).map((t) => [t.id, t.capacity] as const)
    );

    const availability: Record<string, { booked: number; capacity: number | null; remaining: number | null }> = {};
    for (const id of classTimeIds) {
      const capacity = capacityById.get(id);
      const bookedCount = booked[id] ?? 0;
      availability[id] = {
        booked: bookedCount,
        capacity: typeof capacity === 'number' ? capacity : null,
        remaining: typeof capacity === 'number' ? Math.max(0, capacity - bookedCount) : null,
      };
    }

    return NextResponse.json({ availability });
  } catch (err) {
    console.error('[classes/availability] failed', err);
    return NextResponse.json({ error: 'Failed to load availability.' }, { status: 500 });
  }
}
