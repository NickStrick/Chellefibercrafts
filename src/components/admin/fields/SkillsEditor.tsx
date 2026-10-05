'use client';

import { useCallback } from 'react';
import type { SkillsSection, SkillItem } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
// small immutable helper (kept consistent with your other editors)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditSkills({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<SkillsSection>) {
  const items = section.items ?? [];

  // generic field setter for top-level section fields
  const setField = useCallback(
    <K extends keyof SkillsSection>(key: K, value: SkillsSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const addItem = useCallback(() => {
    const next = deepClone(section);
    next.items = [...(next.items ?? []), { title: '', body: '', imageUrl: '' }];
    onChange(next);
  }, [onChange, section]);

  const removeItem = useCallback(
    (idx: number) => {
      const next = deepClone(section);
      next.items = (next.items ?? []).filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, section]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const updateItem = useCallback(
    (idx: number, patch: Partial<SkillItem>) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      arr[idx] = { ...(arr[idx] ?? { title: '' }), ...patch };
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-6">
      {/* Heading fields */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g., Skills & Capabilities"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="Optional supporting text"
          />
        </div>
      </div>

      {/* Layout options */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={section.columns ?? 3}
            onChange={(e) => setField('columns', Number(e.target.value) as SkillsSection['columns'])}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Items ({items.length})</div>
        <button className="btn btn-ghost" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add item
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={`skill-${i}`} className="card admin-card card-solid p-3 space-y-3">
            <div className="grid md:grid-cols-[1fr_auto_auto_auto] gap-2">
              <input
                className="input"
                placeholder="Title (required)"
                value={it.title}
                onChange={(e) => updateItem(i, { title: e.target.value })}
              />
              <button
                className="btn btn-ghost"
                onClick={() => moveItem(i, i - 1)}
                disabled={i === 0}
                title="Move up"
              >
                 <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => moveItem(i, i + 1)}
                disabled={i === items.length - 1}
                title="Move down"
              >
                <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => removeItem(i)}
                title="Remove item"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium">Body</label>
              <textarea
                className="textarea w-full"
                placeholder="Optional description"
                value={it.body ?? ''}
                onChange={(e) => updateItem(i, { body: e.target.value })}
              />
            </div>

            <div className="space-y-2">
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
                  placeholder="https://… or configs/{siteId}/assets/icon.png"
                  value={it.imageUrl ?? ''}
                  onChange={(e) => updateItem(i, { imageUrl: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-inverted"
                  onClick={async () => {
                    const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                    if (picked) updateItem(i, { imageUrl: picked });
                  }}
                >
                  Pick…
                </button>
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
