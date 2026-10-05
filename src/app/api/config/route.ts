// src/app/api/config/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { SiteConfigSchema } from '@/lib/siteSchema';
import { getConfigFromS3, putConfigToS3, type ConfigVariant } from '@/lib/configStore';
import { guardAdmin } from '@/lib/adminGuardRoute';
import { mockSiteConfig } from '@/mocks/chelleConfig'; // keep local fallback

export async function GET(req: NextRequest) {
  // ?variant=draft|published (default published)
  const variant = (req.nextUrl.searchParams.get('variant') as ConfigVariant) || 'published';

  // local dev “mock mode”
  if (process.env.NEXT_PUBLIC_USE_MOCK === '2') {
    return NextResponse.json(mockSiteConfig);
  }

  const data = await getConfigFromS3(variant);
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // validate shape (lenient)
  const parsed = SiteConfigSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid config in S3', details: parsed.error.flatten() }, { status: 500 });
  }
  return NextResponse.json(parsed.data);
}

export async function PUT(req: NextRequest) {
  // Admin only (header guard)
  const guard = guardAdmin(req);
  if (guard) return guard;

  // local dev “mock mode” (do not persist to S3)
  if (process.env.NEXT_PUBLIC_USE_MOCK === '2') {
    const json = await req.json();
    const parsed = SiteConfigSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ ok: true, variant: (req.nextUrl.searchParams.get('variant') as ConfigVariant) || 'draft', config: parsed.data });
  }

  const variant = (req.nextUrl.searchParams.get('variant') as ConfigVariant) || 'draft';
  const json = await req.json();

  const parsed = SiteConfigSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  }

  await putConfigToS3(parsed.data, variant);
  return NextResponse.json({ ok: true, variant });
}
