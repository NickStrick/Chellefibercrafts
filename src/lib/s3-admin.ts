// src/lib/s3-admin.ts
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  _Object as S3Object,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.AWS_REGION || 'us-east-1';

// Default buckets / cdn
const DEFAULT_BUCKET =
  process.env.S3_DEFAULT_BUCKET ||
  process.env.S3_GALLERY_BUCKET ||
  process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET ||
  '';

const CDN_BASE =
  process.env.NEXT_PUBLIC_S3_CDN_BASE ||
  process.env.S3_GALLERY_CDN_BASE ||
  process.env.NEXT_PUBLIC_S3_GALLERY_CDN_BASE ||
  '';

/** Create client; uses env creds if provided (local dev), or role if deployed */
export const s3 = new S3Client({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
  // SDK v3 defaults to attaching a flexible checksum (x-amz-checksum-crc32) to
  // every request, including presigned ones. At presign time there's no body
  // yet, so the placeholder checksum baked into the signature doesn't match
  // what the browser's plain PUT actually sends — S3 then rejects the
  // presigned upload with 403. Only compute checksums when explicitly asked.
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

/** Turn an S3 key into a public URL (prefers CloudFront if configured) */
export function urlFromKey(key: string, cdnBase: string = CDN_BASE): string {
  if (cdnBase) return `${cdnBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
  // Fallback to S3 website-style URL (public buckets) — often you’ll use CDN instead
  const bucket = DEFAULT_BUCKET;
  const host = `${bucket}.s3.${REGION}.amazonaws.com`;
  return `https://${host}/${encodeURI(key)}`;
}

/* ==========================
   ROUTE-USED HELPERS
   ========================== */

/** GET /api/admin/media → list objects */
export async function listObjects(opts: {
  prefix: string;
  bucket?: string;
  maxKeys?: number;
}): Promise<{
  items: {
    key: string;
    url: string;
    size?: number;
    lastModified?: Date;
    etag?: string;
  }[];
}> {
  const bucket = opts.bucket || DEFAULT_BUCKET;
  const maxKeys = typeof opts.maxKeys === 'number' ? opts.maxKeys : 1000;

  const res = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: opts.prefix,
      MaxKeys: maxKeys,
    })
  );

  const contents = (res.Contents || []) as S3Object[];
  const items = contents
    .filter((o) => !!o.Key && !o.Key.endsWith('/'))
    .map((o) => ({
      key: o.Key as string,
      url: urlFromKey(o.Key as string),
      size: o.Size,
      lastModified: o.LastModified,
      etag: o.ETag,
    }));

  return { items };
}

/** DELETE /api/admin/media → delete an object */
export async function deleteObject(opts: { key: string; bucket?: string }): Promise<void> {
  const bucket = opts.bucket || DEFAULT_BUCKET;
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: opts.key,
    })
  );
}

/** POST /api/admin/media/presign → presigned PUT for direct upload from browser */
export async function getPresignedPutUrl(opts: {
  key: string;
  contentType?: string;
  bucket?: string;
  expiresSec?: number; // default 300s
}): Promise<{ url: string; bucket: string; key: string }> {
  const bucket = opts.bucket || DEFAULT_BUCKET;
  const expiresIn = opts.expiresSec ?? 300;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType,
    // ACL intentionally omitted; prefer bucket policy / OAC for public access via CloudFront
  });

  const url = await getSignedUrl(s3, cmd, { expiresIn });
  return { url, bucket, key: opts.key };
}

// Helper for AWS SDK v3 body -> string (Node stream or Web ReadableStream)
async function streamToString(stream: unknown): Promise<string> {
  if (!stream) return '';
  if (typeof stream === 'object' && stream !== null && 'on' in stream && typeof (stream as Record<string, unknown>).on === 'function') {
    return await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const s = stream as NodeJS.ReadableStream;
      s.on('data', (chunk: Buffer) => chunks.push(chunk));
      s.on('error', reject);
      s.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
  if (typeof stream === 'object' && stream !== null && 'getReader' in stream && typeof (stream as Record<string, unknown>).getReader === 'function') {
    const reader = (stream as ReadableStream<Uint8Array>).getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    const merged = new Uint8Array(chunks.reduce((a, b) => a + b.length, 0));
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }
    return new TextDecoder().decode(merged);
  }
  return String(stream);
}

/** GET → read + parse a JSON object from S3. Returns null if the key doesn't exist. */
export async function getObjectJson<T = unknown>(opts: {
  key: string;
  bucket?: string;
}): Promise<T | null> {
  const bucket = opts.bucket || DEFAULT_BUCKET;
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: opts.key }));
    const text = await streamToString(out.Body);
    return JSON.parse(text) as T;
  } catch (err: unknown) {
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) return null;
    throw err;
  }
}

/** PUT /api/admin/config → save JSON config to S3 */
export async function saveConfigJson(opts: {
  key: string;            // e.g. "configs/carole/site.json"
  json: unknown;          // SiteConfig
  bucket?: string;
  cacheControl?: string;  // optional, e.g., 'no-cache'
}): Promise<void> {
  const bucket = opts.bucket || DEFAULT_BUCKET;
  const body = Buffer.from(JSON.stringify(opts.json, null, 2), 'utf-8');

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: opts.key,
      Body: body,
      ContentType: 'application/json; charset=utf-8',
      CacheControl: opts.cacheControl,
    })
  );
}

/* ==========================
   (OPTIONAL) BACKCOMPAT ALIASES
   If you were using older names elsewhere, keep these:
   ========================== */

// Previous names in your snippet:
export async function listUnderPrefix(opts: {
  bucket: string;
  prefix: string;
  maxKeys?: number;
}) {
  const { items } = await listObjects({
    bucket: opts.bucket,
    prefix: opts.prefix,
    maxKeys: opts.maxKeys,
  });
  return items.map((i) => ({
    key: i.key,
    size: i.size || 0,
    lastModified: i.lastModified?.toISOString() || '',
    etag: i.etag || '',
  }));
}

export async function presignPut(opts: {
  bucket: string;
  key: string;
  contentType?: string;
  expiresSec?: number;
}) {
  return getPresignedPutUrl(opts);
}

export async function deleteKey(opts: { bucket: string; key: string }) {
  return deleteObject(opts);
}
