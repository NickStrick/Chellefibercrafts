'use client';

export async function adminFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers || {});
  headers.set('x-local-admin', '1');
  return fetch(url, { ...init, headers });
}
