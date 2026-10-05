// src/app/api/admin/media/presign/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { getPresignedPutUrl } from '@/lib/s3-admin';

type PresignBody = {
  key: string;
  contentType?: string;
  bucket?: string;
};

type PresignResponse = {
  url: string;
  key: string;
  bucket: string;
  contentType?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 🔒 admin-only
  const denied = guardAdmin(req);
  if (denied) return denied;

  const body = (await req.json()) as PresignBody;
  const { key, contentType, bucket } = body;

  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  const result = await getPresignedPutUrl({ key, contentType, bucket });
  const payload: PresignResponse = {
    url: result.url,
    key,
    bucket: result.bucket,
    contentType,
  };

  return NextResponse.json(payload, { status: 200 });
}
