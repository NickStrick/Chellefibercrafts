'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import type { Product, ProductListingsSection } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';
import ProductImagesEditor from './ProductImagesEditor';
import ProductFeaturesEditor from './ProductFeaturesEditor';
import ProductBadgesTagsEditor from './ProductBadgesTagsEditor';

type VariantColor = { _id: string; name: string; hex?: string; imageUrl?: string };
type VariantOptionItem = { _id: string; label: string; value?: string; order?: number; default?: boolean };
type VariantOptionGroup = { _id: string; label: string; optionItems?: VariantOptionItem[] };

type LocalProduct = Omit<Product, 'colors' | 'options'> & {
  _id: string; // stable editor-only key for the card
  images: Array<{ _id: string; url: string; alt?: string }>;
  features: string[];
  badges: string[];
  // variant editors (editor-only ids)
  colors?: VariantColor[];
  options?: VariantOptionGroup[];
};

function rid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export default function ProductCardEditor({
  product,
  index,
  total,
  section,
  onUpdate,
  onRemove,
  onMove,
  openMediaPicker,
  siteId,
}: {
  product: LocalProduct;
  index: number;
  total: number;
  section: ProductListingsSection;
  onUpdate: (patch: Partial<LocalProduct>) => void;
  onRemove: () => void;
  onMove: (to: number) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
}) {
  // ---------- Variant helpers ----------
  const ensureColors = () => product.colors ?? [];
  const ensureOptions = () => product.options ?? [];

  const addColor = () => {
    const next = [...ensureColors(), { _id: rid(), name: '', hex: '', imageUrl: '' }];
    onUpdate({ colors: next });
  };

  const updateColor = (i: number, patch: Partial<VariantColor>) => {
    const arr = [...ensureColors()];
    const cur = arr[i];
    if (!cur) return;
    arr[i] = { ...cur, ...patch };
    onUpdate({ colors: arr });
  };

  const removeColor = (i: number) => {
    const arr = ensureColors().filter((_, idx) => idx !== i);
    onUpdate({ colors: arr });
  };

  const addOptionGroup = () => {
    const next = [...ensureOptions(), { _id: rid(), label: '', optionItems: [{ _id: rid(), label: '', value: '' }] }];
    onUpdate({ options: next });
  };

  const updateOptionGroup = (i: number, patch: Partial<VariantOptionGroup>) => {
    const arr = [...ensureOptions()];
    const cur = arr[i];
    if (!cur) return;
    arr[i] = { ...cur, ...patch };
    onUpdate({ options: arr });
  };

  const removeOptionGroup = (i: number) => {
    const arr = ensureOptions().filter((_, idx) => idx !== i);
    onUpdate({ options: arr });
  };

  const addOptionItem = (groupIndex: number) => {
    const groups = [...ensureOptions()];
    const g = groups[groupIndex];
    if (!g) return;
    const items = [...(g.optionItems ?? []), { _id: rid(), label: '', value: '' }];
    groups[groupIndex] = { ...g, optionItems: items };
    onUpdate({ options: groups });
  };

  const updateOptionItem = (groupIndex: number, itemIndex: number, patch: Partial<VariantOptionItem>) => {
    const groups = [...ensureOptions()];
    const g = groups[groupIndex];
    if (!g) return;
    const items = [...(g.optionItems ?? [])];
    const cur = items[itemIndex];
    if (!cur) return;
    items[itemIndex] = { ...cur, ...patch };
    groups[groupIndex] = { ...g, optionItems: items };
    onUpdate({ options: groups });
  };

  const removeOptionItem = (groupIndex: number, itemIndex: number) => {
    const groups = [...ensureOptions()];
    const g = groups[groupIndex];
    if (!g) return;
    const items = (g.optionItems ?? []).filter((_, idx) => idx !== itemIndex);
    groups[groupIndex] = { ...g, optionItems: items };
    onUpdate({ options: groups });
  };

  return (
    <div className="card admin-card card-solid p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="font-semibold">{product.name || 'Untitled Product'}</div>
        <div className="text-xs opacity-70">({product.id})</div>
        <div className="ml-auto flex gap-1">
          <button
            className="btn btn-ghost px-2"
            onClick={() => onMove(index - 1)}
            disabled={index === 0}
            title="Move up"
          >
            <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
          </button>
          <button
            className="btn btn-ghost px-2"
            onClick={() => onMove(index + 1)}
            disabled={index === total - 1}
            title="Move down"
          >
            <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
          </button>
          <button className="btn btn-ghost text-red-600" onClick={onRemove} title="Remove">
            Remove
          </button>
        </div>
      </div>

      {/* Basics */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Product ID (slug)</label>
          <input
            className="input w-full"
            value={product.id}
            onChange={(e) => onUpdate({ id: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="input w-full"
            value={product.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={product.subtitle ?? ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium">SKU</label>
          <input
            className="input w-full"
            value={product.sku ?? ''}
            onChange={(e) => onUpdate({ sku: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Price (cents)</label>
          <input
            type="number"
            className="input w-full"
            value={product.price}
            onChange={(e) => onUpdate({ price: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Compare at (cents)</label>
          <input
            type="number"
            className="input w-full"
            value={product.compareAtPrice ?? 0}
            onChange={(e) => onUpdate({ compareAtPrice: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Currency</label>
          <input
            className="input w-full"
            value={product.currency ?? 'USD'}
            onChange={(e) => onUpdate({ currency: e.target.value })}
            placeholder="USD"
          />
        </div>
      </div>

      {/* Thumbnail */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Thumbnail URL</label>
        <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {product.thumbnailUrl ? (
            <img
              src={resolveAssetUrl(product.thumbnailUrl) ?? product.thumbnailUrl}
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
            value={product.thumbnailUrl ?? ''}
            onChange={(e) => onUpdate({ thumbnailUrl: e.target.value })}
            placeholder="configs/{siteId}/assets/product-thumb.jpg or https://…"
          />
          <button
            type="button"
            className="btn btn-inverted"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (picked) onUpdate({ thumbnailUrl: picked });
            }}
          >
            Pick…
          </button>
        </div>
      </div>

      {/* Images */}
      <ProductImagesEditor
        product={product}
        onUpdate={onUpdate}
        openMediaPicker={openMediaPicker}
        siteId={siteId}
      />

      {/* Copy */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Summary</label>
          <textarea
            className="textarea w-full"
            value={product.summary ?? ''}
            onChange={(e) => onUpdate({ summary: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            className="textarea w-full"
            value={product.description ?? ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />
        </div>
      </div>

      {/* Features */}
      <ProductFeaturesEditor product={product} onUpdate={onUpdate} />

      {/* Badges */}
      <ProductBadgesTagsEditor product={product} onUpdate={onUpdate} />

      {/* ---------- Variants: Colors ---------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Colors</label>
          <button className="btn btn-ghost" onClick={addColor}>Add color</button>
        </div>

        {(ensureColors()).length === 0 && (
          <div className="text-sm text-muted">No colors yet.</div>
        )}

        <div className="space-y-2">
          {ensureColors().map((c, i) => (
            <div key={c._id} className="grid md:grid-cols-[1fr_140px_1fr_auto] gap-2 items-center">
              <input
                className="input"
                placeholder="Color name (e.g., Red)"
                value={c.name}
                onChange={(e) => updateColor(i, { name: e.target.value })}
              />
              <input
                className="input"
                placeholder="#hex"
                value={c.hex ?? ''}
                onChange={(e) => updateColor(i, { hex: e.target.value })}
              />
              <input
                className="input"
                placeholder="Swatch / image URL (optional)"
                value={c.imageUrl ?? ''}
                onChange={(e) => updateColor(i, { imageUrl: e.target.value })}
              />
              <button className="btn btn-ghost text-red-600" onClick={() => removeColor(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- Options ---------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Options</label>
          <button className="btn btn-ghost" onClick={addOptionGroup}>Add option group</button>
        </div>

        {ensureOptions().length === 0 && (
          <div className="text-sm text-muted">No options yet.</div>
        )}

        <div className="space-y-3">
          {ensureOptions().map((g, gi) => (
            <div key={g._id} className="rounded-xl border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="Group label (e.g., Size)"
                  value={g.label ?? ''}
                  onChange={(e) => updateOptionGroup(gi, { label: e.target.value })}
                />
                <button className="btn btn-ghost" onClick={() => addOptionItem(gi)}>
                  Add item
                </button>
                <button className="btn btn-ghost text-red-600" onClick={() => removeOptionGroup(gi)}>
                  Remove group
                </button>
              </div>

              <div className="space-y-2">
                {(g.optionItems ?? []).map((it, ii) => (
                  <div key={it._id} className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input
                      className="input"
                      placeholder="Label (e.g., Classic)"
                      value={it.label ?? ''}
                      onChange={(e) => updateOptionItem(gi, ii, { label: e.target.value })}
                    />
                    <input
                      className="input"
                      placeholder="Value (optional)"
                      value={it.value ?? ''}
                      onChange={(e) => updateOptionItem(gi, ii, { value: e.target.value })}
                    />
                    <button className="btn btn-ghost text-red-600" onClick={() => removeOptionItem(gi, ii)}>
                      Remove
                    </button>
                  </div>
                ))}
                {(g.optionItems ?? []).length === 0 && (
                  <div className="text-sm text-muted">No items yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory / Purchase */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Stock</label>
          <select
            className="select w-full"
            value={product.stock ?? 'in_stock'}
            onChange={(e) => onUpdate({ stock: e.target.value as Product['stock'] })}
          >
            <option value="in_stock">in_stock</option>
            <option value="low_stock">low_stock</option>
            <option value="out_of_stock">out_of_stock</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Qty Available</label>
          <input
            type="number"
            className="input w-full"
            value={product.quantityAvailable ?? 0}
            onChange={(e) => onUpdate({ quantityAvailable: Math.max(0, Number(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Max Quantity</label>
          <input
            type="number"
            min={0}
            className="input w-full"
            value={product.maxQuantity ?? 0}
            onChange={(e) => onUpdate({ maxQuantity: Math.max(0, Number(e.target.value) || 0) })}
            placeholder="0 = no limit"
          />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="flex items-end gap-2">
          <input
            type="checkbox"
            checked={product.taxable === true}
            onChange={(e) => onUpdate({ taxable: e.target.checked })}
          />
          <span>Taxable</span>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Purchase URL</label>
          <input
            className="input w-full"
            value={product.purchaseUrl ?? ''}
            onChange={(e) => onUpdate({ purchaseUrl: e.target.value })}
            placeholder="https://… (checkout or external link)"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Button Label</label>
        <input
          className="input w-full"
          value={product.ctaLabel ?? ''}
          onChange={(e) => onUpdate({ ctaLabel: e.target.value })}
          placeholder={`Defaults to: ${section.buyCtaFallback ?? 'Buy Now'}`}
        />
      </div>
    </div>
  );
}
