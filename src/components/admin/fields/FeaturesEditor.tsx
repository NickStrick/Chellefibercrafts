'use client';

import { useCallback } from 'react';
import type { FeaturesSection, FeatureMeta } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

// tiny immutable helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditFeatures({
  section,
  onChange,
  openMediaPicker,
  siteId, // not required but available if you want to scope picker prefixes
}: EditorProps<FeaturesSection>) {
  const items = section.items ?? [];

  const updateItem = useCallback(
    <K extends keyof FeaturesSection['items'][number]>(
      idx: number,
      key: K,
      value: FeaturesSection['items'][number][K]
    ) => {
      const copy = deepClone(section);
      copy.items[idx] = { ...(copy.items[idx] ?? {}), [key]: value };
      onChange(copy);
    },
    [onChange, section]
  );

  const addItem = useCallback(() => {
    const copy = deepClone(section);
    copy.items = [
      ...(copy.items ?? []),
      {
        title: 'New Feature',
        body: '',
        icon: '',
        link: '',
        imageUrl: '',
        imageSize: 'md',
        meta: [],
      },
    ];
    onChange(copy);
  }, [onChange, section]);

  const removeItem = useCallback(
    (idx: number) => {
      const copy = deepClone(section);
      copy.items = (copy.items ?? []).filter((_, i) => i !== idx);
      onChange(copy);
    },
    [onChange, section]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= items.length) return;
      const copy = deepClone(section);
      const arr = copy.items ?? [];
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      copy.items = arr;
      onChange(copy);
    },
    [items.length, onChange, section]
  );

  // ---- Meta helpers
  const addMeta = useCallback(
    (idx: number) => {
      const copy = deepClone(section);
      const metas = copy.items[idx].meta ?? [];
      metas.push({ label: '', value: '' });
      copy.items[idx].meta = metas;
      onChange(copy);
    },
    [onChange, section]
  );

  const updateMeta = useCallback(
    (
      itemIdx: number,
      metaIdx: number,
      patch: Partial<FeatureMeta>
    ) => {
      const copy = deepClone(section);
      const metas = copy.items[itemIdx].meta ?? [];
      metas[metaIdx] = { ...(metas[metaIdx] ?? { label: '', value: '' }), ...patch };
      copy.items[itemIdx].meta = metas;
      onChange(copy);
    },
    [onChange, section]
  );

  const removeMeta = useCallback(
    (itemIdx: number, metaIdx: number) => {
      const copy = deepClone(section);
      const metas = (copy.items[itemIdx].meta ?? []).filter((_, i) => i !== metaIdx);
      copy.items[itemIdx].meta = metas;
      onChange(copy);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-5">
      {/* Section title */}
      <div>
        <label className="block text-sm font-medium">Section Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="What we create"
        />
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="font-medium">Items ({items.length})</div>
        <button className="btn btn-inverted" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />Add item
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={`feature-${i}`} className="card admin-card card-solid p-3 space-y-3">
            {/* Move & remove */}
            <div className="flex items-center justify-between">
              <div className="font-semibold">Item {i + 1}</div>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost" onClick={() => moveItem(i, i - 1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => moveItem(i, i + 1)}
                  disabled={i === items.length - 1}
                >
                  ↓
                </button>
                <button className="btn btn-ghost" onClick={() => removeItem(i)}>
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            {/* Title / Body */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  className="input w-full"
                  value={it.title}
                  onChange={(e) => updateItem(i, 'title', e.target.value)}
                  placeholder="Celebration & Event Florals"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Link (optional)</label>
                <input
                  className="input w-full"
                  value={it.link ?? ''}
                  onChange={(e) => updateItem(i, 'link', e.target.value)}
                  placeholder="https://… or /contact"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Body</label>
              <textarea
                className="textarea w-full"
                value={it.body ?? ''}
                onChange={(e) => updateItem(i, 'body', e.target.value)}
                placeholder="Short description"
              />
            </div>

            {/* Icon / Image */}
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">Icon (optional)</label>
                <input
                  className="input w-full"
                  value={it.icon ?? ''}
                  onChange={(e) => updateItem(i, 'icon', e.target.value)}
                  placeholder="e.g. lucide:flower2"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium">Image URL (optional)</label>
                <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {it.imageUrl ? (
                    <img
                      src={resolveAssetUrl(it.imageUrl) ?? it.imageUrl}
                      alt="Image preview"
                      className="admin-image-preview"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={it.imageUrl ?? ''}
                    onChange={(e) => updateItem(i, 'imageUrl', e.target.value)}
                    placeholder="https://… or S3 key"
                  />
                  <button
                    type="button"
                    className="btn btn-inverted"
                    onClick={async () => {
                      const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                      if (picked) updateItem(i, 'imageUrl', picked);
                    }}
                  >
                    Pick…
                  </button>
                </div>
              </div>
            </div>

            {/* Image size */}
            <div>
              <label className="block text-sm font-medium">Image Size</label>
              <select
                className="select w-full md:w-48"
                value={it.imageSize ?? 'md'}
                onChange={(e) =>
                  updateItem(i, 'imageSize', e.target.value as NonNullable<typeof it.imageSize>)
                }
              >
                <option value="sm">sm</option>
                <option value="md">md</option>
                <option value="lg">lg</option>
              </select>
            </div>

            {/* Meta key/values */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Meta (label/value pairs)</div>
                <button className="btn btn-ghost" onClick={() => addMeta(i)}>
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />Add meta
                </button>
              </div>

              <div className="grid gap-2">
                {(it.meta ?? []).map((m, mi) => (
                  <div key={`meta-${i}-${mi}`} className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
                    <input
                      className="input"
                      placeholder="label (e.g. Stem type)"
                      value={m.label}
                      onChange={(e) => updateMeta(i, mi, { label: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="value (e.g. Peony)"
                      value={m.value}
                      onChange={(e) => updateMeta(i, mi, { value: e.target.value })}
                    />
                    <button className="btn btn-ghost" onClick={() => removeMeta(i, mi)}>
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                ))}
                {(it.meta ?? []).length === 0 && (
                  <div className="text-sm text-muted">No meta yet.</div>
                )}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm text-muted">No items yet. Click “Add item”.</div>
        )}
      </div>
    </div>
  );
}
