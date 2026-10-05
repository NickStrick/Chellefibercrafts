// src/lib/adminGuardRoute.ts
import type { NextRequest, NextResponse } from 'next/server';
import { NextResponse as Res } from 'next/server';

export function guardAdmin(req: NextRequest): NextResponse | null {
  // same header you already use elsewhere
  if (req.headers.get('x-local-admin') !== '1') {
    return Res.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
