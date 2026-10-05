// src/app/api/admin/config/[siteId]/versions/[versionId]/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { getObjectJson, saveConfigJson, deleteObject } from '@/lib/s3-admin';
import type { SiteConfig, SiteConfigVersionMeta } from '@/types/site';

function indexKeyFor(siteId: string) {
  return `configs/${siteId}/versions/index.json`;
}

function versionKeyFor(siteId: string, id: string) {
  return `configs/${siteId}/versions/${id}.json`;
}

async function readIndex(siteId: string): Promise<SiteConfigVersionMeta[]> {
  const index = await getObjectJson<SiteConfigVersionMeta[]>({ key: indexKeyFor(siteId) });
  return Array.isArray(index) ? index : [];
}

// GET -> load one saved version's full config
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; versionId: string }> }
): Promise<NextResponse> {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const { siteId, versionId } = await params;
  const config = await getObjectJson<SiteConfig>({ key: versionKeyFor(siteId, versionId) });
  if (!config) {
    return NextResponse.json({ error: 'Version not found' }, { status: 404 });
  }
  return NextResponse.json(config, { status: 200 });
}

// DELETE -> remove a saved version
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string; versionId: string }> }
): Promise<NextResponse> {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const { siteId, versionId } = await params;

  if (process.env.NEXT_PUBLIC_USE_MOCK === '2') {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  await deleteObject({ key: versionKeyFor(siteId, versionId) });

  const index = await readIndex(siteId);
  const next = index.filter((v) => v.id !== versionId);
  await saveConfigJson({ key: indexKeyFor(siteId), json: next });

  return NextResponse.json({ ok: true }, { status: 200 });
}
