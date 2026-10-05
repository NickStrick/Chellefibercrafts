// src/app/api/admin/config/[siteId]/versions/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { guardAdmin } from '@/lib/adminGuard';
import { getObjectJson, saveConfigJson } from '@/lib/s3-admin';
import { normalizeSiteConfig } from '@/lib/siteConfigSections';
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

type SaveVersionBody = { name?: string; config?: SiteConfig };

// GET -> list saved versions (newest first)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
): Promise<NextResponse> {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const siteId = (await params).siteId;
  const versions = await readIndex(siteId);
  return NextResponse.json({ versions }, { status: 200 });
}

// POST -> save the given config as a new named version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
): Promise<NextResponse> {
  const denied = guardAdmin(req);
  if (denied) return denied;

  const siteId = (await params).siteId;
  const body = (await req.json()) as SaveVersionBody;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: 'Missing version name' }, { status: 400 });
  }
  if (!body.config || !Array.isArray(body.config.sections)) {
    return NextResponse.json({ error: 'Missing or invalid config' }, { status: 400 });
  }

  const meta: SiteConfigVersionMeta = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    savedAt: new Date().toISOString(),
  };

  if (process.env.NEXT_PUBLIC_USE_MOCK === '2') {
    return NextResponse.json(meta, { status: 200 });
  }

  const normalized = normalizeSiteConfig(body.config);
  await saveConfigJson({ key: versionKeyFor(siteId, meta.id), json: normalized });

  const index = await readIndex(siteId);
  index.unshift(meta);
  await saveConfigJson({ key: indexKeyFor(siteId), json: index });

  return NextResponse.json(meta, { status: 200 });
}
