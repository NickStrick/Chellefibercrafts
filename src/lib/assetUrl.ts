// src/lib/assetUrl.ts
export function resolveAssetUrl(src?: string): string | undefined {
  if (!src) return undefined;

  // already a full/relative URL? pass through
  if (src.includes('http') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/')) {
    return src;
  }

  // it's an S3 key like "configs/site/assets/hero.jpg"
  const key = src.replace(/^\/+/, '');
  const cdn = process.env.NEXT_PUBLIC_S3_CDN_BASE || '';
  const bucket =
    process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET || process.env.S3_GALLERY_BUCKET || '';
  const region = process.env.AWS_REGION || 'us-east-2';

  if (cdn) {
    return `${cdn.replace(/\/$/, '')}/${key}`;
  }
  if (bucket) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
  }

  // last-resort: make it site-relative so Next/Image accepts it
  return `/${key}`;
}
