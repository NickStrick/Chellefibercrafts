'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/types/site';
import { motion } from 'framer-motion';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { useCart } from '@/context/CartContext';
import { useSite } from '@/context/SiteContext';
import {
  buildLineItemId,
  buildVariantLabel,
  effectivePriceForSelection,
  normalizeOptionGroups,
  normalizeSelection,
} from '@/lib/productOptions';

type Props = {
  product: Product;
  onClose: () => void;
};

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format((cents || 0) / 100);
}

// Normalize colors: allow string[] or {name, hex?, imageUrl?}[]
type NormColor = { name: string; hex?: string; imageUrl?: string };
function normalizeColors(colors: Product['colors']): NormColor[] {
  if (!Array.isArray(colors)) return [];
  return colors.map((c: unknown) => {
    if (c && typeof c === 'object') {
      const obj = c as Record<string, unknown>;
      return {
        name: String(obj.name ?? ''),
        hex: typeof obj.hex === 'string' ? obj.hex : undefined,
        imageUrl: typeof obj.imageUrl === 'string' ? obj.imageUrl : undefined,
      };
    }
    return { name: String(c) };
  });
}

export default function ProductDetailModal({ product, onClose }: Props) {
  const {
    name,
    subtitle,
    price = 0,
    compareAtPrice,
    currency = 'USD',
    images = [],
    description,
    badges,
    purchaseUrl,
    ctaLabel,
    colors: rawColors,
  } = product;

  // Normalize variants defensively
  const colors = useMemo(() => normalizeColors(rawColors), [rawColors]);
  const optionGroups = useMemo(() => normalizeOptionGroups(product.options), [product.options]);

  // Main image with thumbnail switch
  const [mainIndex, setMainIndex] = useState(0);
  const mainImage = useMemo(() => {
    const src = images[mainIndex]?.url ?? product.thumbnailUrl ?? '';
    return resolveAssetUrl(src);
  }, [images, mainIndex, product.thumbnailUrl]);

  // Variant selection
  const [selectedColor, setSelectedColor] = useState<NormColor | null>(colors[0] ?? null);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});
  const isSoldOut = (product.stock ?? 'in_stock') === 'out_of_stock';
  const canBuy = !!purchaseUrl && !isSoldOut;
  const selection = useMemo(
    () => normalizeSelection(optionGroups, selectedByGroup),
    [optionGroups, selectedByGroup]
  );
  const effectivePrice = useMemo(() => effectivePriceForSelection(price, optionGroups, selection), [
    price,
    optionGroups,
    selection,
  ]);

  const { addItem, openCart, isCartOpen } = useCart();
  const { config } = useSite();
  const payments = config?.settings?.payments;
  const cartActive = payments?.cartActive === true;
  const taxes = payments?.taxes;
  const offsetForCart = cartActive && isCartOpen;

  return (
    <div
      className={[
        'fixed inset-0 z-[5100] bg-black/60 flex items-center justify-center p-4 product-detail-overlay',
        offsetForCart ? 'product-detail-overlay--with-cart' : '',
      ].join(' ')}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="card card-modal product-detail-modal relative w-full max-w-3xl p-0 overflow-hidden"
      >
        <button
          className="absolute right-3 top-3 btn btn-ghost"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-0 md:max-h-[100vh] overflow-auto">
          {/* Media */}
          <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[var(--bg-2)]">
            {mainImage ? (
              <div className="w-full max-h-[645px] flex items-center justify-center overflow-hidden rounded-xl">
                <img
                  src={mainImage}
                  alt={images[mainIndex]?.alt ?? name}
                  className="rounded-xl object-contain w-full h-full"
                  width={400}
                  height={400}
                  style={{ maxHeight: '645px', width: 'auto', height: 'auto', maxWidth: '100%' }}
                />
              </div>
            ) : (
              <div className="w-full aspect-[4/3] bg-black/10 rounded-xl" />
            )}

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((im, idx) => {
                  const resolved = resolveAssetUrl(im.url);
                  const isActive = idx === mainIndex;
                  if (!resolved) return null;
                  return (
                    <button
                      type="button"
                      key={im.url + idx}
                      onClick={() => setMainIndex(idx)}
                      className={` overflow-hidden border product-select ${
                        isActive ? 'bg-gradient-colored' : ' border-2 border-transparent opacity-90 hover:opacity-100'
                      }`}
                      aria-label={`Show image ${idx + 1}`}
                    >
                      <div className="w-full max-h-[140px] flex items-center justify-center overflow-hidden">
                        <Image
                          src={resolved}
                          alt={im.alt ?? `${name} ${idx + 1}`}
                          className="object-contain block"
                          width={80}
                          height={80}
                          style={{ maxHeight: '140px', width: 'auto', height: 'auto', maxWidth: '100%' }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-4 md:p-6 space-y-4 text-[var(--text-1)]">
            <div>
              {badges && badges.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {badges.map((b, i) => (
                    <span key={b + i} className="rounded-full border border-[var(--text-1)] px-2 py-0.5 text-xs opacity-90">
                      {b}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold">{name}</h3>
                {isSoldOut && (
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                    Sold out
                  </span>
                )}
              </div>
              {subtitle && <p className="mt-1 opacity-80">{subtitle}</p>}
            </div>

            <div className="flex items-end gap-3">
              <div className="text-3xl font-extrabold leading-none">
                {formatPrice(effectivePrice, currency)}
              </div>
              {typeof compareAtPrice === 'number' && compareAtPrice > effectivePrice && (
                <div className="pb-1 text-sm line-through opacity-9dd0">
                  {formatPrice(compareAtPrice, currency)}
                </div>
              )}
            </div>

            {description && <p className="text-sm opacity-90 whitespace-pre-wrap">{description}</p>}

            {/* Color selector */}
            {colors.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Color</div>
                <div className="flex flex-wrap gap-2">
                  {colors.map((c) => {
                    const active = selectedColor?.name === c.name;
                    const swatchBg = c.hex ? { backgroundColor: c.hex } : undefined;
                    return (
                      <button
                        key={`color-${c.name}`}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`px-3 py-1 border  product-select ${
                          active ? 'bg-gradient-colored' : 'border-2 border-black/50 hover:border-black/60'
                        }`}
                        title={c.name}
                      >
                        <span className="inline-flex items-center gap-2">
                          {c.hex && (
                            <span
                              className="inline-block w-3 h-3 rounded-full border"
                              style={swatchBg}
                            />
                          )}
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Options */}
            {optionGroups.length > 0 && (
              <div className="space-y-4">
                {optionGroups.map((g) => {
                  const selectedKey = selection[g.label] ?? '';
                  return (
                    <div key={`opt-${g.label}`} className="space-y-2">
                      <div className="text-sm font-medium">{g.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {g.optionItems.map((it) => {
                          const key = it.value ?? it.label;
                          const active = key === selectedKey;
                          return (
                            <button
                              key={`opt-${g.label}-${key}`}
                              type="button"
                              onClick={() => setSelectedByGroup((cur) => ({ ...cur, [g.label]: key }))}
                              className={`px-3 py-1 border product-select ${
                                active ? 'bg-gradient-colored' : 'border-black/50 hover:border-black/60 border-2'
                              }`}
                            >
                              {it.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


            {/* Features */}
            {product.features && product.features.length > 0 && (
              <ul className="space-y-1">
                {product.features.map((f, i) => (
                  <li key={i} className="text-sm opacity-90">• {f}</li>
                ))}
              </ul>
            )}

            {/* CTA */}
            {cartActive && (
              <button
                className="btn w-full justify-center mt-2 btn-gradient"
                type="button"
                disabled={isSoldOut}
                onClick={() => {
                  if (isSoldOut) return;
                  const defaultTaxable = taxes?.defaultProductTaxable === true;
                  const taxable = typeof product.taxable === 'boolean' ? product.taxable : defaultTaxable;

                  const variantLabel = buildVariantLabel(optionGroups, selection);
                  const itemId = buildLineItemId(product.id, selection);
                  const itemName = variantLabel ? `${name} (${variantLabel})` : name;
                  const itemPrice = effectivePriceForSelection(price, optionGroups, selection);

                  addItem({
                    id: itemId,
                    name: itemName,
                    price: itemPrice,
                    currency,
                    imageUrl: mainImage || undefined,
                    taxable,
                    options: selection,
                  });
                  openCart();
                  onClose();
                }}
              >
                {isSoldOut ? 'Sold out' : (ctaLabel || 'Add to Cart')}
              </button>
            )}

            {!cartActive && purchaseUrl && canBuy && (
              <a
                href={purchaseUrl}
                className="btn w-full justify-center mt-2 btn-gradient"
                rel="noopener noreferrer"
                target="_blank"
              >
                {ctaLabel || 'Buy Now'}
              </a>
            )}
            {!cartActive && purchaseUrl && !canBuy && (
              <button className="btn w-full justify-center mt-2 btn-ghost" type="button" disabled>
                Sold out
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
