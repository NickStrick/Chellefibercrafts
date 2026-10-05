'use client';

import { useMemo } from 'react';
import type { BannerCarouselSection, BannerCarouselItem } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { useSite } from '@/context/SiteContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import type { EditorProps } from './types';

// tiny immutable helper (avoid local shadow state — see TestimonialEditor/GalleryEditor;
// resyncing local state from props on every keystroke causes remounts that steal focus)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

// infer mode from href
function hrefKind(href?: string) {
  if (!href) return { kind: 'external' as const, sectionId: '' };
  if (href === '/') return { kind: 'internal' as const, sectionId: '/' };
  if (href.startsWith('/#')) return { kind: 'internal' as const, sectionId: href.slice(2) };
  if (href.startsWith('#')) return { kind: 'internal' as const, sectionId: href.slice(1) };
  if (href.startsWith('/')) return { kind: 'sub-page' as const, sectionId: '' };
  return { kind: 'external' as const, sectionId: '' };
}

export function EditBannerCarousel({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<BannerCarouselSection>) {
  const { config } = useSite();
  // Dedupe by id: a config can end up with duplicate section ids (bad data),
  // which would otherwise crash this dropdown on a React "duplicate key" error.
  const allSections = useMemo(() => {
    const seen = new Set<string>();
    return (config?.sections ?? []).filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [config?.sections]);
  const allPages = useMemo(() => config?.pages ?? [], [config?.pages]);

  const items = section.items ?? [];

  const setItems = (next: BannerCarouselItem[]) => onChange({ ...section, items: next });

  const updateItem = (idx: number, patch: Partial<BannerCarouselItem>) => {
    const next = deepClone(items);
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addItem = () => {
    setItems([
      ...items,
      { title: '', body: '', backgroundUrl: '', overlay: true, imageUrl: '', href: '' },
    ]);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= items.length) return;
    const next = deepClone(items);
    const [row] = next.splice(idx, 1);
    next.splice(to, 0, row);
    setItems(next);
  };

  const pickBackground = async (idx: number) => {
    const picked = await openMediaPicker(`configs/${siteId}/assets/`);
    if (picked) updateItem(idx, { backgroundUrl: picked });
  };

  const pickImage = async (idx: number) => {
    const picked = await openMediaPicker(`configs/${siteId}/assets/`);
    if (picked) updateItem(idx, { imageUrl: picked });
  };

  return (
    <div className="space-y-6">
      {/* Rotation speed */}
      <div>
        <label className="block text-sm font-medium">Rotate every (seconds)</label>
        <input
          type="number"
          min={1}
          step={0.5}
          className="input w-32"
          value={(section.intervalMs ?? 5000) / 1000}
          onChange={(e) => {
            const seconds = parseFloat(e.target.value);
            onChange({
              ...section,
              intervalMs: Number.isFinite(seconds) ? Math.max(seconds, 1) * 1000 : 5000,
            });
          }}
        />
        <p className="text-xs text-muted mt-1">Only applies when there is more than one item.</p>
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="font-medium">Items ({items.length})</div>
        <button className="btn btn-inverted" type="button" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Banner
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, i) => {
          const { kind, sectionId } = hrefKind(it.href);

          return (
            <div key={i} className="card admin-card card-solid p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm opacity-70">Item #{i + 1}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                  >
                    <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => moveItem(i, 1)}
                    disabled={i === items.length - 1}
                    title="Move down"
                  >
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost text-red-600"
                    onClick={() => removeItem(i)}
                    title="Remove"
                  >
                    <FontAwesomeIcon icon={faTrash} className="text-xs" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Title</label>
                  <input
                    className="input w-full"
                    value={it.title ?? ''}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                    placeholder="e.g., Spring Sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Text</label>
                  <input
                    className="input w-full"
                    value={it.body ?? ''}
                    onChange={(e) => updateItem(i, { body: e.target.value })}
                    placeholder="e.g., 20% off this weekend only"
                  />
                </div>
              </div>

              {/* Background image */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Background Image (optional)</label>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50 flex-shrink-0">
                    {it.backgroundUrl ? (
                      <img
                        src={resolveAssetUrl(it.backgroundUrl) ?? it.backgroundUrl}
                        alt="Image preview"
                        className="admin-image-preview"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-muted">
                        None
                      </div>
                    )}
                  </div>
                  <input
                    className="input flex-1"
                    value={it.backgroundUrl ?? ''}
                    onChange={(e) => updateItem(i, { backgroundUrl: e.target.value })}
                    placeholder="https://… or configs/{siteId}/assets/banner.jpg"
                  />
                  <button
                    type="button"
                    className="btn btn-inverted"
                    onClick={() => pickBackground(i)}
                  >
                    Pick…
                  </button>
                  {it.backgroundUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost text-red-600"
                      onClick={() => updateItem(i, { backgroundUrl: '' })}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {it.backgroundUrl && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={it.overlay ?? true}
                      onChange={(e) => updateItem(i, { overlay: e.target.checked })}
                    />
                    Darken image with an overlay (improves text contrast)
                  </label>
                )}
              </div>

              {/* Flyer / logo image (shown to the left of the title & text) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Image (optional)</label>
                <p className="text-xs text-muted">
                  Shown to the left of the title &amp; text — good for a flyer, logo, or product photo.
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex-shrink-0">
                    {it.imageUrl ? (
                      <img
                        src={resolveAssetUrl(it.imageUrl) ?? it.imageUrl}
                        alt="Image preview"
                        className="admin-image-preview"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] text-muted">
                        None
                      </div>
                    )}
                  </div>
                  <input
                    className="input flex-1"
                    value={it.imageUrl ?? ''}
                    onChange={(e) => updateItem(i, { imageUrl: e.target.value })}
                    placeholder="https://… or configs/{siteId}/assets/flyer.jpg"
                  />
                  <button type="button" className="btn btn-inverted" onClick={() => pickImage(i)}>
                    Pick…
                  </button>
                  {it.imageUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost text-red-600"
                      onClick={() => updateItem(i, { imageUrl: '' })}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium">Link (optional)</label>
                <div className="flex gap-2">
                  <select
                    className="select w-36"
                    value={kind}
                    onChange={(e) => {
                      const nextKind = e.target.value as 'internal' | 'external' | 'sub-page';
                      if (nextKind === 'internal') {
                        const first = allSections[0]?.id ?? '';
                        updateItem(i, { href: first ? `/#${first}` : '' });
                      } else if (nextKind === 'sub-page') {
                        const first = allPages[0]?.slug ?? '';
                        updateItem(i, { href: first ? `/${first.replace(/^\/+/, '')}` : '' });
                      } else {
                        updateItem(i, { href: '' });
                      }
                    }}
                  >
                    <option value="internal">Internal (section)</option>
                    <option value="sub-page" disabled={allPages.length === 0}>
                      Sub-page{allPages.length === 0 ? ' (no pages yet)' : ''}
                    </option>
                    <option value="external">External URL</option>
                  </select>

                  {kind === 'internal' ? (
                    <select
                      className="select flex-1"
                      value={sectionId}
                      onChange={(e) => {
                        const id = e.target.value;
                        updateItem(i, { href: id === '/' ? '/' : id ? `/#${id}` : '' });
                      }}
                    >
                      <option value="">— Select section —</option>
                      <option value="/">Home • Top of page</option>
                      {allSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.type.charAt(0).toUpperCase() + s.type.slice(1)} • {s.id}
                        </option>
                      ))}
                    </select>
                  ) : kind === 'sub-page' ? (
                    <select
                      className="select flex-1"
                      value={it.href ?? ''}
                      onChange={(e) => updateItem(i, { href: e.target.value })}
                    >
                      <option value="">— Select page —</option>
                      {allPages.map((page) => {
                        const href = `/${page.slug.replace(/^\/+/, '')}`;
                        return (
                          <option key={page.slug} value={href}>
                            {page.title || page.slug}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      className="input flex-1"
                      value={it.href ?? ''}
                      onChange={(e) => updateItem(i, { href: e.target.value })}
                      placeholder="https://…, /shop, mailto:…, tel:…"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-sm text-muted">No banner items yet.</div>
        )}
      </div>
    </div>
  );
}

export default EditBannerCarousel;
