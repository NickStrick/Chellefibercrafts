// src/lib/configStore.ts
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET =
  process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET ||
  process.env.S3_DEFAULT_BUCKET ||
  '';
const SITE_ID = process.env.NEXT_PUBLIC_SITE_ID || 'default';

export type ConfigVariant = 'draft' | 'published';

const s3 = new S3Client({ region: REGION });

function keyFor(variant: ConfigVariant) {
  return `configs/${SITE_ID}/${variant === 'published' ? 'site.published.json' : 'site.json'}`;
}
function backupKeyFor() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `configs/${SITE_ID}/backups/${ts}.json`;
}

export async function getConfigFromS3(variant: ConfigVariant = 'published'): Promise<unknown | null> {
  if (!BUCKET) return null;
  const Key = keyFor(variant);
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key }));
    const text = await out.Body!.transformToString();
    return JSON.parse(text);
  } catch {
    return null; // not found or parse error
  }
}

export async function putConfigToS3(json: unknown, variant: ConfigVariant = 'draft'): Promise<void> {
  if (!BUCKET) throw new Error('Missing S3 bucket env');
  const Key = keyFor(variant);
  const Body = Buffer.from(JSON.stringify(json, null, 2));
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key,
      Body,
      ContentType: 'application/json; charset=utf-8',
      // ACL intentionally omitted (use bucket policy/OAC)
    })
  );
}

export async function publishConfig(): Promise<void> {
  if (!BUCKET) throw new Error('Missing S3 bucket env');
  const CopySource = `/${BUCKET}/${keyFor('draft')}`;      // /bucket/key
  const Key = keyFor('published');
  await s3.send(new CopyObjectCommand({ Bucket: BUCKET, Key, CopySource }));
}

export async function backupDraft(): Promise<string> {
  if (!BUCKET) throw new Error('Missing S3 bucket env');
  const src = `/${BUCKET}/${keyFor('draft')}`;
  const dest = backupKeyFor();
  await s3.send(new CopyObjectCommand({ Bucket: BUCKET, Key: dest, CopySource: src }));
  return dest;
}
