// src/components/admin/MediaPicker.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { adminFetch } from '@/lib/adminClient';

type MediaItem = {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
};
type ListResponse = { items?: MediaItem[] };

export default function MediaPicker({
  bucket = process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET,
  prefix,
  onPick,
  multiple = false,
  onPickMany,
  initialSelected,
}: {
  bucket?: string;
  prefix: string; // e.g., "configs/carole/assets/" or "gallery/"
  onPick?: (key: string) => void;
  /** When true, renders checkboxes + an "Add Selected" button instead of a Pick button per item. */
  multiple?: boolean;
  onPickMany?: (keys: string[]) => void;
  /** Multi-select mode only: keys that should start checked (e.g. already used by the caller). */
  initialSelected?: string[];
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set(initialSelected));
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleSelected = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const cdnBase =
    process.env.NEXT_PUBLIC_S3_CDN_BASE ||
    process.env.NEXT_PUBLIC_S3_GALLERY_CDN_BASE ||
    '';

  const toUrl = useCallback(
    (key: string) => {
      if (!cdnBase) return key; // fallback (not ideal)
      return `${cdnBase.replace(/\/$/, '')}/${key.replace(/^\//, '')}`;
    },
    [cdnBase]
  );

  const list = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const qs = new URLSearchParams({ prefix, ...(bucket ? { bucket } : {}) });
      const res = await adminFetch(`/api/admin/media?${qs.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ListResponse;
      setItems(data.items ?? []);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to load';
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, [prefix, bucket]);

  useEffect(() => {
    void list();
  }, [list]);

  const onDelete = async (key: string) => {
    if (!confirm('Delete this file?')) return;
    const qs = new URLSearchParams({ key, ...(bucket ? { bucket } : {}) });
    const res = await adminFetch(`/api/admin/media?${qs.toString()}`, { method: 'DELETE' });
    if (!res.ok) {
      alert('Delete failed');
      return;
    }
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const onUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const key = `${prefix}${file.name}`; // simple; add collision handling later
      // 1) presign
      const res = await adminFetch('/api/admin/media/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket,
          key,
          contentType: file.type || 'application/octet-stream',
        }),
      });
      if (!res.ok) {
        console.error(await res.text());
        alert('Presign failed');
        return;
      }
      const { url } = (await res.json()) as { url: string };

      // 2) upload to S3 (PUT)
      const up = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!up.ok) {
        console.error(await up.text());
        alert('Upload failed');
        return;
      }
    }
    await list(); // refresh
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    void onUploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4 w-fit">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-eyebrow">Media</div>
          <div className="font-bold text-xl">
            Prefix: <code>{prefix}</code>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-inverted" onClick={() => inputRef.current?.click()}>
            Upload
          </button>
          <button className="btn btn-primary" onClick={list}>
            Refresh
          </button>
          {multiple && (
            <button
              className="btn btn-primary"
              disabled={selectedKeys.size === 0}
              onClick={() => onPickMany?.(Array.from(selectedKeys))}
            >
              Add Selected ({selectedKeys.size})
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void onUploadFiles(e.target.files)}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="border-2 border-dashed rounded-xl p-6 text-center text-muted"
      >
        Drag & drop files here or use the Upload button.
      </div>

      {err ? <div className="text-red-600">{err}</div> : null}
      {loading ? <div>Loading…</div> : null}

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {items.map((i) => (
          <div key={i.key} className="relative card admin-card card-solid p-2">
            {/* Preview (best effort). For non-images this may show as broken; OK for MVP */}
            <div className="relative w-full h-40 rounded-[var(--round-xl)] overflow-hidden">
              <Image
                src={toUrl(i.key)}
                alt={i.key}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {multiple && (
                <input
                  type="checkbox"
                  className="absolute top-2 left-2 h-5 w-5"
                  checked={selectedKeys.has(i.key)}
                  onChange={() => toggleSelected(i.key)}
                  aria-label={`Select ${i.key}`}
                />
              )}
            </div>
            <div className="mt-2 text-sm break-all">{i.key.replace(prefix, '')}</div>
            <div className="flex justify-end gap-2 mt-2">
              {multiple ? (
                <button className="btn btn-inverted" onClick={() => toggleSelected(i.key)}>
                  {selectedKeys.has(i.key) ? 'Selected ✓' : 'Select'}
                </button>
              ) : (
                <button className="btn btn-inverted" onClick={() => onPick?.(i.key)}>
                  Pick
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => onDelete(i.key)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading ? (
          <div className="text-muted">No files in this prefix yet.</div>
        ) : null}
      </div>
    </div>
  );
}
