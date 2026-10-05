// src/app/api/admin/config/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { saveConfigJson } from '@/lib/s3-admin'; // your helper: writes JSON to S3

type SaveBody = {
  key: string;         // e.g. "configs/carole/site.json"
  bucket?: string;
  config: unknown;     // SiteConfig shape, but keep loose if you like
};

export async function PUT(req: NextRequest): Promise<NextResponse> {
  // 🔒 admin-only
  const denied = guardAdmin(req);
  if (denied) return denied;

  const body = (await req.json()) as SaveBody;
  const { key, bucket, config } = body;

  if (!key || typeof config === 'undefined') {
    return NextResponse.json({ error: 'Missing key or config' }, { status: 400 });
  }

  // In mock mode, don't write to S3.
  if (process.env.NEXT_PUBLIC_USE_MOCK === '2') {
    return NextResponse.json({ ok: true, mock: true }, { status: 200 });
  }

  await saveConfigJson({ key, bucket, json: config });
  return NextResponse.json({ ok: true }, { status: 200 });
}
