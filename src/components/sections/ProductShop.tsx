'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProductShopSection, SiteProduct } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { resolveAssetUrl } from '@/lib/assetUrl';
import ProductDetailModal from './ProductDetailModal';
import { normalizeOptionGroups, normalizeSelection } from '@/lib/productOptions';
import { SeperatorWave } from '@/components/SeperatorWave';

const PAGE_SIZE = 12;

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

// ─── Shop Card ────────────────────────────────────────────────────────────────

function ShopCard({
  product,
  onSelect,
}: {
  product: SiteProduct;
  onSelect: () => void;
}) {
  const thumb = resolveAssetUrl(product.thumbnailUrl ?? product.images?.[0]?.url);
  const isSoldOut = product.stock === 'out_of_stock';

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative flex flex-col card-ink card-interactive cursor-pointer group overflow-hidden rounded-2xl"
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      aria-label={`View ${product.name}`}
    >
      {product.featured && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">
          <Star className="w-3 h-3 fill-amber-900" /> Best Seller
        </div>
      )}
      {isSoldOut && (
        <div className="absolute top-2 right-2 z-10 rounded-full border px-2 py-0.5 text-xs font-semibold opacity-80">
          Sold out
        </div>
      )}

      <div className="aspect-[1] w-full overflow-hidden bg-black/5">
        {thumb ? (
          <img
            src={thumb}
            alt={product.name}
            width={320}
            height={240}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <span className="mb-1 text-xs uppercase tracking-wide opacity-65">{product.category}</span>
        )}
        <h4 className="font-semibold leading-snug">{product.name}</h4>
        {product.subtitle && (
          <p className="mt-0.5 line-clamp-1 text-sm opacity-90">{product.subtitle}</p>
        )}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold">{formatPrice(product.price, product.currency)}</span>
          {typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price && (
            <span className="text-sm line-through opacity-40">
              {formatPrice(product.compareAtPrice, product.currency)}
            </span>
          )}
        </div>
        {product.badges && product.badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {product.badges.map((b) => (
              <span key={b} className="rounded-full border px-2 py-0.5 text-xs opacity-70">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar Filters ─────────────────────────────────────────────────────────

function SidebarFilters({
  minPrice,
  maxPrice,
  priceRange,
  setPriceRange,
  categories,
  filterCategories,
  setFilterCategories,
  activeTab,
  onReset,
}: {
  minPrice: number;
  maxPrice: number;
  priceRange: [number, number];
  setPriceRange: (r: [number, number]) => void;
  categories: string[];
  filterCategories: string[];
  setFilterCategories: (c: string[]) => void;
  activeTab: string;
  onReset: () => void;
}) {
  const toggleCategory = (cat: string) => {
    setFilterCategories(
      filterCategories.includes(cat)
        ? filterCategories.filter((c) => c !== cat)
        : [...filterCategories, cat]
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 text-sm font-semibold">Price Range</div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between opacity-90">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={Math.max(1, Math.round((maxPrice - minPrice) / 100))}
            value={priceRange[0]}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v <= priceRange[1]) setPriceRange([v, priceRange[1]]);
            }}
            className="w-full "
          />
          <input
            type="range"
            min={minPrice}
            max={maxPrice}
            step={Math.max(1, Math.round((maxPrice - minPrice) / 100))}
            value={priceRange[1]}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v >= priceRange[0]) setPriceRange([priceRange[0], v]);
            }}
            className="w-full "
          />
        </div>
      </div>

      {activeTab === 'all' && categories.length > 0 && (
        <div>
          <div className="mb-3 text-sm font-semibold">Category</div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={filterCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="accent-[var(--primary)] "
                />
                {cat}
              </label>
            ))}
          </div>
        </div>
      )}

      <button onClick={onReset} className="text-xs opacity-80 hover:opacity-100 transition-opacity">
        Reset filters
      </button>
    </div>
  );
}

// ─── ProductShop ──────────────────────────────────────────────────────────────

