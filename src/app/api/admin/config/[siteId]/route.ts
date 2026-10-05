// src/app/api/admin/config/[siteId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// --- super lightweight "admin" guard (same header you've been using) ---
function assertAdmin(req: NextRequest): NextResponse | null {
  if (req.headers.get('x-local-admin') !== '1') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

// --- envs / S3 client ---
const REGION = process.env.AWS_REGION || 'us-east-2';
const BUCKET =
  process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET ||
  process.env.S3_GALLERY_BUCKET ||
  '';

const s3 = new S3Client({ region: REGION });

function keyFor(siteId: string) {
  // where we store the config JSON
  return `configs/${siteId}/site.json`;
}

// Helper for AWS SDK v3 body -> string
async function streamToString(stream: unknown): Promise<string> {
  if (!stream) return '';
  // Node.js Readable (has .on)
  if (typeof stream === 'object' && stream !== null && 'on' in stream && typeof (stream as Record<string, unknown>).on === 'function') {
    return await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const s = stream as NodeJS.ReadableStream;
      s.on('data', (chunk: Buffer) => chunks.push(chunk));
      s.on('error', reject);
      s.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
  }
  // Web ReadableStream
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
  // Fallback
  return String(stream);
}

// GET -> read the current config from S3
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const guard = assertAdmin(req);
  if (guard) return guard;

  if (!BUCKET) {
    return NextResponse.json({ error: 'Missing bucket' }, { status: 500 });
  }
  const siteId = (await params).siteId;
  const Key = keyFor(siteId);

  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key }));
    const text = await streamToString(out.Body);
    // validate it’s JSON
    const json = JSON.parse(text);
    return NextResponse.json(json, { status: 200 });
  } catch (err: unknown) {
    // If not found, return 404
    const e = err as { name?: string; $metadata?: { httpStatusCode?: number }; message?: string };
    if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message || 'Read failed' }, { status: 500 });
  }
}

// PUT -> write the config JSON to S3
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const guard = assertAdmin(req);
  if (guard) return guard;

  const siteId = (await params).siteId;
  const Key = keyFor(siteId);

  try {
    const body = await req.text(); // accept raw text
    // Make sure it's valid JSON (and return parsed version)
    const parsed = JSON.parse(body);

    // In mock mode, don't write to S3 (just echo back the parsed config).
    if (process.env.NEXT_PUBLIC_USE_MOCK === '2') {
      return NextResponse.json(parsed, { status: 200 });
    }

    if (!BUCKET) {
      return NextResponse.json({ error: 'Missing bucket' }, { status: 500 });
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key,
        Body: JSON.stringify(parsed, null, 2),
        ContentType: 'application/json; charset=utf-8',
        CacheControl: 'no-store',
      })
    );

    return NextResponse.json(parsed, { status: 200 });
  } catch (err: unknown) {
    // bad JSON?
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Body must be valid JSON' }, { status: 400 });
    }
    const e = err as { message?: string };
    return NextResponse.json({ error: e?.message || 'Write failed' }, { status: 500 });
  }
}
