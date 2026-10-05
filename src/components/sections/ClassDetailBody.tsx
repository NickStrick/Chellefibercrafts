'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ClassItem } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { useCart } from '@/context/CartContext';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import {
  buildClassLineItemId,
  buildVariantLabel,
  effectivePriceForSelection,
  normalizeOptionGroups,
  normalizeSelection,
} from '@/lib/productOptions';
import ClassTimePicker, { type ClassAvailability } from './ClassTimePicker';

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format((cents || 0) / 100);
}

function formatTimeLabel(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

type Props = {
  classItem: ClassItem;
  buyCtaFallback?: string;
};

// Media + description + options + time picker + booking button for a single
// class. Shared by ClassDetail (one class, picked by an admin) and ClassList
// (many classes, picked via tabs) so both stay visually/behaviorally in sync.
export default function ClassDetailBody({ classItem, buyCtaFallback = 'Book Now' }: Props) {
  const { config } = useSite();
  const { addItem, openCart } = useCart();
  const siteId = getSiteId();

  const payments = config?.settings?.payments;
  const cartActive = payments?.cartActive === true;

  // `normalizeSiteConfig` (run on every config load) already resolves
  // `times` for old-shape stored configs too, so this works regardless of
  // whether the site has been re-saved through the new admin UI yet.
  const classTimes = classItem.times ?? [];

  const optionGroups = useMemo(() => normalizeOptionGroups(classItem.options), [classItem.options]);
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string>>({});
  const selection = useMemo(
    () => normalizeSelection(optionGroups, selectedByGroup),
    [optionGroups, selectedByGroup]
  );
  const effectivePrice = useMemo(
    () => effectivePriceForSelection(classItem.price, optionGroups, selection),
    [classItem, optionGroups, selection]
  );

  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const selectedTime = classTimes.find((t) => t.id === selectedTimeId) ?? null;

  const [availability, setAvailability] = useState<ClassAvailability>({});
  useEffect(() => {
    const ids = classTimes.map((t) => t.id);
    if (ids.length === 0) return;
    const params = new URLSearchParams({ businessId: siteId, classTimeIds: ids.join(',') });
    fetch(`/api/classes/availability?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.availability) setAvailability(data.availability);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, classItem.id]);

  const [added, setAdded] = useState(false);
  const [mainIndex, setMainIndex] = useState(0);

  // Switching classes (tab change, or admin swaps which class a section
  // points to in live preview) shouldn't carry over the old selection.
  useEffect(() => {
    setSelectedByGroup({});
    setSelectedTimeId(null);
    setAdded(false);
    setMainIndex(0);
  }, [classItem.id]);

  const images = classItem.images ?? [];
  const mainImage = resolveAssetUrl(images[mainIndex]?.url ?? classItem.thumbnailUrl);
  const thumb = resolveAssetUrl(classItem.thumbnailUrl ?? images[0]?.url);
  // Every image except whichever one is currently shown large, capped so the
  // strip can't grow unbounded for a big gallery.
  const thumbnailImages = images
    .map((image, index) => ({ image, index }))
    .filter(({ index }) => index !== mainIndex)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedTime) return;
    const variantLabel = buildVariantLabel(optionGroups, selection);
    const itemId = buildClassLineItemId(classItem.id, selectedTime.id, selection);
    const timeLabel = `${new Date(`${selectedTime.date}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })} · ${formatTimeLabel(selectedTime.startTime)}`;
    const itemName = variantLabel ? `${classItem.name} (${variantLabel})` : classItem.name;

    addItem({
      id: itemId,
      name: itemName,
      price: effectivePrice,
      currency: classItem.currency,
      imageUrl: thumb ?? undefined,
      options: selection,
      classItemId: classItem.id,
      classTimeId: selectedTime.id,
      classTimeLabel: timeLabel,
      classLocation: selectedTime.location || undefined,
    });
    setAdded(true);
    openCart();
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
      {/* Media */}
      <div>
        {mainImage ? (
          <div className="w-full max-h-[560px] flex items-center justify-center overflow-hidden rounded-xl">
            <img
              src={mainImage}
              alt={images[mainIndex]?.alt ?? classItem.name}
              className="rounded-xl object-contain w-full h-full"
              style={{ maxHeight: '560px', width: 'auto', height: 'auto', maxWidth: '100%' }}
            />
          </div>
        ) : (
          <div className="w-full aspect-[4/3] bg-black/10 rounded-xl" />
        )}

        {/* Thumbnails for every OTHER image — the selected one is already
            shown large above, so it's excluded here. Two per row at ~50% of
            the main image's width/height, so they read as smaller versions
            of it rather than a separate strip of icons. Clicking one makes
            it the main image. */}
        {thumbnailImages.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {thumbnailImages.map(({ image: im, index: idx }) => {
              const resolved = resolveAssetUrl(im.url);
              if (!resolved) return null;
              return (
                <button
                  type="button"
                  key={im.url + idx}
                  onClick={() => setMainIndex(idx)}
                  className="w-full max-h-[280px] flex items-center justify-center overflow-hidden rounded-xl border-2 border-transparent opacity-90 transition hover:opacity-100"
                  aria-label={`Show image ${idx + 1}`}
                >
                  <img
                    src={resolved}
                    alt={im.alt ?? `${classItem.name} ${idx + 1}`}
                    className="rounded-xl object-contain"
                    style={{ maxHeight: '280px', width: 'auto', height: 'auto', maxWidth: '100%' }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="space-y-4 text-[var(--text-1)]">
        <div>
          {classItem.badges && classItem.badges.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {classItem.badges.map((b, i) => (
                <span key={b + i} className="rounded-full border border-[var(--text-1)] px-2 py-0.5 text-xs opacity-90">
                  {b}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-2xl md:text-3xl font-semibold">{classItem.name}</h2>
          {classItem.subtitle && <p className="mt-1 opacity-80">{classItem.subtitle}</p>}
        </div>

        <div className="flex items-end gap-3">
          <div className="text-3xl font-extrabold leading-none">
            {formatPrice(effectivePrice, classItem.currency)}
          </div>
          {typeof classItem.compareAtPrice === 'number' && classItem.compareAtPrice > effectivePrice && (
            <div className="pb-1 text-sm line-through opacity-70">
              {formatPrice(classItem.compareAtPrice, classItem.currency)}
            </div>
          )}
        </div>

        {classItem.description && (
          <p className="text-sm opacity-90 whitespace-pre-wrap">{classItem.description}</p>
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
                          className={`min-w-[4.5rem] px-3 py-1.5 border product-select flex flex-col items-center justify-center gap-0.5 ${
                            active ? 'bg-gradient-colored' : 'border-black/50 hover:border-black/60 border-2'
                          }`}
                        >
                          <span className="text-xs">{it.label}</span>
                          {typeof it.price === 'number' && (
                            <span className="text-[10px] opacity-70 leading-none">
                              {formatPrice(it.price, classItem.currency)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Time picker / booking */}
        {!cartActive ? (
          <p className="text-sm text-muted">Booking isn&apos;t available on this site yet.</p>
        ) : (
          <div className="space-y-2">
            <div className="text-sm font-medium">Choose a time</div>
            <ClassTimePicker
              key={classItem.id}
              classTimes={classTimes}
              selectedTimeId={selectedTimeId}
              onSelect={setSelectedTimeId}
              availability={availability}
            />

            {selectedTime && (
              <div className="rounded-lg border border-[var(--text-1)]/15 bg-[var(--bg-2)]/60 px-3 py-2 text-sm space-y-0.5">
                <div className="font-medium">
                  {new Date(`${selectedTime.date}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}{' '}
                  · {formatTimeLabel(selectedTime.startTime)}
                  {selectedTime.endTime ? ` – ${formatTimeLabel(selectedTime.endTime)}` : ''}
                </div>
                {selectedTime.location && <div className="opacity-80">📍 {selectedTime.location}</div>}
                {(() => {
                  const remaining = availability[selectedTime.id]?.remaining;
                  if (typeof remaining !== 'number') return null;
                  return (
                    <div className="opacity-80">
                      {remaining} spot{remaining === 1 ? '' : 's'} left
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {cartActive && (
          <button
            className="btn w-full justify-center mt-2 btn-gradient"
            type="button"
            disabled={!selectedTime}
            onClick={handleAddToCart}
          >
            {added ? 'Added — pick another time?' : selectedTime ? (classItem.ctaLabel || buyCtaFallback) : 'Select a time to continue'}
          </button>
        )}
      </div>
    </div>
  );
}
