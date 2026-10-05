'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { SiteConfig, ClassItem, ClassTime, SiteClassesConfig, ProductImage } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import { resolveAssetUrl } from '@/lib/assetUrl';
import MediaPicker from './MediaPicker';
import ClassTimesPickerModal from './ClassTimesPickerModal';
import { OptionsEditor } from './fields/OptionsEditor';
import CurrencyInput from './fields/CurrencyInput';

// ─── Utilities ────────────────────────────────────────────────────────────────

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function reorder<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

function rid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
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

function blankClassItem(): LocalClassItem {
  return {
    _localId: rid(),
    id: `class-${rid().slice(0, 8)}`,
    name: '',
    category: '',
    subtitle: '',
    description: '',
    price: 0,
    compareAtPrice: undefined,
    currency: 'USD',
    thumbnailUrl: '',
    images: [],
    ctaLabel: '',
    options: [],
    classTimeIds: [],
    badges: [],
  };
}

function blankClassTime(defaultLocation = ''): LocalClassTime {
  const today = new Date().toISOString().slice(0, 10);
  return {
    _localId: rid(),
    id: `time-${rid().slice(0, 8)}`,
    date: today,
    startTime: '18:00',
    endTime: '',
    capacity: undefined,
    location: defaultLocation,
    label: '',
  };
}

// ─── Local Types ──────────────────────────────────────────────────────────────

type LocalClassItem = ClassItem & { _localId: string };
type LocalClassTime = ClassTime & { _localId: string };
type LocalLocation = { _localId: string; value: string };

// ─── Class Time Card (inline-edit, no separate edit-mode toggle) ─────────────

