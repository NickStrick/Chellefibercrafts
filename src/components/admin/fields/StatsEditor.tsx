'use client';

import { useCallback } from 'react';
import type { StatsSection, StatsStyle, StatItem } from '@/types/site';
import type { EditorProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
// keep parity with your other editors
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditStats({
  section,
  onChange,
}: EditorProps<StatsSection>) {
  const style = section.style ?? {};
  const items = section.items ?? [];

  // ---- section/style setters ----
  const setField = useCallback(
    <K extends keyof StatsSection>(key: K, value: StatsSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const setStyle = useCallback(
    <K extends keyof StatsStyle>(key: K, value: StatsStyle[K]) => {
      onChange({ ...section, style: { ...(section.style ?? {}), [key]: value } });
    },
    [onChange, section]
  );

  // ---- items ops ----
  const addItem = useCallback(() => {
    const next = deepClone(section);
    const newItem: StatItem = { value: 0, label: 'Label', prefix: '', suffix: '', decimals: 0 };
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
      const [sp] = arr.splice(from, 1);
      arr.splice(to, 0, sp);
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const updateItem = useCallback(
    (idx: number, patch: Partial<StatItem>) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      arr[idx] = { ...(arr[idx] as StatItem), ...patch };
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
            placeholder="Key Numbers"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="What we’ve accomplished"
          />
        </div>
      </div>

      {/* Style */}
      <div className="grid md:grid-cols-5 gap-3">
        <div>
          <label className="block text-sm font-medium">Align</label>
          <select
            className="select w-full"
            value={style.align ?? 'left'}
            onChange={(e) => setStyle('align', e.target.value as NonNullable<StatsStyle['align']>)}
          >
            <option value="left">left</option>
            <option value="center">center</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={style.columns ?? 3}
            onChange={(e) => setStyle('columns', Number(e.target.value) as NonNullable<StatsStyle['columns']>)}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <input
            id="stats-compact"
            type="checkbox"
            className="checkbox"
            checked={!!style.compact}
            onChange={(e) => setStyle('compact', e.target.checked)}
          />
          <label htmlFor="stats-compact" className="text-sm">Compact</label>
        </div>

        <div>
          <label className="block text-sm font-medium">Divider</label>
          <select
            className="select w-full"
            value={style.divider ?? 'none'}
            onChange={(e) => setStyle('divider', e.target.value as NonNullable<StatsStyle['divider']>)}
          >
            <option value="none">none</option>
            <option value="dot">dot</option>
            <option value="line">line</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Color</label>
          <select
            className="select w-full"
            value={style.color ?? 'default'}
            onChange={(e) => setStyle('color', e.target.value as NonNullable<StatsStyle['color']>)}
          >
            <option value="default">default</option>
            <option value="accent">accent</option>
            <option value="primary">primary</option>
          </select>
        </div>
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Stats ({items.length})</div>
        <button className="btn btn-ghost" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Stat
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={`stat-${idx}`} className="card admin-card card-solid p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-medium">{it.label || 'New Stat'}</div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => moveItem(idx, idx - 1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                   <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => moveItem(idx, idx + 1)}
                  disabled={idx === items.length - 1}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </button>
                <button className="btn btn-ghost" onClick={() => removeItem(idx)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Label</label>
                <input
                  className="input w-full"
                  value={it.label}
                  onChange={(e) => updateItem(idx, { label: e.target.value })}
                  placeholder="Users"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Value</label>
                <input
                  className="input w-full"
                  type="number"
                  value={Number.isFinite(it.value) ? it.value : 0}
                  onChange={(e) => updateItem(idx, { value: Number(e.target.value) })}
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Prefix</label>
                <input
                  className="input w-full"
                  value={it.prefix ?? ''}
                  onChange={(e) => updateItem(idx, { prefix: e.target.value })}
                  placeholder="$"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Suffix</label>
                <input
                  className="input w-full"
                  value={it.suffix ?? ''}
                  onChange={(e) => updateItem(idx, { suffix: e.target.value })}
                  placeholder="% / + / k"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium">Decimals</label>
                <input
                  className="input w-full"
                  type="number"
                  min={0}
                  max={6}
                  value={Number.isFinite(it.decimals) ? it.decimals : 0}
                  onChange={(e) => updateItem(idx, { decimals: Math.max(0, Math.min(6, Number(e.target.value))) })}
                  placeholder="0–6"
                />
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-muted">No stats yet. Click “Add Stat”.</div>
        )}
      </div>
    </div>
  );
}
