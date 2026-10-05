'use client';

import { useCallback } from 'react';
import Image from 'next/image';
import type { ClassDetailSection } from '@/types/site';
import type { EditorProps } from './types';
import { useSite } from '@/context/SiteContext';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function EditClassDetail({ section, onChange }: EditorProps<ClassDetailSection>) {
  const { config } = useSite();
  const catalog = config?.classes?.classItems ?? [];

  const set = useCallback(
    <K extends keyof ClassDetailSection>(key: K, value: ClassDetailSection[K]) =>
      onChange({ ...section, [key]: value }),
    [onChange, section]
  );

  const selected = catalog.find((c) => c.id === section.classItemId) ?? null;
  const thumb = selected ? resolveAssetUrl(selected.thumbnailUrl ?? selected.images?.[0]?.url) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Class</label>
        <select
          className="select w-full"
          value={section.classItemId ?? ''}
          onChange={(e) => set('classItemId', e.target.value || undefined)}
        >
          <option value="">— Select a class —</option>
          {catalog.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name || 'Unnamed'}
            </option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="card admin-card card-solid p-3 flex items-center gap-3">
          {thumb && (
            <Image src={thumb} alt={selected.name} width={48} height={48} className="w-12 h-12 rounded object-cover flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{selected.name}</div>
            {selected.category && <div className="text-xs text-muted">{selected.category}</div>}
            <div className="text-xs text-muted">
              {(selected.times ?? []).length} time{(selected.times ?? []).length === 1 ? '' : 's'} scheduled
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium">Button label</label>
        <input
          className="input w-full"
          value={section.buyCtaFallback ?? 'Book Now'}
          onChange={(e) => set('buyCtaFallback', e.target.value)}
          placeholder="Book Now"
        />
      </div>

      {catalog.length === 0 && (
        <p className="text-sm text-muted">
          No classes in catalog. Add classes via the <strong>Classes</strong> button in the admin bar.
        </p>
      )}
    </div>
  );
}
