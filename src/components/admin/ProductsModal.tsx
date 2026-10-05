'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Star, Trash2, X } from 'lucide-react';
import type { SiteConfig, SiteProduct, SiteProductsConfig } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import { resolveAssetUrl } from '@/lib/assetUrl';
import MediaPicker from './MediaPicker';
import { OptionsEditor } from './fields/OptionsEditor';
import CurrencyInput from './fields/CurrencyInput';

// ─── Utilities ────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function rid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function blankProduct(category = ''): LocalProduct {
  return {
    _localId: rid(),
    id: `product-${rid().slice(0, 8)}`,
    name: '',
    category,
    subtitle: '',
    price: 0,
    compareAtPrice: undefined,
    currency: 'USD',
    thumbnailUrl: '',
    summary: '',
    featured: false,
    hideFromShop: false,
    stock: 'in_stock',
    ctaLabel: '',
    options: [],
  };
}

// ─── Local Types ──────────────────────────────────────────────────────────────

type LocalProduct = SiteProduct & { _localId: string };

// ─── Category Field ───────────────────────────────────────────────────────────

function CategoryField({
  value,
  categories,
  onChange,
}: {
  value: string;
  categories: string[];
  onChange: (cat: string) => void;
}) {
  const [newMode, setNewMode] = useState(false);

  if (newMode) {
    return (
      <div className="flex gap-2">
        <input
          className="input flex-1"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="New category name"
          onKeyDown={(e) => { if (e.key === 'Enter') setNewMode(false); }}
        />
        <button type="button" className="btn btn-ghost text-sm" onClick={() => setNewMode(false)}>
          Done
        </button>
      </div>
    );
  }

  return (
    <select
      className="select w-full"
      value={categories.includes(value) ? value : (value === '' ? '' : '__new_typing__')}
      onChange={(e) => {
        if (e.target.value === '__new__') {
          setNewMode(true);
          onChange('');
        } else {
          onChange(e.target.value);
        }
      }}
    >
      <option value="">— None —</option>
      {categories.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
      {value && !categories.includes(value) && (
        <option value="__new_typing__">{value}</option>
      )}
      <option value="__new__">+ New category…</option>
    </select>
  );
}

// ─── Product Edit Form ────────────────────────────────────────────────────────

function ProductEditForm({
  product,
  categories,
  onChange,
  onRemove,
  onDone,
  openMediaPicker,
  siteId,
}: {
  product: LocalProduct;
  categories: string[];
  onChange: (patch: Partial<LocalProduct>) => void;
  onRemove: () => void;
  onDone: () => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
}) {
  const thumb = resolveAssetUrl(product.thumbnailUrl);

  return (
    <div
      className="card admin-card card-solid p-4 space-y-4"
      onBlurCapture={(e) => {
        const nextFocused = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(nextFocused)) {
          onDone();
        }
      }}
    >

      {/* Name + Subtitle */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            className="input w-full"
            value={product.name ?? ''}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Product name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            className="input w-full"
            value={product.subtitle ?? ''}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Short descriptor"
          />
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium mb-1">Category / Occasion</label>
        <CategoryField
          value={product.category ?? ''}
          categories={categories}
          onChange={(cat) => onChange({ category: cat })}
        />
      </div>

      {/* Prices */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Base Price ($)</label>
          <CurrencyInput
            cents={product.price}
            onChange={(cents) => onChange({ price: cents })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Compare-at Price ($)</label>
          <CurrencyInput
            cents={product.compareAtPrice}
            onChange={(cents) => onChange({ compareAtPrice: cents > 0 ? cents : undefined })}
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Thumbnail</label>
        {thumb && (
          <div className="h-24 w-24 overflow-hidden rounded-lg border border-gray-200 bg-black/10">
            <img src={thumb} alt="Thumbnail preview" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={product.thumbnailUrl ?? ''}
            onChange={(e) => onChange({ thumbnailUrl: e.target.value })}
            placeholder={`configs/${siteId}/assets/… or https://…`}
          />
          <button
            type="button"
            className="btn btn-inverted flex-shrink-0"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (picked) onChange({ thumbnailUrl: picked });
            }}
          >
            Pick…
          </button>
        </div>
      </div>

      {/* Summary */}
      <div>
        <label className="block text-sm font-medium mb-1">Summary</label>
        <textarea
          className="input w-full"
          rows={2}
          value={product.summary ?? ''}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="Short product blurb"
        />
      </div>

      {/* Options / Variants */}
      <OptionsEditor
        options={product.options ?? []}
        basePrice={product.price}
        onChange={(next) => onChange({ options: next })}
      />

      {/* Stock + CTA + Featured + Hide from shop */}
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <select
            className="select w-full"
            value={product.stock ?? 'in_stock'}
            onChange={(e) => onChange({ stock: e.target.value as SiteProduct['stock'] })}
          >
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Button Text/label</label>
          <input
            className="input w-full"
            value={product.ctaLabel ?? ''}
            onChange={(e) => onChange({ ctaLabel: e.target.value })}
            placeholder="Buy Now"
          />
        </div>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={product.featured === true}
            onChange={(e) => onChange({ featured: e.target.checked })}
            className="accent-[var(--admin-primary)]"
          />
          <span className="text-sm">Featured</span>
        </label>
        <label className="flex items-end gap-2 pb-2">
          <input
            type="checkbox"
            checked={product.hideFromShop === true}
            onChange={(e) => onChange({ hideFromShop: e.target.checked })}
            className="accent-[var(--admin-primary)]"
          />
          <span className="text-sm">Hide from shop</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-1">
        <button type="button" className="btn btn-ghost text-red-500 text-sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4 mr-1 inline" /> Remove
        </button>
        <button type="button" className="btn btn-primary text-sm" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onEdit,
  onRemove,
}: {
  product: LocalProduct;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const thumb = resolveAssetUrl(product.thumbnailUrl);
  return (
    <div className="card admin-card card-solid flex gap-3 p-3">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-black/10">
        {thumb ? (
          <img src={thumb} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-semibold text-sm truncate">{product.name || <em className="opacity-40">Unnamed</em>}</span>
          {product.featured && (
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
        </div>
        {product.category && (
          <span className="text-xs opacity-50">{product.category}</span>
        )}
        <div className="text-sm font-medium mt-0.5">
          {product.price > 0 ? formatPrice(product.price, product.currency) : <span className="opacity-30">No price</span>}
        </div>
        {(product.options ?? []).length > 0 && (
          <div className="text-xs opacity-50 mt-0.5">
            {product.options!.map((g) => `${g.label}: ${(g.optionItems ?? []).map((it) => it.label).join(', ')}`).join(' · ')}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button className="btn btn-ghost p-1" onClick={onEdit} aria-label="Edit product">
          <Pencil className="w-4 h-4" />
        </button>
        <button className="btn btn-ghost p-1 text-red-500" onClick={onRemove} aria-label="Remove product">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ProductsModal ─────────────────────────────────────────────────────────────

export type ProductsModalProps = { onClose: () => void };

export default function ProductsModal({ onClose }: ProductsModalProps) {
  const { config, setConfig } = useSite();
  const siteId = getSiteId();

  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const originalRef = useRef<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localProducts, setLocalProducts] = useState<LocalProduct[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const [draggingCategory, setDraggingCategory] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  // ── Media picker ──────────────────────────────────────────────────────────
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPrefix, setPickerPrefix] = useState(`configs/${siteId}/assets/`);
  const pickerResolveRef = useRef<((key: string | null) => void) | null>(null);

  const openMediaPicker = useCallback((prefix: string): Promise<string | null> => {
    setPickerPrefix(prefix);
    setPickerOpen(true);
    return new Promise<string | null>((resolve) => {
      pickerResolveRef.current = resolve;
    });
  }, []);

  const handlePick = useCallback((key: string) => {
    pickerResolveRef.current?.(key);
    pickerResolveRef.current = null;
    setPickerOpen(false);
  }, []);

  const handleCancelPick = useCallback(() => {
    pickerResolveRef.current?.(null);
    pickerResolveRef.current = null;
    setPickerOpen(false);
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (config) {
      const copy = deepClone(config);
      setDraft(copy);
      originalRef.current = copy;
      setLocalProducts(
        (copy.products?.items ?? []).map((p) => ({ ...p, _localId: rid() }))
      );
    }
  }, [config]);

  const shopConfig = useMemo<SiteProductsConfig>(
    () => draft?.products ?? { items: [] },
    [draft?.products]
  );

  const setCategoryOrder = useCallback((next: string[]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        products: { ...(prev.products ?? { items: [] }), categoryOrder: next },
      };
    });
  }, []);

  const categoryOrder = shopConfig.categoryOrder ?? [];
  const categories = useMemo(() => {
    const seen: string[] = [];
    const seenSet = new Set<string>();
    for (const p of localProducts) {
      if (!p.category) continue;
      if (seenSet.has(p.category)) continue;
      seenSet.add(p.category);
      seen.push(p.category);
    }

    const ordered: string[] = [];
    const orderSet = new Set(categoryOrder);
    for (const c of categoryOrder) if (seenSet.has(c)) ordered.push(c);
    for (const c of seen) if (!orderSet.has(c)) ordered.push(c);
    return ordered;
  }, [localProducts, categoryOrder]);

  useEffect(() => {
    if (activeTab === 'all') return;
    if (!categories.includes(activeTab)) setActiveTab('all');
  }, [activeTab, categories]);

  const handleDropCategory = useCallback(
    (target: string) => {
      if (!draggingCategory) return;
      if (draggingCategory === target) return;

      const next = [...categories];
      const from = next.indexOf(draggingCategory);
      const to = next.indexOf(target);
      if (from < 0 || to < 0) return;

      next.splice(from, 1);
      next.splice(to, 0, draggingCategory);
      setCategoryOrder(next);
    },
    [categories, draggingCategory, setCategoryOrder]
  );

  const tabProducts = useMemo(
    () =>
      (() => {
        const rank = (category?: string) => {
          if (!category) return -1;
          const idx = categories.indexOf(category);
          return idx === -1 ? Number.MAX_SAFE_INTEGER - 1 : idx;
        };

        return localProducts
          .map((p, i) => ({ p, i }))
          .filter(({ p }) => activeTab === 'all' || p.category === activeTab)
          .sort((a, b) => {
            const af = a.p.featured === true ? 0 : 1;
            const bf = b.p.featured === true ? 0 : 1;
            if (af !== bf) return af - bf;

            if (activeTab !== 'all') return a.i - b.i;

            const ar = rank(a.p.category);
            const br = rank(b.p.category);
            return ar !== br ? ar - br : a.i - b.i; // stable
          })
          .map(({ p }) => p);
      })(),
    [localProducts, activeTab, categories]
  );

  // ── Mutations ─────────────────────────────────────────────────────────────
  const commitProducts = useCallback((next: LocalProduct[]) => {
    setLocalProducts(next);
    setDraft((prev) => {
      if (!prev) return prev;
      const items: SiteProduct[] = next.map(({ _localId: _, ...p }) => p);
      return { ...prev, products: { ...(prev.products ?? {}), items } };
    });
  }, []);

  const updateShowFilters = useCallback((val: boolean) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, products: { ...(prev.products ?? { items: [] }), showFilters: val } };
    });
  }, []);

  const addProduct = useCallback(() => {
    const defaultCategory = activeTab === 'all' ? '' : activeTab;
    const p = blankProduct(defaultCategory);
    const next = [p, ...localProducts]; // prepend — new product at top
    commitProducts(next);
    setEditingId(p._localId);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }, [commitProducts, localProducts, activeTab]);

  const updateProduct = useCallback(
    (localId: string, patch: Partial<LocalProduct>) => {
      commitProducts(localProducts.map((p) => (p._localId === localId ? { ...p, ...patch } : p)));
    },
    [commitProducts, localProducts]
  );

  const finishEditing = useCallback(
    (localId: string) => {
      const product = localProducts.find((p) => p._localId === localId);
      if (!product) {
        setEditingId(null);
        return;
      }
      if (!(product.name ?? '').trim()) {
        commitProducts(localProducts.filter((p) => p._localId !== localId));
        if (editingId === localId) setEditingId(null);
        return;
      }
      if (editingId === localId) setEditingId(null);
    },
    [commitProducts, editingId, localProducts]
  );

  const removeProduct = useCallback(
    (localId: string) => {
      commitProducts(localProducts.filter((p) => p._localId !== localId));
      if (editingId === localId) setEditingId(null);
    },
    [commitProducts, editingId, localProducts]
  );

  const isDirty = useMemo(() => {
    if (!draft || !originalRef.current) return false;
    return JSON.stringify(draft) !== JSON.stringify(originalRef.current);
  }, [draft]);

  // ── Save / Restore ────────────────────────────────────────────────────────
  const onSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const variant = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? 'draft') as 'draft' | 'published';
      const res = await fetch(
        `/api/admin/config/${encodeURIComponent(siteId)}?variant=${variant}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-local-admin': '1' },
          body: JSON.stringify(draft),
        }
      );
      if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
      const saved: SiteConfig = await res.json();
      setConfig(saved);
      originalRef.current = deepClone(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }, [draft, onClose, setConfig, siteId]);

  const onRestore = useCallback(() => {
    if (!originalRef.current) return;
    const restored = deepClone(originalRef.current);
    setDraft(restored);
    setLocalProducts((restored.products?.items ?? []).map((p) => ({ ...p, _localId: rid() })));
    setEditingId(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!draft) {
    return (
      <div className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card p-6 text-sm text-muted">
          Loading...
          <div className="mt-4 text-right">
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed edit-modal inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card card-solid p-4 relative w-full max-w-full overflow-hidden card-screen-height flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="font-semibold text-lg">Products</div>
            <div className="flex items-center gap-2">
              {error && <div className="text-red-500 text-sm mr-2">{error}</div>}
              {isDirty && (
                <button className="btn btn-ghost" onClick={onRestore}>Restore</button>
              )}
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={onSave} disabled={!draft || saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Show-filters toggle */}
          <div className="px-4 pt-4 flex-shrink-0">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={shopConfig.showFilters !== false}
                onChange={(e) => updateShowFilters(e.target.checked)}
                className="accent-[var(--admin-primary)]"
              />
              Show filters sidebar in shop
            </label>
          </div>

          {/* Category tabs + Add button */}
          <div className="px-4 pt-4 flex-shrink-0">
            <div className="flex items-center justify-between border-b pb-0">
              <div className="flex gap-4 flex-wrap">
                {['all', ...categories].map((tab) => (
                  <button
                    key={tab}
                    className={[
                      'px-3 py-2 -mb-px text-sm font-semibold border-b-4 transition-colors admin-tab',
                      activeTab === tab
                        ? 'border-transparent text-white active'
                        : 'border-transparent text-gray-300 hover:text-[var(--admin-primary)]',
                      tab !== 'all' ? 'cursor-move' : '',
                      dragOverCategory === tab ? 'bg-white/5' : '',
                    ].join(' ')}
                    draggable={tab !== 'all'}
                    onDragStart={(e) => {
                      if (tab === 'all') return;
                      setDraggingCategory(tab);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', tab);
                    }}
                    onDragEnd={() => {
                      setDraggingCategory(null);
                      setDragOverCategory(null);
                    }}
                    onDragOver={(e) => {
                      if (tab === 'all' || !draggingCategory) return;
                      e.preventDefault();
                      setDragOverCategory(tab);
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDragLeave={() => {
                      if (tab === dragOverCategory) setDragOverCategory(null);
                    }}
                    onDrop={(e) => {
                      if (tab === 'all') return;
                      e.preventDefault();
                      handleDropCategory(tab);
                      setDragOverCategory(null);
                    }}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab === 'all'
                      ? `All (${localProducts.length})`
                      : `${tab} (${localProducts.filter((p) => p.category === tab).length})`}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary mb-2 flex items-center gap-1 text-sm"
                onClick={addProduct}
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>
            </div>
          </div>

          {/* Product list */}
          <div ref={listRef} className="flex-1 overflow-auto p-4">
            {tabProducts.length === 0 ? (
              <div className="text-sm text-muted py-8 text-center">
                {activeTab === 'all'
                  ? 'No products yet. Click "Add Product" to get started.'
                  : `No products in "${activeTab}".`}
              </div>
            ) : (
              <div className="space-y-3">
                {tabProducts.map((p) =>
                  editingId === p._localId ? (
                    <ProductEditForm
                      key={p._localId}
                      product={p}
                      categories={categories}
                      onChange={(patch) => updateProduct(p._localId, patch)}
                      onRemove={() => removeProduct(p._localId)}
                      onDone={() => finishEditing(p._localId)}
                      openMediaPicker={openMediaPicker}
                      siteId={siteId}
                    />
                  ) : (
                    <ProductCard
                      key={p._localId}
                      product={p}
                      onEdit={() => setEditingId(p._localId)}
                      onRemove={() => removeProduct(p._localId)}
                    />
                  )
                )}
              </div>
            )}
          </div>

          {/* Close button (mobile) */}
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-white md:hidden"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Media picker overlay */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[13000] bg-black/60 flex items-center justify-center p-4">
          <div className="card admin-card card-solid p-4 w-full max-w-2xl max-h-[80vh] overflow-auto relative">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Pick an image</span>
              <button className="btn btn-ghost" onClick={handleCancelPick}>Cancel</button>
            </div>
            <MediaPicker prefix={pickerPrefix} onPick={handlePick} />
          </div>
        </div>
      )}
    </>
  );
}
