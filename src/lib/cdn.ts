// src/lib/cdn.ts
export function cdnUrlForKey(key: string) {
  const cdn = process.env.NEXT_PUBLIC_S3_CDN_BASE || '';
  if (!cdn) return key.replace(/^\//, ''); // fallback
  return `${cdn.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
}
