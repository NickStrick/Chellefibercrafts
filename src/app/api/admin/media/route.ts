// src/app/api/admin/media/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { listObjects, deleteObject } from '@/lib/s3-admin';

type ListQuery = {
  prefix?: string;
  bucket?: string;
  limit?: string; // numeric string
};

type ListItem = {
  key: string;
  url: string;
  size?: number;
  lastModified?: Date | string;
  etag?: string;
};

type ListResponse = {
  items: Array<{
    key: string;
    url: string;
    size?: number;
    lastModified?: string;
    etag?: string;
  }>;
};

type DeleteBody = { key: string; bucket?: string };

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 🔒 admin-only
  const denied = guardAdmin(req);
  if (denied) return denied;

  const { searchParams } = req.nextUrl;
  const q: ListQuery = {
    prefix: searchParams.get('prefix') ?? undefined,
    bucket: searchParams.get('bucket') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  };

  const maxKeys = q.limit ? Number(q.limit) : 200;

  const { items } = await listObjects({
    prefix: q.prefix ?? '',
    bucket: q.bucket,
    maxKeys,
  });

  const payload: ListResponse = {
    items: (items as ListItem[]).map((it) => ({
      key: it.key,
      url: it.url,
      size: it.size,
      etag: it.etag,
      lastModified:
        typeof it.lastModified === 'string'
          ? it.lastModified
          : it.lastModified?.toISOString(),
    })),
  };

  return NextResponse.json(payload, { status: 200 });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  // 🔒 admin-only
  const denied = guardAdmin(req);
  if (denied) return denied;

  const body = (await req.json()) as DeleteBody;
  if (!body?.key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  await deleteObject({ key: body.key, bucket: body.bucket });
  return NextResponse.json({ ok: true }, { status: 200 });
}
