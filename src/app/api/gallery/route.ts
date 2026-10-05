// src/app/api/gallery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getGalleryFromS3 } from '@/lib/s3';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const prefix = searchParams.get('prefix') ?? undefined;
  const limit = Number(searchParams.get('limit') ?? '200');
  const recursive = searchParams.get('recursive') !== 'false';

  const items = await getGalleryFromS3({
    type: 's3',
    prefix,
    limit,
    recursive,
  });

  return NextResponse.json({ items });
}