export default function ProductShop({ id, title, subtitle, topWaveType, bottomWaveType }: ProductShopSection) {
  const { config } = useSite();
  const shopConfig = config?.products;
  const allProducts = useMemo(
    () => (shopConfig?.items ?? []).filter((p) => !p.hideFromShop),
    [shopConfig?.items]
  );
  const showFilters = shopConfig?.showFilters !== false;
  const categoryOrder = shopConfig?.categoryOrder ?? [];

  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<SiteProduct | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Record<string, string>>>({});
  console.log('Selected options:', selectedOptions);
  const categories = useMemo(() => {
    const seen: string[] = [];
    const seenSet = new Set<string>();
    for (const p of allProducts) {
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
  }, [allProducts, categoryOrder]);

  const { minPrice, maxPrice } = useMemo(() => {
    if (!allProducts.length) return { minPrice: 0, maxPrice: 0 };
    const prices = allProducts.map((p) => p.price);
    return { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) };
  }, [allProducts]);

  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, filterCategories, priceRange]);

  const normalizedOptions = useMemo(() => {
    const map: Record<string, ReturnType<typeof normalizeOptionGroups>> = {};
    for (const p of allProducts) map[p.id] = normalizeOptionGroups(p.options);
    return map;
  }, [allProducts]);

  useEffect(() => {
    setSelectedOptions((cur) => {
      let changed = false;
      const next = { ...cur };
      for (const p of allProducts) {
        if (next[p.id]) continue;
        const groups = normalizedOptions[p.id] ?? [];
        if (!groups.length) continue;
        next[p.id] = normalizeSelection(groups, undefined);
        changed = true;
      }
      return changed ? next : cur;
    });
  }, [allProducts, normalizedOptions]);

  const filtered = useMemo(() => {
    let items = allProducts;
    if (activeTab !== 'all') items = items.filter((p) => p.category === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subtitle ?? '').toLowerCase().includes(q) ||
          (p.category ?? '').toLowerCase().includes(q)
      );
    }
    if (priceRange[1] > 0)
      items = items.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (activeTab === 'all' && filterCategories.length > 0)
      items = items.filter((p) => filterCategories.includes(p.category ?? ''));
    return items;
  }, [allProducts, activeTab, search, priceRange, filterCategories]);

  const featured = useMemo(
    () => (activeTab === 'all' ? allProducts.filter((p) => p.featured) : []),
    [allProducts, activeTab]
  );

  const mainProducts = useMemo(() => {
    if (activeTab !== 'all') return filtered;
    const featuredIds = new Set(featured.map((p) => p.id));
    const rest = filtered.filter((p) => !featuredIds.has(p.id));

    const rank = (category?: string) => {
      if (!category) return Number.MAX_SAFE_INTEGER;
      const idx = categories.indexOf(category);
      return idx === -1 ? Number.MAX_SAFE_INTEGER - 1 : idx;
    };

    return rest
      .map((p, i) => ({ p, i }))
      .sort((a, b) => {
        const ar = rank(a.p.category);
        const br = rank(b.p.category);
        return ar !== br ? ar - br : a.i - b.i; // stable
      })
      .map(({ p }) => p);
  }, [filtered, featured, activeTab, categories]);

  const totalPages = Math.max(1, Math.ceil(mainProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => mainProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [mainProducts, safePage]
  );

  const handleReset = () => {
    setPriceRange([minPrice, maxPrice]);
    setFilterCategories([]);
    setSearch('');
  };

  const tabs = ['all', ...categories];

  const filterProps = { minPrice, maxPrice, priceRange, setPriceRange, categories, filterCategories, setFilterCategories, activeTab, onReset: handleReset };

  if (!allProducts.length) return null;

  return (
    <>
    <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
    <section id={id} className="section">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-10 text-center">
            {title && <h2 className="h-display mt-2">{title}</h2>}
            {subtitle && <p className="mt-4 h-hero-p opacity-80 max-w-2xl mx-auto text-muted">{subtitle}</p>}
          </div>
        )}

        {/* Controls */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="search"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--text-1)] bg-transparent py-2 pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 border-[var(--text-1)] text-[var(--text-1)]"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {showFilters && (
              <button
                className="lg:hidden btn btn-inverted flex items-center gap-2 text-sm"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  tab === activeTab
                    ? 'rounded-[999px] bg-[var(--primary)] px-4 py-1.5 text-sm font-semibold text-[var(--text-2)]'
                    : 'rounded-[999px] border border-[var(--text-1)] text-[var(--text-1)] px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-[var(--accent)] hover:text-white'
                }
              >
                {tab === 'all' ? 'All' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="flex gap-8 items-start">
          {/* Desktop sidebar */}
          {showFilters && (
            <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-24">
              <div className="card-ink p-4">
                <SidebarFilters {...filterProps} />
              </div>
            </aside>
          )}

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Best Sellers */}
            {featured.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <h3 className="text-xl font-bold">Best Sellers</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {featured.map((p) => (
                    <ShopCard key={p.id} product={p} onSelect={() => setSelectedProduct(p)} />
                  ))}
                </div>
                <hr className="mt-8 opacity-20" />
              </div>
            )}

            {/* Main grid */}
            {paginated.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {paginated.map((p) => (
                    <ShopCard key={p.id} product={p} onSelect={() => setSelectedProduct(p)} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-1">
                    <button
                      onClick={() => setPage((n) => Math.max(1, n - 1))}
                      disabled={safePage === 1}
                      className="btn btn-inverted p-2 disabled:opacity-30"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={
                          n === safePage
                            ? 'btn btn-primary h-8 w-8 p-0 text-sm'
                            : 'btn btn-inverted h-8 w-8 p-0 text-sm'
                        }
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                      disabled={safePage === totalPages}
                      className="btn btn-inverted p-2 disabled:opacity-30"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center opacity-50">No products found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filters drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[4900] bg-black/60 lg:hidden"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 z-[5000] h-full w-72 overflow-y-auto bg-[var(--bg)] p-5 shadow-2xl lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="font-semibold">Filters</span>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarFilters {...filterProps} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct as unknown as import('@/types/site').Product}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </>
  );
}