function ClassTimeCard({
  time,
  locations,
  onChange,
  onRemove,
}: {
  time: LocalClassTime;
  locations: string[];
  onChange: (patch: Partial<LocalClassTime>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="card admin-card card-solid p-3 space-y-2">
      <div className="grid md:grid-cols-4 gap-2 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Date</label>
          <input
            type="date"
            className="input w-full"
            value={time.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Start</label>
          <input
            type="time"
            className="input w-full"
            value={time.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">End (optional)</label>
          <input
            type="time"
            className="input w-full"
            value={time.endTime ?? ''}
            onChange={(e) => onChange({ endTime: e.target.value || undefined })}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Capacity</label>
          <input
            type="number"
            min={0}
            className="input w-full"
            value={time.capacity ?? ''}
            placeholder="Unlimited"
            onChange={(e) => {
              const v = e.target.value === '' ? undefined : Math.max(0, Number(e.target.value) || 0);
              onChange({ capacity: v });
            }}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <label className="block text-xs font-medium mb-1">Location</label>
          {locations.length > 0 ? (
            <select
              className="select w-full"
              value={time.location ?? ''}
              onChange={(e) => onChange({ location: e.target.value })}
            >
              {!locations.includes(time.location ?? '') && (
                <option value={time.location ?? ''}>{time.location || '— none —'}</option>
              )}
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input w-full"
              value={time.location ?? ''}
              placeholder="e.g. 123 Main St, Studio B"
              onChange={(e) => onChange({ location: e.target.value })}
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Note</label>
          <input
            className="input w-full"
            value={time.label ?? ''}
            placeholder="e.g. Beginners"
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </div>
        <button type="button" className="btn btn-ghost text-red-500 text-sm" onClick={onRemove}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Class Item Edit Form ──────────────────────────────────────────────────────

function ClassItemEditForm({
  item,
  allTimes,
  locations,
  onChange,
  onRemove,
  onDone,
  onCreateAndAssignTimes,
  openMediaPicker,
  siteId,
}: {
  item: LocalClassItem;
  allTimes: LocalClassTime[];
  locations: string[];
  onChange: (patch: Partial<LocalClassItem>) => void;
  onRemove: () => void;
  onDone: () => void;
  onCreateAndAssignTimes: (newTimes: ClassTime[]) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
}) {
  const thumb = resolveAssetUrl(item.thumbnailUrl);
  const assigned = new Set(item.classTimeIds ?? []);
  const sortedTimes = useMemo(
    () => [...allTimes].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)),
    [allTimes]
  );
  const sortedAssignedTimes = useMemo(
    () => sortedTimes.filter((t) => assigned.has(t.id)),
    [sortedTimes, item.classTimeIds] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [timesPickerOpen, setTimesPickerOpen] = useState(false);

  const toggleTime = (timeId: string) => {
    const next = assigned.has(timeId)
      ? (item.classTimeIds ?? []).filter((id) => id !== timeId)
      : [...(item.classTimeIds ?? []), timeId];
    onChange({ classTimeIds: next });
  };

  return (
    <div
      className="card admin-card card-solid p-4 space-y-4"
      onBlurCapture={(e) => {
        // The times picker renders in this same DOM subtree (no portal), and
        // is full of plain non-focusable padding/labels — clicking any of
        // that blurs whatever input last had focus with nowhere clear for
        // focus to land, which would otherwise read as "focus left the
        // form" and auto-close it out from under the open modal.
        if (timesPickerOpen) return;
        const nextFocused = e.relatedTarget as Node | null;
        if (!e.currentTarget.contains(nextFocused)) onDone();
      }}
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            className="input w-full"
            value={item.name ?? ''}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Class name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            className="input w-full"
            value={item.subtitle ?? ''}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Short descriptor"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Category (optional)</label>
        <input
          className="input w-full"
          value={item.category ?? ''}
          onChange={(e) => onChange({ category: e.target.value })}
          placeholder="e.g. Kids, Adults"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Base Price ($)</label>
          <CurrencyInput
            cents={item.price}
            onChange={(cents) => onChange({ price: cents })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Compare-at Price ($)</label>
          <CurrencyInput
            cents={item.compareAtPrice}
            onChange={(cents) => onChange({ compareAtPrice: cents > 0 ? cents : undefined })}
          />
        </div>
      </div>

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
            value={item.thumbnailUrl ?? ''}
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

      {/* Additional Images — shown as a gallery on the class detail page; click a
          thumbnail there to bring it into the main spot. */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Additional Images</label>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (!picked) return;
              const images = [...(item.images ?? []), { url: picked, alt: '' }];
              onChange({ images, thumbnailUrl: item.thumbnailUrl || picked });
            }}
          >
            <Plus className="w-3 h-3 inline mr-1" />Add Image
          </button>
        </div>

        {(item.images ?? []).length === 0 ? (
          <p className="text-xs text-muted">
            No additional images yet — the thumbnail above is used on its own until you add some.
          </p>
        ) : (
          <div className="space-y-2">
            {(item.images ?? []).map((im, ii) => {
              const images = item.images ?? [];
              const preview = resolveAssetUrl(im.url);
              const updateImage = (patch: Partial<ProductImage>) => {
                const next = images.map((x, i) => (i === ii ? { ...x, ...patch } : x));
                onChange({ images: next });
              };
              return (
                <div key={ii} className="flex items-center gap-2">
                  {preview && (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-10 w-10 rounded object-cover flex-shrink-0 border border-gray-200"
                    />
                  )}
                  <input
                    className="input flex-1"
                    placeholder="Alt text (optional)"
                    value={im.alt ?? ''}
                    onChange={(e) => updateImage({ alt: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (ii === 0) return;
                      const next = [...images];
                      [next[ii - 1], next[ii]] = [next[ii], next[ii - 1]];
                      onChange({ images: next });
                    }}
                    disabled={ii === 0}
                    title="Move up"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      if (ii === images.length - 1) return;
                      const next = [...images];
                      [next[ii], next[ii + 1]] = [next[ii + 1], next[ii]];
                      onChange({ images: next });
                    }}
                    disabled={ii === images.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost text-red-500"
                    onClick={() => onChange({ images: images.filter((_, i) => i !== ii) })}
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          className="input w-full"
          rows={3}
          value={item.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What this class covers"
        />
      </div>

      {/* Options / Variants (e.g. 4x4 / 5x5 / 6x6) */}
      <OptionsEditor
        options={item.options ?? []}
        basePrice={item.price}
        onChange={(next) => onChange({ options: next })}
      />

      {/* Assigned times */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b pb-1">
          <span className="text-sm font-semibold">Assigned Times</span>
          <span className="text-xs text-muted">{assigned.size} selected</span>
        </div>

        {sortedAssignedTimes.length === 0 ? (
          <p className="text-xs text-muted">
            No times assigned yet. Leaving this empty is fine — the class will just show as
            &ldquo;Coming soon&rdquo; until scheduled.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto pr-1">
            {sortedAssignedTimes.map((t) => (
              <span
                key={t._localId}
                className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-2.5 py-1 text-xs"
              >
                {t.date} · {formatTimeLabel(t.startTime)}
                {t.location ? ` · ${t.location}` : ''}
                <button
                  type="button"
                  onClick={() => toggleTime(t.id)}
                  className="opacity-60 hover:opacity-100"
                  title="Unassign"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          className="btn btn-inverted text-sm"
          onClick={() => setTimesPickerOpen(true)}
        >
          <CalendarDays className="w-4 h-4 mr-1 inline" /> Select Times…
        </button>

        {timesPickerOpen && (
          <ClassTimesPickerModal
            classItemName={item.name || 'this class'}
            allTimes={allTimes}
            assignedIds={item.classTimeIds ?? []}
            locations={locations}
            onToggle={toggleTime}
            onCreateAndAssign={onCreateAndAssignTimes}
            onClose={() => setTimesPickerOpen(false)}
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Button Label</label>
          <input
            className="input w-full"
            value={item.ctaLabel ?? ''}
            onChange={(e) => onChange({ ctaLabel: e.target.value })}
            placeholder="Book Now"
          />
        </div>
      </div>

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

// ─── Class Item Card ────────────────────────────────────────────────────────────

function ClassItemCard({
  item,
  onEdit,
  onRemove,
}: {
  item: LocalClassItem;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const thumb = resolveAssetUrl(item.thumbnailUrl);
  const timesCount = (item.classTimeIds ?? []).length;
  return (
    <div className="card admin-card card-solid flex gap-3 p-3">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-black/10">
        {thumb ? (
          <img src={thumb} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm truncate block">
          {item.name || <em className="opacity-40">Unnamed</em>}
        </span>
        {item.category && <span className="text-xs opacity-50">{item.category}</span>}
        <div className="text-sm font-medium mt-0.5">
          {item.price > 0 ? formatPrice(item.price, item.currency) : <span className="opacity-30">No price</span>}
        </div>
        <div className="text-xs opacity-50 mt-0.5">
          {timesCount > 0 ? `${timesCount} time${timesCount === 1 ? '' : 's'} scheduled` : 'No times scheduled yet'}
        </div>
      </div>
      <div className="flex flex-col gap-1 flex-shrink-0">
        <button className="btn btn-ghost p-1" onClick={onEdit} aria-label="Edit class">
          <Pencil className="w-4 h-4" />
        </button>
        <button className="btn btn-ghost p-1 text-red-500" onClick={onRemove} aria-label="Remove class">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── ClassesModal ─────────────────────────────────────────────────────────────

export type ClassesModalProps = { onClose: () => void };

export default function ClassesModal({ onClose }: ClassesModalProps) {
  const { config, setConfig } = useSite();
  const siteId = getSiteId();

  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const originalRef = useRef<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'items' | 'times' | 'locations'>('items');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState<LocalClassItem[]>([]);
  const [localTimes, setLocalTimes] = useState<LocalClassTime[]>([]);
  const [localLocations, setLocalLocations] = useState<LocalLocation[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

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
      setLocalItems((copy.classes?.classItems ?? []).map((c) => ({ ...c, _localId: rid() })));
      setLocalTimes((copy.classes?.classTimes ?? []).map((t) => ({ ...t, _localId: rid() })));
      setLocalLocations((copy.classes?.locations ?? []).map((value) => ({ _localId: rid(), value })));
    }
  }, [config]);

  // ── Mutations: Class Items ──────────────────────────────────────────────────
  const commitItems = useCallback((next: LocalClassItem[]) => {
    setLocalItems(next);
    setDraft((prev) => {
      if (!prev) return prev;
      const classItems: ClassItem[] = next.map(({ _localId: _, ...c }) => c);
      const classes: SiteClassesConfig = {
        classItems,
        classTimes: prev.classes?.classTimes ?? [],
        locations: prev.classes?.locations ?? [],
      };
      return { ...prev, classes };
    });
  }, []);

  const commitTimes = useCallback((next: LocalClassTime[]) => {
    setLocalTimes(next);
    setDraft((prev) => {
      if (!prev) return prev;
      const classTimes: ClassTime[] = next.map(({ _localId: _, ...t }) => t);
      const classes: SiteClassesConfig = {
        classItems: prev.classes?.classItems ?? [],
        classTimes,
        locations: prev.classes?.locations ?? [],
      };
      return { ...prev, classes };
    });
  }, []);

  // ── Mutations: Locations ─────────────────────────────────────────────────
  const commitLocations = useCallback((next: LocalLocation[]) => {
    setLocalLocations(next);
    setDraft((prev) => {
      if (!prev) return prev;
      const locations = next.map((l) => l.value);
      const classes: SiteClassesConfig = {
        classItems: prev.classes?.classItems ?? [],
        classTimes: prev.classes?.classTimes ?? [],
        locations,
      };
      return { ...prev, classes };
    });
  }, []);

  const addLocation = useCallback(() => {
    commitLocations([...localLocations, { _localId: rid(), value: '' }]);
  }, [commitLocations, localLocations]);

  const updateLocation = useCallback(
    (localId: string, value: string) => {
      commitLocations(localLocations.map((l) => (l._localId === localId ? { ...l, value } : l)));
    },
    [commitLocations, localLocations]
  );

  const removeLocation = useCallback(
    (localId: string) => {
      commitLocations(localLocations.filter((l) => l._localId !== localId));
    },
    [commitLocations, localLocations]
  );

  const addItem = useCallback(() => {
    const c = blankClassItem();
    commitItems([c, ...localItems]);
    setEditingId(c._localId);
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }));
  }, [commitItems, localItems]);

  // ── Reordering: up/down buttons + drag-and-drop (mirrors ConfigModal's
  // section list) ──────────────────────────────────────────────────────────
  const moveItem = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= localItems.length) return;
      commitItems(reorder(localItems, from, to));
    },
    [commitItems, localItems]
  );
  const moveItemUp = useCallback((index: number) => moveItem(index, index - 1), [moveItem]);
  const moveItemDown = useCallback((index: number) => moveItem(index, index + 1), [moveItem]);

  const dragFromIndexRef = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropAfter, setDropAfter] = useState(false);

  const clearDragState = () => {
    dragFromIndexRef.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
    setDropAfter(false);
  };

  // Shared by every drop target (a row, its placeholder, and the list-level
  // fallback below) so a drop anywhere always resolves against the same
  // "from / last-hovered-over / before-or-after" state, however it's reached.
  const commitDrop = (over: number | null) => {
    const from = dragFromIndexRef.current;
    const after = dropAfter;
    clearDragState();
    if (from === null || over === null || from === over) return;
    // `moveItem` splices `from` out before inserting at `to`, so once the
    // hovered row sits after the removal point its post-removal index
    // shifts back by one — account for that before adding the after-offset.
    const overAfterRemoval = over < from ? over : over - 1;
    const to = after ? overAfterRemoval + 1 : overAfterRemoval;
    moveItem(from, to);
  };

  const makeDragHandlers = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragFromIndexRef.current = index;
      setDraggingIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragFromIndexRef.current === null || dragFromIndexRef.current === index) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const isAfter = e.clientY - rect.top > rect.height / 2;
      setDragOverIndex(index);
      setDropAfter(isAfter);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      commitDrop(index);
    },
    onDragEnd: clearDragState,
  });

  // Fallback for the area around the list (gaps between rows, a stray pixel
  // of margin/padding to either side, etc.) that isn't covered by any row or
  // placeholder's own handlers. Without this, dropping a pixel off-target
  // shows the browser's "not-allowed" cursor and the drag is silently
  // cancelled — the row visibly "snaps back" with no reorder applied. This
  // always resolves to wherever the last real placeholder was shown
  // (`dragOverIndex`/`dropAfter`), so a drop anywhere still lands there.
  const dragFallbackHandlers = {
    onDragOver: (e: React.DragEvent) => {
      if (dragFromIndexRef.current === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: React.DragEvent) => {
      if (dragFromIndexRef.current === null) return;
      e.preventDefault();
      commitDrop(dragOverIndex);
    },
  };

  // Carries the same drag handlers as the row it sits next to: it renders
  // exactly where the pointer is aiming, so without its own onDragOver/onDrop
  // the browser sees a drop over a non-target element and reverts the drag
  // (the row "snaps back") instead of actually reordering.
  const renderDragPlaceholder = (index: number) => (
    <div
      {...makeDragHandlers(index)}
      className="card admin-card p-3 w-full !border-2 !border-dashed !border-primary/60 !bg-none !bg-primary/5 !shadow-none h-16"
    />
  );

  const updateItem = useCallback(
    (localId: string, patch: Partial<LocalClassItem>) => {
      commitItems(localItems.map((c) => (c._localId === localId ? { ...c, ...patch } : c)));
    },
    [commitItems, localItems]
  );

  const finishEditingItem = useCallback(
    (localId: string) => {
      const item = localItems.find((c) => c._localId === localId);
      if (!item) {
        setEditingId(null);
        return;
      }
      if (!(item.name ?? '').trim()) {
        commitItems(localItems.filter((c) => c._localId !== localId));
        if (editingId === localId) setEditingId(null);
        return;
      }
      if (editingId === localId) setEditingId(null);
    },
    [commitItems, editingId, localItems]
  );

  const removeItem = useCallback(
    (localId: string) => {
      commitItems(localItems.filter((c) => c._localId !== localId));
      if (editingId === localId) setEditingId(null);
    },
    [commitItems, editingId, localItems]
  );

  // ── Mutations: Class Times ──────────────────────────────────────────────────
  const addTime = useCallback(() => {
    const t = blankClassTime(localLocations[0]?.value ?? '');
    commitTimes([t, ...localTimes]);
  }, [commitTimes, localTimes, localLocations]);

  const updateTime = useCallback(
    (localId: string, patch: Partial<LocalClassTime>) => {
      commitTimes(localTimes.map((t) => (t._localId === localId ? { ...t, ...patch } : t)));
    },
    [commitTimes, localTimes]
  );

  const removeTime = useCallback(
    (localId: string) => {
      const removed = localTimes.find((t) => t._localId === localId);
      commitTimes(localTimes.filter((t) => t._localId !== localId));
      // Unassign this time from any class items that had it.
      if (removed) {
        commitItems(
          localItems.map((c) => ({
            ...c,
            classTimeIds: (c.classTimeIds ?? []).filter((id) => id !== removed.id),
          }))
        );
      }
    },
    [commitTimes, localTimes, commitItems, localItems]
  );

  // Adds newly-generated times (one-off or a recurring series) to the shared
  // pool and assigns them to `localId`'s class item in a single commit, so
  // "Select Times" doesn't need a separate "now go check the boxes" step.
  const createAndAssignTimes = useCallback(
    (localId: string, newTimes: ClassTime[]) => {
      if (newTimes.length === 0) return;
      const withLocalIds: LocalClassTime[] = newTimes.map((t) => ({ ...t, _localId: rid() }));
      commitTimes([...localTimes, ...withLocalIds]);
      const newIds = withLocalIds.map((t) => t.id);
      commitItems(
        localItems.map((c) =>
          c._localId === localId
            ? { ...c, classTimeIds: Array.from(new Set([...(c.classTimeIds ?? []), ...newIds])) }
            : c
        )
      );
    },
    [commitTimes, localTimes, commitItems, localItems]
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
    setLocalItems((restored.classes?.classItems ?? []).map((c) => ({ ...c, _localId: rid() })));
    setLocalTimes((restored.classes?.classTimes ?? []).map((t) => ({ ...t, _localId: rid() })));
    setLocalLocations((restored.classes?.locations ?? []).map((value) => ({ _localId: rid(), value })));
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

  const sortedTimes = [...localTimes].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );

  return (
    <>
      <div className="fixed edit-modal inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card card-solid p-4 relative w-full max-w-full overflow-hidden card-screen-height flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
            <div className="font-semibold text-lg">Classes</div>
            <div className="flex items-center gap-2">
              {error && <div className="text-red-500 text-sm mr-2">{error}</div>}
              {isDirty && <button className="btn btn-ghost" onClick={onRestore}>Restore</button>}
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={onSave} disabled={!draft || saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4 flex-shrink-0">
            <div className="flex items-center justify-between border-b pb-0">
              <div className="flex gap-4">
                {(['items', 'times', 'locations'] as const).map((t) => (
                  <button
                    key={t}
                    className={[
                      'px-3 py-2 -mb-px text-sm font-semibold border-b-4 transition-colors admin-tab',
                      tab === t
                        ? 'border-transparent text-white active'
                        : 'border-transparent text-gray-300 hover:text-[var(--admin-primary)]',
                    ].join(' ')}
                    onClick={() => setTab(t)}
                  >
                    {t === 'items'
                      ? `Class Items (${localItems.length})`
                      : t === 'times'
                        ? `Class Times (${localTimes.length})`
                        : `Locations (${localLocations.length})`}
                  </button>
                ))}
              </div>
              <button
                className="btn btn-primary mb-2 flex items-center gap-1 text-sm"
                onClick={tab === 'items' ? addItem : tab === 'times' ? addTime : addLocation}
              >
                <Plus className="w-4 h-4" />{' '}
                {tab === 'items' ? 'Add Class' : tab === 'times' ? 'Add Time' : 'Add Location'}
              </button>
            </div>
          </div>

          {/* Content */}
          <div ref={listRef} className="flex-1 overflow-auto p-4" {...dragFallbackHandlers}>
            {tab === 'items' ? (
              localItems.length === 0 ? (
                <div className="text-sm text-muted py-8 text-center">
                  No classes yet. Click &ldquo;Add Class&rdquo; to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {localItems.map((c, i) => {
                    const isEditing = editingId === c._localId;
                    const isDragTarget = draggingIndex !== null && dragOverIndex === i;
                    return (
                      <Fragment key={c._localId}>
                        {isDragTarget && !dropAfter && renderDragPlaceholder(i)}
                        <div
                          {...(isEditing ? {} : makeDragHandlers(i))}
                          className={`flex gap-2 items-start ${draggingIndex === i ? 'opacity-40' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-1 pt-3 flex-shrink-0">
                            <div
                              className={`text-muted ${isEditing ? 'opacity-30' : 'cursor-grab active:cursor-grabbing'}`}
                              title={isEditing ? 'Finish editing to drag' : 'Drag to reorder'}
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <button
                              type="button"
                              className="btn btn-ghost !px-1 !py-1"
                              onClick={() => moveItemUp(i)}
                              disabled={i === 0}
                              title="Move up"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost !px-1 !py-1"
                              onClick={() => moveItemDown(i)}
                              disabled={i === localItems.length - 1}
                              title="Move down"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <ClassItemEditForm
                                item={c}
                                allTimes={localTimes}
                                locations={localLocations.map((l) => l.value)}
                                onChange={(patch) => updateItem(c._localId, patch)}
                                onRemove={() => removeItem(c._localId)}
                                onDone={() => finishEditingItem(c._localId)}
                                onCreateAndAssignTimes={(newTimes) => createAndAssignTimes(c._localId, newTimes)}
                                openMediaPicker={openMediaPicker}
                                siteId={siteId}
                              />
                            ) : (
                              <ClassItemCard
                                item={c}
                                onEdit={() => setEditingId(c._localId)}
                                onRemove={() => removeItem(c._localId)}
                              />
                            )}
                          </div>
                        </div>
                        {isDragTarget && dropAfter && renderDragPlaceholder(i)}
                      </Fragment>
                    );
                  })}
                </div>
              )
            ) : tab === 'times' ? (
              sortedTimes.length === 0 ? (
                <div className="text-sm text-muted py-8 text-center">
                  No class times yet. Click &ldquo;Add Time&rdquo; to schedule one, then assign it to a class in
                  the &ldquo;Class Items&rdquo; tab.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedTimes.map((t) => (
                    <ClassTimeCard
                      key={t._localId}
                      time={t}
                      locations={localLocations.map((l) => l.value)}
                      onChange={(patch) => updateTime(t._localId, patch)}
                      onRemove={() => removeTime(t._localId)}
                    />
                  ))}
                </div>
              )
            ) : localLocations.length === 0 ? (
              <div className="text-sm text-muted py-8 text-center">
                No locations yet. Click &ldquo;Add Location&rdquo; to get started — then it&rsquo;ll show up as a
                dropdown whenever you schedule a class time.
              </div>
            ) : (
              <div className="space-y-2">
                {localLocations.map((l) => (
                  <div key={l._localId} className="card admin-card card-solid p-3 flex items-center gap-2">
                    <input
                      className="input flex-1"
                      value={l.value}
                      placeholder="e.g. 123 Main St, Studio B"
                      onChange={(e) => updateLocation(l._localId, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost text-red-500"
                      onClick={() => removeLocation(l._localId)}
                      title="Remove location"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
