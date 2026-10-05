'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { ProductListingsSection, SiteProduct } from '@/types/site';
import AnimatedSection from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import ProductDetailModal from './ProductDetailModal';
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

function cls(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export default function ProductListings({
  id,
  title,
  subtitle,
  productIds,
  viewType = 'featured',
  style,
  showAllThreshold = 3,
  buyCtaFallback = 'Buy Now',
}: ProductListingsSection) {
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState<SiteProduct | null>(null);
  const [selectedOptionsByProduct, setSelectedOptionsByProduct] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const { addItem, openCart } = useCart();
  const { config } = useSite();
  const payments = config?.settings?.payments;
  const cartActive = payments?.cartActive === true;
  const taxes = payments?.taxes;

  // Resolve ordered products from the global catalog
  const catalog = useMemo(() => config?.products?.items ?? [], [config?.products?.items]);
  const products = useMemo<SiteProduct[]>(() => {
    if (!productIds?.length) return [];
    return productIds
      .map((pid) => catalog.find((p) => p.id === pid))
      .filter((p): p is SiteProduct => p !== undefined);
  }, [productIds, catalog]);

  const hasOverflow = products.length > showAllThreshold;
  const visible = useMemo(
    () => (showAll ? products : products.slice(0, showAllThreshold)),
    [products, showAll, showAllThreshold]
  );

  const normalizedOptionsByProductId = useMemo(() => {
    const map: Record<string, ReturnType<typeof normalizeOptionGroups>> = {};
    for (const p of products) map[p.id] = normalizeOptionGroups(p.options);
    return map;
  }, [products]);

  // Initialize featured-card option selections so price and Add to Cart can reflect selection.
  useEffect(() => {
    if (viewType !== 'featured') return;
    setSelectedOptionsByProduct((cur) => {
      let changed = false;
      const next: Record<string, Record<string, string>> = { ...cur };
      for (const p of products) {
        if (next[p.id]) continue;
        const groups = normalizedOptionsByProductId[p.id] ?? [];
        if (groups.length === 0) continue;
        next[p.id] = normalizeSelection(groups, undefined);
        changed = true;
      }
      return changed ? next : cur;
    });
  }, [viewType, products, normalizedOptionsByProductId]);

  const cardInk = style?.cardVariant === 'ink';
  const cols = style?.columns ?? 3;
  const sectionType = style?.sectionType ?? 'default';

  const smGridColsClass =
    cols <= 1 ? 'sm:grid-cols-1' : 'sm:grid-cols-2';

  const lgGridColsClass =
    cols === 1
      ? 'lg:grid-cols-1'
      : cols === 2
        ? 'lg:grid-cols-2'
        : cols === 3
          ? 'lg:grid-cols-3'
          : cols === 4
            ? 'lg:grid-cols-4'
            : 'lg:grid-cols-5';

  const sectionTypeClass =
     sectionType === 'short'
      ? 'lg:pb-1 lg:pt-1'
      : sectionType === 'long'
      ? 'lg:pb-3 lg:pt-3'
      : ''

  return (
  <>
    <section id={id} className={`section ${sectionTypeClass}`}>
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="relative w-fit mx-auto"
        >
          <div className="mb-10 text-center">
            {title && <h2 className="h-display mt-2">{title}</h2>}
            {subtitle && (
              <p className="mt-4 h-hero-p opacity-80 max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        </motion.div>

        <div className={cls('grid gap-1', smGridColsClass, lgGridColsClass)}>
          {visible.map((p, i) => {
            const thumb = resolveAssetUrl(p.thumbnailUrl ?? p.images?.[0]?.url);
            const optionGroups = normalizedOptionsByProductId[p.id] ?? [];
            const selectedByGroup = viewType === 'featured' ? selectedOptionsByProduct[p.id] : undefined;
            const effectivePrice =
              viewType === 'featured'
                ? effectivePriceForSelection(p.price, optionGroups, selectedByGroup)
                : p.price;
             const priceStr = formatPrice(effectivePrice, p.currency ?? 'USD');
             const isSoldOut = (p.stock ?? 'in_stock') === 'out_of_stock';
             const compareStr =
               typeof p.compareAtPrice === 'number' && p.compareAtPrice > effectivePrice
                 ? formatPrice(p.compareAtPrice, p.currency ?? 'USD')
                 : null;

            return (
              <AnimatedSection key={p.id + '-' + i}>
                <div
                  className={cls(
                    'relative h-full overflow-hidden card-ink card-interactive flex flex-col card-hover',
                    cardInk && 'card-ink',
                    viewType === 'list' && 'cursor-pointer'
                  )}
                  onClick={viewType === 'list' ? () => setSelected(p) : undefined}
                  role={viewType === 'list' ? 'button' : undefined}
                  tabIndex={viewType === 'list' ? 0 : undefined}
                  onKeyDown={
                    viewType === 'list'
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') setSelected(p);
                        }
                      : undefined
                  }
                  aria-label={viewType === 'list' ? `View details for ${p.name}` : undefined}
                >
                  {/* Badge row */}
                  {p.badges && p.badges.length > 0 && style?.showBadges !== false && (
                    <div className="absolute top-3 left-4 flex gap-2 flex-wrap">
                      {p.badges.map((b, bi) => (
                        <span key={b + bi} className="rounded-full border px-3 py-1 text-xs font-medium opacity-90">
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                  {isSoldOut && (
                    <div className="absolute top-3 right-4">
                      <span className="rounded-full border px-3 py-1 text-xs font-semibold">
                        Sold out
                      </span>
                    </div>
                  )}

                  {/* Image */}
                  {thumb ? (
                    <Image src={thumb} alt={p.name} className="w-full h-auto feature-image" width={400} height={300} />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-black/10" />
                  )}

                  <div className="flex-1 flex flex-col p-6 sm:p-7 md:p-8 pt-4">

                  {/* Header */}
                  <header>
                    <h3 className="text-2xl font-semibold">{p.name}</h3>
                    {p.subtitle && <p className="mt-2 opacity-90">{p.subtitle}</p>}
                    <div className="mt-6 flex items-end gap-2">
                      <div className="text-3xl font-extrabold leading-none">{priceStr}</div>
                      {compareStr && (
                        <div className="pb-1 text-sm opacity-70 line-through">{compareStr}</div>
                      )}
                    </div>
                    {viewType === 'featured' && p.summary && (
                      <p className="mt-3 text-sm opacity-90">{p.summary}</p>
                    )}
                  </header>

                  {/* Actions */}
                  {viewType === 'featured' ? (
                    <div className="mt-auto pt-6 space-y-3">
                      {(optionGroups?.length ?? 0) > 0 && (
                        <div className="space-y-3">
                          {(optionGroups ?? []).map((g) => {
                            const selection =
                              selectedOptionsByProduct[p.id] ?? normalizeSelection(optionGroups, undefined);
                            const selectedKey = selection[g.label] ?? '';
                            return (
                              <div key={`card-opt-${p.id}-${g.label}`} className="space-y-1">
                                <label className="block text-sm font-medium">{g.label}</label>
                                <select
                                  className="select w-full text-[var(--text-1)] rounded"
                                  value={selectedKey}
                                  onChange={(e) =>
                                    setSelectedOptionsByProduct((cur) => ({
                                      ...cur,
                                      [p.id]: { ...(cur[p.id] ?? {}), [g.label]: e.target.value },
                                    }))
                                  }
                                  disabled={isSoldOut}
                                >
                                  {g.optionItems.map((it) => {
                                    const key = it.value ?? it.label;
                                    return (
                                      <option
                                        className="text-[var(--text-1)]"
                                        key={`card-opt-${p.id}-${g.label}-${key}`}
                                        value={key}
                                      >
                                        {it.label}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex gap-2">
                        {!cartActive && p.purchaseUrl && !isSoldOut && (
                          <a
                            href={p.purchaseUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-gradient btn-white-outline w-full justify-center"
                          >
                            {p.ctaLabel ?? buyCtaFallback}
                          </a>
                        )}
                        {!cartActive && p.purchaseUrl && isSoldOut && (
                          <button type="button" className="btn btn-ghost w-full justify-center" disabled>
                            Sold out
                          </button>
                        )}
                        {cartActive && (
                          <button
                            className={cls('btn w-full justify-center', 'btn-gradient btn-white-outline rounded-[999px]')}
                            onClick={() => {
                              if (isSoldOut) return;
                              const defaultTaxable = taxes?.defaultProductTaxable === true;
                              const taxable = typeof p.taxable === 'boolean' ? p.taxable : defaultTaxable;

                              const selection =
                                selectedOptionsByProduct[p.id] ?? normalizeSelection(optionGroups, undefined);
                              const variantLabel = buildVariantLabel(optionGroups, selection);
                              const itemId = buildLineItemId(p.id, selection);
                              const itemName = variantLabel ? `${p.name} (${variantLabel})` : p.name;
                              const itemPrice = effectivePriceForSelection(p.price, optionGroups, selection);

                              addItem({
                                id: itemId,
                                name: itemName,
                                price: itemPrice,
                                currency: p.currency,
                                imageUrl: thumb ?? undefined,
                                taxable,
                                options: selection,
                              });
                              openCart();
                            }}
                            disabled={isSoldOut}
                            aria-label={`Add ${p.name} to cart`}
                          >
                            {isSoldOut ? 'Sold out' : (p.ctaLabel ?? buyCtaFallback)}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}
                  </div>
                  </div>
              </AnimatedSection>
            );
          })}
        </div>

        {hasOverflow && (
          <div className="mt-8 text-center">
            <button className="btn btn-gradient rounded-[999px]" onClick={() => setShowAll((x) => !x)}>
              {showAll ? 'Show Less' : 'Show All'}
            </button>
          </div>
        )}
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
    </>
  );
}
