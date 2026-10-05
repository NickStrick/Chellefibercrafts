// src/app/api/config/publish/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { publishConfig, backupDraft } from '@/lib/configStore';
import { guardAdmin } from '@/lib/adminGuardRoute';

export async function POST(req: NextRequest) {
  const guard = guardAdmin(req);
  if (guard) return guard;

  // optional: create a backup of current draft before publish
  await backupDraft();
  await publishConfig();

  return NextResponse.json({ ok: true });
}
