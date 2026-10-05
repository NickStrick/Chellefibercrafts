'use client';

import { useCallback } from 'react';
import type { ShareSection, ShareItem, ShareStyle } from '@/types/site';
import type { EditorProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
// tiny immutable helper (matches your other editors)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditShare({
  section,
  onChange,
}: EditorProps<ShareSection>) {
  const items = section.items ?? [];
  const style = section.style ?? {};

  // ----- section field helpers -----
  const setField = useCallback(
    <K extends keyof ShareSection>(key: K, value: ShareSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const setStyle = useCallback(
    <K extends keyof ShareStyle>(key: K, value: ShareStyle[K]) => {
      onChange({ ...section, style: { ...(section.style ?? {}), [key]: value } });
    },
    [onChange, section]
  );

  // ----- items operations -----
  const addItem = useCallback(() => {
    const next = deepClone(section);
    const newItem: ShareItem = { label: 'QR', value: '', size: 220 };
    next.items = [...(next.items ?? []), newItem];
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
    (idx: number, patch: Partial<ShareItem>) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      arr[idx] = { ...(arr[idx] as ShareItem), ...patch };
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Share this site"
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

      {/* Style */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Variant</label>
          <select
            className="select w-full"
            value={style.variant ?? 'default'}
            onChange={(e) =>
              setStyle('variant', e.target.value as NonNullable<ShareStyle['variant']>)
            }
          >
            <option value="default">default</option>
            <option value="band">band</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Align</label>
          <select
            className="select w-full"
            value={style.align ?? 'left'}
            onChange={(e) =>
              setStyle('align', e.target.value as NonNullable<ShareStyle['align']>)
            }
          >
            <option value="left">left</option>
            <option value="center">center</option>
          </select>
        </div>

        <label className="flex items-end gap-2">
          <input
            type="checkbox"
            checked={!!style.actions}
            onChange={(e) => setStyle('actions', e.target.checked)}
          />
          <span className="pb-1">Show actions (copy/share/download)</span>
        </label>
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">QR Codes ({items.length})</div>
        <button className="btn btn-ghost" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add QR
          </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={`share-item-${i}`} className="card admin-card card-solid p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{it.label || 'QR'}</div>
              <div className="flex items-center gap-2">
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
                <button className="btn btn-ghost" onClick={() => removeItem(i)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">Label (optional)</label>
                <input
                  className="input w-full"
                  value={it.label ?? ''}
                  onChange={(e) => updateItem(i, { label: e.target.value })}
                  placeholder="e.g., Website, Booking, Contact"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium">URL (value)</label>
                <input
                  className="input w-full"
                  value={it.value ?? ''}
                  onChange={(e) => updateItem(i, { value: e.target.value })}
                  placeholder="Leave blank to use current page URL"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">Size (px)</label>
                <input
                  type="number"
                  className="input w-full"
                  min={80}
                  max={512}
                  value={it.size ?? 220}
                  onChange={(e) => updateItem(i, { size: Number(e.target.value || 0) })}
                />
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-muted">No QR codes yet. Click “Add QR”.</div>
        )}
      </div>
    </div>
  );
}
