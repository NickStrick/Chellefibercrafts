'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  GalleryItem,
  GallerySection,
  GalleryStyle,
} from '@/types/site';
import type { EditorProps } from './types';
import GalleryImageCard from './GalleryImageCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

// tiny immutable helper
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditGallery({
  section,
  onChange,
  openMediaPickerMulti,
  siteId,
}: EditorProps<GallerySection>) {
  const style: GalleryStyle = section.style ?? {};
  // Scoped under this site's own config folder, like every other uploaded
  // asset, so galleries don't collide with (or need permissions on) a
  // bucket-root prefix shared across every site.
  const uploadPrefix = `configs/${siteId}/gallery/`;

  // Galleries are always a hand-picked static list now. Migrate any
  // legacy S3-prefix-scan sections over automatically.
  useEffect(() => {
    if (section.source) {
      onChange({ ...section, source: undefined, items: section.items ?? [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.source]);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // --- Adders (static mode)
  // Images always upload to this site's own "configs/{siteId}/gallery/"
  // prefix; each section just picks which of those shared uploads it wants
  // to display. Reopening the picker pre-checks this section's current
  // picks so (un)checking an image adds/removes it here too. Manually
  // pasted URLs (outside that prefix) are left untouched by this
  // reconciliation.
  const addFromPicker = useCallback(async () => {
    if (!openMediaPickerMulti) return;
    const existing = section.items ?? [];
    const existingKeys = existing
      .filter((it) => it.imageUrl.startsWith(uploadPrefix))
      .map((it) => it.imageUrl);
    const picked = await openMediaPickerMulti(uploadPrefix, existingKeys);
    if (!picked) return;

    const pickedSet = new Set(picked);
    const untouched = existing.filter((it) => !it.imageUrl.startsWith(uploadPrefix));
    const kept = existing.filter(
      (it) => it.imageUrl.startsWith(uploadPrefix) && pickedSet.has(it.imageUrl)
    );
    const keptKeys = new Set(kept.map((it) => it.imageUrl));
    const added: GalleryItem[] = picked
      .filter((key) => !keptKeys.has(key))
      .map((key) => ({ imageUrl: key, alt: key.split('/').pop() ?? 'Image' }));

    const copy = deepClone(section);
    copy.items = [...untouched, ...kept, ...added];
    onChange(copy);
  }, [onChange, openMediaPickerMulti, section, uploadPrefix]);

  // --- Item mutators (static mode)
  const updateItem = useCallback(
    (index: number, patch: Partial<GalleryItem>) => {
      const copy = deepClone(section);
      const items = copy.items ?? [];
      items[index] = { ...items[index], ...patch };
      copy.items = items;
      onChange(copy);
    },
    [onChange, section]
  );

  const removeItem = useCallback(
    (index: number) => {
      const copy = deepClone(section);
      copy.items = (copy.items ?? []).filter((_, idx) => idx !== index);
      onChange(copy);
    },
    [onChange, section]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (from === to) return;
      const copy = deepClone(section);
      const items = copy.items ?? [];
      const [moved] = items.splice(from, 1);
      items.splice(to, 0, moved);
      copy.items = items;
      onChange(copy);
    },
    [onChange, section]
  );

  // --- Style updater (simple & well-typed)
  const updateStyle = (patch: Partial<GalleryStyle>) => {
    onChange({ ...section, style: { ...(section.style ?? {}), ...patch } });
  };

  // selections -> typed conversions
  const toColumns = (v: string) => Number(v) as GalleryStyle['columns'];
  const toRounded = (v: string) => v as GalleryStyle['rounded'];
  const toGap = (v: string) => v as GalleryStyle['gap'];

  return (
    <div className="space-y-5">
      {/* Title / Subtitle — also shown in the section list, so give each
          gallery a distinct name when you have more than one. */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => onChange({ ...section, title: e.target.value || undefined })}
            placeholder="e.g. Weddings"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => onChange({ ...section, subtitle: e.target.value || undefined })}
            placeholder="Optional supporting text"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">
            Images ({(section.items ?? []).length})
          </div>
          <div className="flex gap-2">
            <button className="btn btn-inverted" onClick={addFromPicker} disabled={!openMediaPickerMulti}>
              <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Image to this Gallery
            </button>
          </div>
        </div>

        {(section.items ?? []).length > 0 ? (
          <>
            <p className="text-xs text-muted">Drag a card to reorder how images appear on the page.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(section.items ?? []).map((it, i) => (
                <GalleryImageCard
                  key={i}
                  item={it}
                  index={i}
                  isDragging={draggingIndex === i}
                  isDragOver={dragOverIndex === i}
                  onAltChange={(alt) => updateItem(i, { alt })}
                  onUrlChange={(imageUrl) => updateItem(i, { imageUrl })}
                  onRemove={() => removeItem(i)}
                  onDragStart={() => setDraggingIndex(i)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingIndex !== null && draggingIndex !== i) setDragOverIndex(i);
                  }}
                  onDrop={() => {
                    if (draggingIndex !== null) moveItem(draggingIndex, i);
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                    setDragOverIndex(null);
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted">
            No images selected yet. Click &ldquo;Add Image to this Gallery&rdquo; to pick from your
            shared photo library, or upload new ones from the same button.
          </div>
        )}
      </div>

      {/* Style + background */}
      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={style.columns ?? 4}
            onChange={(e) => updateStyle({ columns: toColumns(e.target.value) })}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Rounded</label>
          <select
            className="select w-full"
            value={style.rounded ?? 'xl'}
            onChange={(e) => updateStyle({ rounded: toRounded(e.target.value) })}
          >
            <option value="lg">lg</option>
            <option value="xl">xl</option>
            <option value="2xl">2xl</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Gap</label>
          <select
            className="select w-full"
            value={style.gap ?? 'md'}
            onChange={(e) => updateStyle({ gap: toGap(e.target.value) })}
          >
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Background Class (optional)</label>
        <input
          className="input w-full"
          value={section.backgroundClass ?? ''}
          onChange={(e) =>
            onChange({
              ...section,
              backgroundClass: e.target.value || undefined,
            })
          }
          placeholder="e.g. bg-gradient-2"
        />
      </div>
    </div>
  );
}
