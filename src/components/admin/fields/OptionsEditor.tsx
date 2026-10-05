'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { ProductOptions, ProductOptionItem } from '@/types/site';
import CurrencyInput from './CurrencyInput';

// Shared by ProductsModal and ClassesModal — "Size / Option Variants" editor
// (e.g. product Size: S/M/L, or class Size: 4x4/5x5/6x6), each item with its own price.
export function OptionsEditor({
  options,
  basePrice,
  onChange,
}: {
  options: ProductOptions[];
  basePrice: number;
  onChange: (next: ProductOptions[]) => void;
}) {
  function addGroup() {
    onChange([...options, { label: 'Size', optionItems: [{ label: 'Standard', price: basePrice }] }]);
  }

  function updateGroup(gi: number, patch: Partial<ProductOptions>) {
    onChange(options.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  }

  function removeGroup(gi: number) {
    onChange(options.filter((_, i) => i !== gi));
  }

  function addItem(gi: number) {
    onChange(
      options.map((g, i) => {
        if (i !== gi) return g;
        const items = [...(g.optionItems ?? []), { label: '', price: basePrice }];
        return { ...g, optionItems: items };
      })
    );
  }

  function updateItem(gi: number, ii: number, patch: Partial<ProductOptionItem>) {
    onChange(
      options.map((g, i) => {
        if (i !== gi) return g;
        const items = (g.optionItems ?? []).map((it, j) => (j === ii ? { ...it, ...patch } : it));
        return { ...g, optionItems: items };
      })
    );
  }

  function removeItem(gi: number, ii: number) {
    onChange(
      options.map((g, i) => {
        if (i !== gi) return g;
        return { ...g, optionItems: (g.optionItems ?? []).filter((_, j) => j !== ii) };
      })
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b pb-1">
        <span className="text-sm font-semibold">Size / Option Variants</span>
        <button type="button" className="btn btn-ghost text-sm" onClick={addGroup}>
          <Plus className="w-3 h-3 inline mr-1" />Add group
        </button>
      </div>

      {options.length === 0 && (
        <p className="text-xs text-muted">No variants — base price used at checkout.</p>
      )}

      {options.map((g, gi) => (
        <div key={gi} className="rounded-xl border p-3 space-y-2">
          <div className="flex gap-2 items-center">
            <input
              className="input flex-1"
              placeholder="Group label (e.g. Size)"
              value={g.label}
              onChange={(e) => updateGroup(gi, { label: e.target.value })}
            />
            <button type="button" className="btn btn-ghost text-sm" onClick={() => addItem(gi)}>
              <Plus className="w-3 h-3 inline mr-1" />Item
            </button>
            <button type="button" className="btn btn-ghost text-red-500 text-sm" onClick={() => removeGroup(gi)}>
              <Trash2 className="w-4 h-4 mr-1 inline" /> Remove
            </button>
          </div>

          {(g.optionItems ?? []).length === 0 && (
            <p className="text-xs text-muted pl-1">No items yet.</p>
          )}

          <div className="space-y-1.5">
            {/* Column headers */}
            {(g.optionItems ?? []).length > 0 && (
              <div className="grid grid-cols-[1fr_100px_100px_60px_auto] gap-2 px-1">
                <span className="text-xs text-muted">Label</span>
                <span className="text-xs text-muted">Value</span>
                <span className="text-xs text-muted">Price</span>
                <span className="text-xs text-muted text-center">Default</span>
                <span />
              </div>
            )}
            {(g.optionItems ?? []).map((it, ii) => (
              <div key={ii} className="grid grid-cols-[1fr_100px_100px_60px_auto] gap-2 items-center">
                <input
                  className="input"
                  placeholder="e.g. Standard"
                  value={it.label}
                  onChange={(e) => updateItem(gi, ii, { label: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="e.g. S"
                  value={it.value ?? ''}
                  onChange={(e) => updateItem(gi, ii, { value: e.target.value })}
                />
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs opacity-50">$</span>
                  <CurrencyInput
                    className="input w-full pl-5"
                    cents={it.price}
                    onChange={(cents) => updateItem(gi, ii, { price: cents })}
                  />
                </div>
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    title="Default selection"
                    checked={it.default === true}
                    onChange={(e) => updateItem(gi, ii, { default: e.target.checked })}
                    className="accent-[var(--admin-primary)]"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-ghost p-1 text-red-500"
                  onClick={() => removeItem(gi, ii)}
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default OptionsEditor;
