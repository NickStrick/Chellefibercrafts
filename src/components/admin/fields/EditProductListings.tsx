'use client';

import { useCallback, useMemo } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { ProductListingsSection } from '@/types/site';
import type { EditorProps } from './types';
import { useSite } from '@/context/SiteContext';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function EditProductListings({
  section,
  onChange,
}: EditorProps<ProductListingsSection>) {
  const { config } = useSite();
  const catalog = config?.products?.items ?? [];

  const set = useCallback(
    <K extends keyof ProductListingsSection>(key: K, value: ProductListingsSection[K]) =>
      onChange({ ...section, [key]: value }),
    [onChange, section]
  );

  const setStyle = useCallback(
    (patch: Partial<NonNullable<ProductListingsSection['style']>>) =>
      onChange({ ...section, style: { ...(section.style ?? {}), ...patch } }),
    [onChange, section]
  );

  const productIds = useMemo(() => section.productIds ?? [], [section.productIds]);
  const style = section.style ?? {};

  // Selected product helpers
  const addProduct = useCallback((id: string) => {
    if (productIds.includes(id)) return;
    set('productIds', [...productIds, id]);
  }, [productIds, set]);

  const removeProduct = useCallback((id: string) => {
    set('productIds', productIds.filter((pid) => pid !== id));
  }, [productIds, set]);

  const moveProduct = useCallback((from: number, to: number) => {
    if (to < 0 || to >= productIds.length) return;
    const next = productIds.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    set('productIds', next);
  }, [productIds, set]);

  const unselected = catalog.filter((p) => !productIds.includes(p.id));

  return (
    <div className="space-y-5">

      {/* Heading */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Featured Products"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="Handcrafted with care"
          />
        </div>
      </div>

      {/* Style */}
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={style.columns ?? 3}
            onChange={(e) => setStyle({ columns: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
          >
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Card variant</label>
          <select
            className="select w-full"
            value={style.cardVariant ?? 'default'}
            onChange={(e) => setStyle({ cardVariant: e.target.value as 'default' | 'ink' })}
          >
            <option value="default">Default</option>
            <option value="ink">Ink</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">View type</label>
          <select
            className="select w-full"
            value={section.viewType ?? 'featured'}
            onChange={(e) => set('viewType', e.target.value as 'list' | 'featured')}
          >
            <option value="featured">Featured</option>
            <option value="list">List</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Show-all threshold</label>
          <input
            type="number"
            min={1}
            className="input w-full"
            value={section.showAllThreshold ?? 3}
            onChange={(e) => set('showAllThreshold', Math.max(1, Number(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Buy CTA label</label>
          <input
            className="input w-full"
            value={section.buyCtaFallback ?? 'Buy Now'}
            onChange={(e) => set('buyCtaFallback', e.target.value)}
            placeholder="Buy Now"
          />
        </div>
        <label className="flex items-end gap-2 pb-1">
          <input
            type="checkbox"
            checked={style.showBadges !== false}
            onChange={(e) => setStyle({ showBadges: e.target.checked })}
          />
          <span className="text-sm">Show badges</span>
        </label>
      </div>

      {/* Selected products */}
      <div className="space-y-2">
        <div className="text-sm font-semibold border-b pb-1">
          Selected products ({productIds.length})
        </div>

        {productIds.length === 0 && (
          <p className="text-sm text-muted">No products selected. Add from the catalog below.</p>
        )}

        {productIds.map((pid, idx) => {
          const product = catalog.find((p) => p.id === pid);
          if (!product) return (
            <div key={pid} className="card admin-card card-solid p-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted italic">Product not found: {pid}</span>
              <button className="btn btn-ghost text-red-500" onClick={() => removeProduct(pid)}>
                <FontAwesomeIcon icon={faTrash} className="text-xs" />
              </button>
            </div>
          );

          const thumb = resolveAssetUrl(product.thumbnailUrl ?? product.images?.[0]?.url);

          return (
            <div key={pid} className="card admin-card card-solid p-3 flex items-center gap-3">
              {thumb && (
                <Image src={thumb} alt={product.name} width={40} height={40} className="w-10 h-10 rounded object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{product.name}</div>
                {product.category && <div className="text-xs text-muted">{product.category}</div>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  className="btn btn-ghost"
                  onClick={() => moveProduct(idx, idx - 1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => moveProduct(idx, idx + 1)}
                  disabled={idx === productIds.length - 1}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                </button>
                <button
                  className="btn btn-ghost text-red-500"
                  onClick={() => removeProduct(pid)}
                  title="Remove"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catalog picker */}
      {unselected.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold border-b pb-1">Add from catalog</div>
          <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
            {unselected.map((product) => {
              const thumb = resolveAssetUrl(product.thumbnailUrl ?? product.images?.[0]?.url);
              return (
                <div
                  key={product.id}
                  className="card admin-card card-solid p-3 flex items-center gap-3 hover:cursor-pointer hover:bg-black/5"
                  onClick={() => addProduct(product.id)}
                >
                  {thumb && (
                    <Image src={thumb} alt={product.name} width={32} height={32} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{product.name}</div>
                    {product.category && <div className="text-xs text-muted">{product.category}</div>}
                  </div>
                  <span className="text-xs text-primary font-medium flex-shrink-0">+ Add</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {catalog.length === 0 && (
        <p className="text-sm text-muted">
          No products in catalog. Add products via the <strong>Products</strong> button in the admin bar.
        </p>
      )}

    </div>
  );
}
