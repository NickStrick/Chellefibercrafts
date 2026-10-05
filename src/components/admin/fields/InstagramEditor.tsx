'use client';

import { useCallback } from 'react';
import type { InstagramSection } from '@/types/site';
import type { EditorProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export default function EditInstagram({
  section,
  onChange,
}: EditorProps<InstagramSection>) {
  const setField = <K extends keyof InstagramSection>(key: K, value: InstagramSection[K]) => {
    if (section[key] === value) return;
    onChange({ ...section, [key]: value });
  };

  const items = section.items ?? [];

  const addItem = useCallback(() => {
    const next = deepClone(section);
    next.items = [...(next.items ?? []), { url: '' }];
    onChange(next);
  }, [onChange, section]);

  const updateItem = useCallback(
    (idx: number, url: string) => {
      const next = deepClone(section);
      if (!next.items) next.items = [];
      next.items[idx] = { url };
      onChange(next);
    },
    [onChange, section]
  );

  const removeItem = useCallback(
    (idx: number) => {
      const next = deepClone(section);
      next.items = (next.items ?? []).filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-4">
      {/* Heading fields */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Instagram"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="Recent posts & reels"
          />
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium">Items ({items.length})</div>
          <button type="button" className="btn btn-inverted" onClick={addItem}>
            <FontAwesomeIcon icon={faPlus} className="text-xs" />Add URL
          </button>
        </div>

        <div className="grid gap-2">
          {items.map((it, i) => (
            <div key={`insta-${i}`} className="flex gap-2">
              <input
                className="input flex-1"
                value={it.url}
                onChange={(e) => updateItem(i, e.target.value)}
                placeholder="https://www.instagram.com/p/XXXX/ or /reel/XXXX/"
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeItem(i)}
                aria-label="Remove"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-sm text-muted">No Instagram URLs yet.</div>
          )}
        </div>
        <p className="text-xs text-muted">
          Tip: use post/reel permalinks. Multiple items render in a grid.
        </p>
      </div>

      {/* Layout & style */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Align</label>
          <select
            className="select w-full"
            value={section.align ?? 'left'}
            onChange={(e) => setField('align', e.target.value as InstagramSection['align'])}
          >
            <option value="left">left</option>
            <option value="center">center</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={String(section.columns ?? 2)}
            onChange={(e) => setField('columns', Number(e.target.value) as InstagramSection['columns'])}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Rounded</label>
          <select
            className="select w-full"
            value={section.rounded ?? 'xl'}
            onChange={(e) =>
              setField('rounded', e.target.value as NonNullable<InstagramSection['rounded']>)
            }
          >
            <option value="lg">lg</option>
            <option value="xl">xl</option>
            <option value="2xl">2xl</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Orientation</label>
          <select
            className="select w-full"
            value={section.orientation ?? 'profile'}
            onChange={(e) =>
              setField('orientation', e.target.value as InstagramSection['orientation'])
            }
          >
            <option value="profile">profile</option>
            <option value="landscape">landscape</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Max Width (px)</label>
          <input
            type="number"
            min={280}
            className="input w-full"
            value={section.maxWidth ?? 640}
            onChange={(e) => {
              const v = e.target.value;
              setField('maxWidth', v === '' ? undefined : Number(v));
            }}
            placeholder="640"
          />
        </div>
      </div>
    </div>
  );
}
