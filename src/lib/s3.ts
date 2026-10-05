// src/lib/s3.ts
import {
  S3Client,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import type { GalleryItem, GallerySource } from '@/types/site';

const region = process.env.AWS_REGION!;
const accessId = process.env.AWS_ACCESS_KEY_ID!;
const secret = process.env.AWS_SECRET_ACCESS_KEY!;
const defaultBucket = process.env.S3_GALLERY_BUCKET || '';
const defaultPrefix = process.env.S3_GALLERY_PREFIX || '';
const defaultCDN = process.env.S3_GALLERY_CDN_BASE || '';

let _client: S3Client | null = null;
function client(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region,
    credentials: {
      accessKeyId: accessId,
      secretAccessKey: secret,
    },
  });
  return _client;
}

function toUrl(bucket: string, key: string, cdnBase?: string, rgn?: string) {
  if (cdnBase) return `${cdnBase.replace(/\/$/, '')}/${encodeURI(key)}`;
  const host = rgn
    ? `${bucket}.s3.${rgn}.amazonaws.com`
    : `${bucket}.s3.amazonaws.com`;
  return `https://${host}/${encodeURI(key)}`;
}

export async function getGalleryFromS3(
  source?: Extract<GallerySource, { type: 's3' }>
): Promise<GalleryItem[]> {
  const bucket = source?.bucket || defaultBucket;
  const prefix = source?.prefix ?? defaultPrefix;
  const rgn = source?.region || process.env.AWS_REGION;
  const cdn = source?.cdnBase || defaultCDN;
  const limit = source?.limit ?? 200;
  const recursive = source?.recursive ?? true;

  if (!bucket) {
    console.warn('S3: bucket not set; returning empty list');
    return [];
  }

  const s3 = client();
  const items: GalleryItem[] = [];
  let ContinuationToken: string | undefined = undefined;

  do {
    const res: ListObjectsV2CommandOutput = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken,
        Delimiter: recursive ? undefined : '/', // if not recursive, folders split
        MaxKeys: Math.min(1000, limit),
      })
    );

    const contents = res.Contents || [];
    for (const obj of contents) {
      if (!obj.Key) continue;
      if (!/\.(jpe?g|png|webp|gif|avif)$/i.test(obj.Key)) continue;

      items.push({
        imageUrl: toUrl(bucket, obj.Key, cdn, rgn),
        alt: obj.Key.split('/').pop() || 'Gallery image',
      });
      if (items.length >= limit) break;
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken && items.length < limit);

  return items;
}
