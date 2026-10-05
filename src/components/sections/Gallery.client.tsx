// src/components/sections/Gallery.client.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Gallery from './Gallery';
import type { GalleryItem, GallerySection, GallerySource } from '@/types/site';

type Props = Omit<GallerySection, 'items'> & { items?: GalleryItem[] };

// Type guard: narrows GallerySource to the 's3' variant
function isS3Source(src?: GallerySource): src is Extract<GallerySource, { type: 's3' }> {
  return !!src && src.type === 's3';
}

type GalleryListResponse = { items?: GalleryItem[] };

export default function GalleryClient({ source, items: initialItems, ...rest }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems ?? []);
  const [error, setError] = useState<string | null>(null);

  // Narrow once and memoize
  const s3 = useMemo(() => (isS3Source(source) ? source : undefined), [source]);

  useEffect(() => {
    if (!s3) return; // static/manual mode → nothing to fetch

    const controller = new AbortController();
    const qs = new URLSearchParams();
    if (s3.prefix) qs.set('prefix', s3.prefix);
    if (typeof s3.limit === 'number') qs.set('limit', String(s3.limit));
    if (s3.recursive === false) qs.set('recursive', 'false');

    (async () => {
      try {
        setError(null);
        const res = await fetch(`/api/gallery?${qs.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as GalleryListResponse;
        setItems(data.items ?? []);
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') {
          return;
        }
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === 'string'
            ? e
            : 'Failed to load gallery';
        setError(msg);
      }
    })();

    return () => controller.abort();
  }, [s3]); // s3 is memoized → stable deps

  if (error) {
    return (
      <section className="section">
        <div className="mx-auto max-w-6xl text-red-600">Could not load gallery: {error}</div>
      </section>
    );
  }

  return <Gallery {...(rest as GallerySection)} items={items} />;
}
