// src/lib/adminGuard.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type AdminGuardOptions = {
  /** Header to check for local admin auth */
  headerName?: string;          // default: 'x-local-admin'
  /** Also allow ?admin=1 in the URL (useful for quick local testing) */
  allowQueryParam?: boolean;    // default: true
  /** Query param name if allowQueryParam is true */
  queryParam?: string;          // default: 'admin'
};

/**
 * Returns true if the incoming request is allowed as "admin".
 * Works for both NextRequest and standard Request.
 */
export function isAdmin(
  req: NextRequest | Request,
  opts: AdminGuardOptions = {}
): boolean {
  const headerName = opts.headerName ?? 'x-local-admin';
  const allowQuery = opts.allowQueryParam ?? true;
  const qp = opts.queryParam ?? 'admin';

  // 1) header check (preferred; set by your adminFetch or AdminBar)
  const headerVal = req.headers.get(headerName);
  if (headerVal === '1') return true;

  // 2) optional query param fallback (?admin=1)
  if (allowQuery) {
    // NextRequest has .nextUrl; Request needs new URL(req.url)
    const url = 'nextUrl' in req ? (req as NextRequest).nextUrl : new URL(req.url);
    const q = url.searchParams.get(qp);
    if (q === '1') return true;
  }

  return false;
}

/**
 * If not admin, returns a 401 response you can return from the route.
 * If admin, returns null so you can proceed.
 */
export function guardAdmin(
  req: NextRequest | Request,
  opts?: AdminGuardOptions
): NextResponse | null {
  if (isAdmin(req, opts)) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Assert-style helper if you prefer throwing (optional).
 * Throwing a Response is supported in Web/Next route handlers.
 */
export function assertAdmin(
  req: NextRequest | Request,
  opts?: AdminGuardOptions
): void {
  if (isAdmin(req, opts)) return;
  throw new Response('Unauthorized', { status: 401 });
}
