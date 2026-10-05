'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WAVE_TYPES, type SiteConfig, type AnySection, type HeaderSection, type HeaderNavItem, type FooterSection } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import { adminFetch } from '@/lib/adminClient';
import MediaPicker from './MediaPicker';
import { SECTION_REGISTRY, getAllowedSectionTypes } from './configRegistry';
import { getEditorForSection } from './EditSections';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faClone, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import AdminAIChatPanel from './AdminAIChatPanel';
import { applySiteConfigPatch } from '@/lib/siteConfigPatch';
import { getAdminSectionSlots, getAdminPageSectionSlots, normalizeSiteConfig } from '@/lib/siteConfigSections';
import { isAdminAiUiEnabled } from '@/lib/adminAi';
import type { SitePage, SiteConfigVersionMeta } from '@/types/site';

// -----------------------------
// Utilities
// -----------------------------
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

// -----------------------------
// Local draft autosave (crash/close recovery, not a substitute for real Save)
// -----------------------------
const AUTOSAVE_DEBOUNCE_MS = 1200;
const draftStorageKey = (siteId: string) => `cm-admin-draft:${siteId}`;

type StoredDraft = { draft: SiteConfig; savedAt: number };

function readStoredDraft(siteId: string): StoredDraft | null {
  try {
    const raw = window.localStorage.getItem(draftStorageKey(siteId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredDraft;
  } catch {
    return null;
  }
}

function writeStoredDraft(siteId: string, draft: SiteConfig) {
  try {
    window.localStorage.setItem(
      draftStorageKey(siteId),
      JSON.stringify({ draft, savedAt: Date.now() } satisfies StoredDraft)
    );
  } catch {
    // best-effort only (storage full/unavailable) — real Save is unaffected
  }
}

function clearStoredDraft(siteId: string) {
  try {
    window.localStorage.removeItem(draftStorageKey(siteId));
  } catch {
    // ignore
  }
}

// -----------------------------
// Props
// -----------------------------
export type ConfigModalProps = {
  onClose: () => void;
  initialPatch?: Partial<SiteConfig> | null;
  openInPreview?: boolean;
  externalPatch?: Partial<SiteConfig> | null;
  externalPatchNonce?: number;
  externalPatchPreview?: boolean;
};

// -----------------------------
// Component
// -----------------------------
export default function ConfigModal({
  onClose,
  initialPatch = null,
  openInPreview = false,
  externalPatch = null,
  externalPatchNonce = 0,
  externalPatchPreview = false,
}: ConfigModalProps) {
  const { config, setConfig } = useSite();
  const adminAiEnabled = isAdminAiUiEnabled();
  const siteId = getSiteId();

  // Working copy (nullable until config is ready)
  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'main' | 'pages'>('main');
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const originalRef = useRef<SiteConfig | null>(null);
  const previewDraftRef = useRef<SiteConfig | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const pendingAutoPreviewRef = useRef(false);
  const ignoreConfigSyncRef = useRef(false);
  const initialPatchAppliedRef = useRef(false);
  const lastExternalPatchNonceRef = useRef<number>(0);
  const restoreCheckedRef = useRef(false);
  const [pendingLocalDraft, setPendingLocalDraft] = useState<StoredDraft | null>(null);

  useEffect(() => {
    if (ignoreConfigSyncRef.current) {
      ignoreConfigSyncRef.current = false;
      return;
    }
    if (config) {
      const copy = deepClone(config);
      setDraft(copy);
      originalRef.current = copy;
      setSelectedIndex(0); // default to header on open/load

      // One-time check (per modal mount) for a locally autosaved draft that
      // never made it to the server — e.g. a crash/closed-tab after edits.
      if (!restoreCheckedRef.current) {
        restoreCheckedRef.current = true;
        const stored = readStoredDraft(siteId);
        if (stored && JSON.stringify(stored.draft) !== JSON.stringify(copy)) {
          setPendingLocalDraft(stored);
        }
      }
    }
  }, [config, siteId]);

  const startPreview = useCallback(() => {
    if (!draft) return;
    const snapshot = deepClone(draft);
    previewDraftRef.current = snapshot;
    ignoreConfigSyncRef.current = true;
    setConfig(snapshot);
    setIsPreviewing(true);
  }, [draft, setConfig]);

  useEffect(() => {
    if (!pendingAutoPreviewRef.current) return;
    if (!draft) return;
    pendingAutoPreviewRef.current = false;
    startPreview();
  }, [draft, startPreview]);

  useEffect(() => {
    if (initialPatchAppliedRef.current) return;
    if (!draft) return;
    if (!initialPatch) return;

    initialPatchAppliedRef.current = true;
    pendingAutoPreviewRef.current = openInPreview;
    setDraft((prev) => (prev ? applySiteConfigPatch(prev, initialPatch) : prev));
  }, [draft, initialPatch, openInPreview]);

  useEffect(() => {
    if (!draft) return;
    if (!externalPatch) return;
    if (externalPatchNonce <= 0) return;
    if (lastExternalPatchNonceRef.current === externalPatchNonce) return;

    lastExternalPatchNonceRef.current = externalPatchNonce;
    pendingAutoPreviewRef.current = externalPatchPreview;
    setDraft((prev) => (prev ? applySiteConfigPatch(prev, externalPatch) : prev));
  }, [draft, externalPatch, externalPatchNonce, externalPatchPreview]);

  const slots = useMemo(() => {
    if (!draft) return [];
    if (activeTab === 'pages' && editingPageIndex !== null) {
      return getAdminPageSectionSlots(draft, editingPageIndex);
    }
    return getAdminSectionSlots(draft);
  }, [draft, activeTab, editingPageIndex]);

  // keep selectedIndex in bounds whenever slot count changes
  useEffect(() => {
    if (!slots.length) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex((i) => clamp(i, 0, Math.max(0, slots.length - 1)));
  }, [slots.length]);

  const selectedSlot = slots[selectedIndex];

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDirty = useMemo(() => {
    if (!draft || !originalRef.current) return false;
    return JSON.stringify(draft) !== JSON.stringify(originalRef.current);
  }, [draft]);

  // Debounced local autosave: protects against lost work from a closed tab,
  // crash, or navigating away without hitting Save. This never talks to the
  // server — it only writes to localStorage, so it can't push a half-edited
  // field to the live site the way a save-on-blur-to-server would.
  useEffect(() => {
    if (!draft || !isDirty) return;
    const handle = window.setTimeout(() => {
      writeStoredDraft(siteId, draft);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draft, isDirty, siteId]);

  // Warn on tab close/refresh while there are unsaved edits.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const acceptLocalDraft = useCallback(() => {
    if (!pendingLocalDraft) return;
    setDraft(deepClone(pendingLocalDraft.draft));
    setPendingLocalDraft(null);
  }, [pendingLocalDraft]);

  const dismissLocalDraft = useCallback(() => {
    clearStoredDraft(siteId);
    setPendingLocalDraft(null);
  }, [siteId]);

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard them and close?')) {
      return;
    }
    onClose();
  }, [isDirty, onClose]);

  // ---------------------------
  // MediaPicker bridge (Promise-based)
  // ---------------------------
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPrefix, setPickerPrefix] = useState<string>(`configs/${siteId}/assets/`);
  const [pickerMultiple, setPickerMultiple] = useState(false);
  const [pickerInitialSelected, setPickerInitialSelected] = useState<string[]>([]);
  const pickerResolveRef = useRef<((key: string | null) => void) | null>(null);
  const pickerResolveManyRef = useRef<((keys: string[] | null) => void) | null>(null);

  const bucket = process.env.NEXT_PUBLIC_S3_DEFAULT_BUCKET;

  const openMediaPicker = useCallback((prefix: string): Promise<string | null> => {
    setPickerPrefix(prefix);
    setPickerMultiple(false);
    setPickerOpen(true);
    return new Promise<string | null>((resolve) => {
      pickerResolveRef.current = resolve;
    });
  }, []);

  const openMediaPickerMulti = useCallback(
    (prefix: string, initialSelected?: string[]): Promise<string[] | null> => {
      setPickerPrefix(prefix);
      setPickerMultiple(true);
      setPickerInitialSelected(initialSelected ?? []);
      setPickerOpen(true);
      return new Promise<string[] | null>((resolve) => {
        pickerResolveManyRef.current = resolve;
      });
    },
    []
  );

  const handlePick = useCallback((key: string) => {
    if (pickerResolveRef.current) {
      pickerResolveRef.current(key);
      pickerResolveRef.current = null;
    }
    setPickerOpen(false);
  }, []);

  const handlePickMany = useCallback((keys: string[]) => {
    if (pickerResolveManyRef.current) {
      pickerResolveManyRef.current(keys);
      pickerResolveManyRef.current = null;
    }
    setPickerOpen(false);
  }, []);

  const handleCancelPick = useCallback(() => {
    if (pickerResolveRef.current) {
      pickerResolveRef.current(null);
      pickerResolveRef.current = null;
    }
    if (pickerResolveManyRef.current) {
      pickerResolveManyRef.current(null);
      pickerResolveManyRef.current = null;
    }
    setPickerOpen(false);
  }, []);

  // ---------------------------
  // Section editing
  // ---------------------------
  const updateSection = useCallback((index: number, next: AnySection) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const copy = deepClone(prev);
      copy.sections[index] = next;
      return copy;
    });
  }, []);

  const removeSection = useCallback((index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const copy = deepClone(prev);
      copy.sections.splice(index, 1);
      return copy;
    });
    // keep selection safe after delete
    setSelectedIndex(0);
  }, []);

  const addSection = useCallback((type: AnySection['type']) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const maker = SECTION_REGISTRY[type]?.create;
      const next = maker ? maker() : undefined;
      if (!next) return prev;
      const updated = { ...prev, sections: [...prev.sections, next] };
      return updated;
    });
    // select the newly added section (at the end)
    setSelectedIndex((i) => {
      // we can’t read updated length here, but after setDraft it will be prevLen+1; selecting "end" on next effect:
      return i; // effect below will keep it in range; we’ll set explicitly once we know new length
    });
  }, []);

  // after an add, auto-select last if we detect we grew by one
  const prevLenRef = useRef<number>(0);
  useEffect(() => {
    if (!draft) return;
    const currentSections =
      activeTab === 'pages' && editingPageIndex !== null
        ? (draft.pages?.[editingPageIndex]?.sections ?? [])
        : draft.sections;
    const len = currentSections.length;
    if (prevLenRef.current && len === prevLenRef.current + 1) {
      // In main mode: header is slot 0, so last section = slot `len`.
      // In page mode: no header slot, so last section = slot `len - 1`.
      setSelectedIndex(activeTab === 'pages' && editingPageIndex !== null ? len - 1 : len);
    }
    prevLenRef.current = len;
  }, [draft, activeTab, editingPageIndex]);

  // reordering helpers
  function reorder<T>(arr: T[], from: number, to: number): T[] {
    const copy = arr.slice();
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    return copy;
  }
  const moveSection = useCallback((from: number, to: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      if (to < 0 || to >= prev.sections.length) return prev;
      return { ...prev, sections: reorder(prev.sections, from, to) };
    });
    // keep selection attached to the moved item if it was selected
    setSelectedIndex((sel) => {
      const selBody = sel - 1; // header occupies slot 0
      if (selBody === from) return to + 1;
      if (selBody === to) return from + 1; // swapped positions
      return sel;
    });
  }, []);

  const moveUp   = useCallback((index: number) => moveSection(index, index - 1), [moveSection]);
  const moveDown = useCallback((index: number) => moveSection(index, index + 1), [moveSection]);

  // ---------------------------
  // Page section mutations (mirrors main mutations but targets draft.pages[i].sections)
  // ---------------------------
  const updatePageSection = useCallback((pageIdx: number, sectionIdx: number, next: AnySection) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const pages = deepClone(prev.pages ?? []);
      pages[pageIdx].sections[sectionIdx] = next;
      return { ...prev, pages };
    });
  }, []);

  const removePageSection = useCallback((pageIdx: number, sectionIdx: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const pages = deepClone(prev.pages ?? []);
      pages[pageIdx].sections.splice(sectionIdx, 1);
      return { ...prev, pages };
    });
    setSelectedIndex(0);
  }, []);

  const addPageSection = useCallback((pageIdx: number, type: AnySection['type']) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const maker = SECTION_REGISTRY[type]?.create;
      const next = maker ? maker() : undefined;
      if (!next) return prev;
      const pages = deepClone(prev.pages ?? []);
      pages[pageIdx].sections = [...pages[pageIdx].sections, next];
      return { ...prev, pages };
    });
  }, []);

  // ---------------------------
  // Duplicate-an-existing-section (cross-page) support
  // ---------------------------
  type DuplicateSourceOption = { key: string; label: string };

  const duplicateSourceOptions = useMemo((): DuplicateSourceOption[] => {
    if (!draft) return [];
    const opts: DuplicateSourceOption[] = [];
    draft.sections.forEach((s, i) => {
      const label = SECTION_REGISTRY[s.type]?.label ?? s.type;
      opts.push({ key: `main:${i}`, label: `Main Page — ${label} (${s.id})` });
    });
    (draft.pages ?? []).forEach((p, pi) => {
      p.sections.forEach((s, i) => {
        const label = SECTION_REGISTRY[s.type]?.label ?? s.type;
        const pageName = p.title || p.slug || `Page ${pi + 1}`;
        opts.push({ key: `page:${pi}:${i}`, label: `${pageName} — ${label} (${s.id})` });
      });
    });
    return opts;
  }, [draft]);

  const findSectionByKey = useCallback((cfg: SiteConfig, key: string): AnySection | undefined => {
    const [kind, a, b] = key.split(':');
    if (kind === 'main') return cfg.sections[Number(a)];
    if (kind === 'page') return cfg.pages?.[Number(a)]?.sections[Number(b)];
    return undefined;
  }, []);

  const cloneWithNewId = (section: AnySection): AnySection => ({
    ...deepClone(section),
    id: `${section.type}-${Math.random().toString(36).slice(2, 7)}`,
  });

  const duplicateSectionIntoMain = useCallback((key: string) => {
    setDraft((prev) => {
      if (!prev || !key) return prev;
      const source = findSectionByKey(prev, key);
      if (!source) return prev;
      return { ...prev, sections: [...prev.sections, cloneWithNewId(source)] };
    });
  }, [findSectionByKey]);

  const duplicateSectionIntoPage = useCallback((pageIdx: number, key: string) => {
    setDraft((prev) => {
      if (!prev || !key) return prev;
      const source = findSectionByKey(prev, key);
      if (!source) return prev;
      const pages = deepClone(prev.pages ?? []);
      pages[pageIdx].sections = [...pages[pageIdx].sections, cloneWithNewId(source)];
      return { ...prev, pages };
    });
  }, [findSectionByKey]);

  const [duplicateSourceKey, setDuplicateSourceKey] = useState<string>('');

  const movePageSection = useCallback((pageIdx: number, from: number, to: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const pages = deepClone(prev.pages ?? []);
      const secs = pages[pageIdx].sections;
      if (to < 0 || to >= secs.length) return prev;
      pages[pageIdx].sections = reorder(secs, from, to);
      return { ...prev, pages };
    });
    setSelectedIndex((sel) => {
      if (sel === from) return to;
      if (sel === to) return from;
      return sel;
    });
  }, []);

  // ---------------------------
  // Drag-to-reorder (list-agnostic; works alongside the up/down buttons)
  // ---------------------------
  // While dragging, a placeholder gap is rendered before/after the hovered
  // row (picked from which half of the row the cursor is over) so the list
  // visibly "pushes" to show where the item will land on drop.
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

  // Shared by every drop target (a row, its placeholder, and the panel-level
  // fallback below) so a drop anywhere always resolves against the same
  // "from / last-hovered-over / before-or-after" state, however it's reached.
  const commitDrop = (over: number | null, onMove: (from: number, to: number) => void) => {
    const from = dragFromIndexRef.current;
    const after = dropAfter;
    clearDragState();
    if (from === null || over === null || from === over) return;
    // `onMove` splices `from` out before inserting at `to`, so once the
    // hovered row sits after the removal point its post-removal index
    // shifts back by one — account for that before adding the after-offset.
    const overAfterRemoval = over < from ? over : over - 1;
    const to = after ? overAfterRemoval + 1 : overAfterRemoval;
    onMove(from, to);
  };

  const makeDragHandlers = (sectionIndex: number, onMove: (from: number, to: number) => void) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragFromIndexRef.current = sectionIndex;
      setDraggingIndex(sectionIndex);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragFromIndexRef.current === null || dragFromIndexRef.current === sectionIndex) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const isAfter = e.clientY - rect.top > rect.height / 2;
      setDragOverIndex(sectionIndex);
      setDropAfter(isAfter);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      commitDrop(sectionIndex, onMove);
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
  const dragFallbackHandlers = (onMove: (from: number, to: number) => void) => ({
    onDragOver: (e: React.DragEvent) => {
      if (dragFromIndexRef.current === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    },
    onDrop: (e: React.DragEvent) => {
      if (dragFromIndexRef.current === null) return;
      e.preventDefault();
      commitDrop(dragOverIndex, onMove);
    },
  });

  // Mirrors a real row's classes/content (invisibly) so it matches its size and
  // border radius exactly, instead of guessing at a fixed height.
  // Carries the same drag handlers as the row it sits next to: it renders
  // exactly where the pointer is aiming, so without its own onDragOver/onDrop
  // the browser sees a drop over a non-target element and reverts the drag
  // (the row "snaps back") instead of actually reordering.
  const renderDragPlaceholder = (index: number, onMove: (from: number, to: number) => void) => (
    <div
      {...makeDragHandlers(index, onMove)}
      className="card  admin-card p-3 w-full flex items-start justify-between gap-2 !border-2 !border-dashed !border-primary/60 !bg-none !bg-primary/5 !shadow-none"
    >
      <div className="flex flex-row gap-3 invisible opacity-0">
        <div className="flex flex-col items-center justify-center !my-[-.4rem]">
          <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
        </div>
        <div className="min-w-0">
          <div className="font-medium">Section</div>
          <div className="text-xs break-all">placeholder-id</div>
        </div>
      </div>
    </div>
  );

  // ---------------------------
  // Page CRUD
  // ---------------------------
  // Custom pages are kept in sync with the header/footer nav: adding a page
  // appends a nav link, renaming/re-slugging updates it in place, and
  // deleting the page removes it — so the nav never points at a dead page.
  const pageHref = (slug: string) => `/${slug}`;

  const syncFlatLinks = (
    links: { label: string; href: string }[],
    oldHref: string,
    nextLink: { label: string; href: string } | null
  ) =>
    nextLink
      ? links.map((l) => (l.href === oldHref ? nextLink : l))
      : links.filter((l) => l.href !== oldHref);

  // Same as syncFlatLinks, but also looks inside dropdown-group children —
  // a page link can live nested in a header nav group, not just top-level.
  const syncNavLinks = (
    links: HeaderNavItem[],
    oldHref: string,
    nextLink: { label: string; href: string } | null
  ): HeaderNavItem[] =>
    links
      .map((l) => {
        if (l.href === oldHref) return nextLink ?? null;
        if (l.children?.length) return { ...l, children: syncFlatLinks(l.children, oldHref, nextLink) };
        return l;
      })
      .filter((l): l is HeaderNavItem => l !== null);

  const addPage = useCallback(() => {
    const slug = `page-${Math.random().toString(36).slice(2, 6)}`;
    const title = 'New Page';
    const newPage: SitePage = { slug, title, sections: [] };
    const navLink = { label: title, href: pageHref(slug) };

    setDraft((prev) => {
      if (!prev) return prev;

      const header: HeaderSection | undefined = prev.header
        ? { ...prev.header, links: [...(prev.header.links ?? []), navLink] }
        : prev.header;

      let footer: FooterSection | undefined = prev.footer;
      if (footer) {
        const columns = deepClone(footer.columns ?? []);
        if (columns.length > 0) {
          columns[0] = { ...columns[0], links: [...columns[0].links, navLink] };
        } else {
          columns.push({ title: 'Pages', links: [navLink] });
        }
        footer = { ...footer, columns };
      }

      return { ...prev, pages: [...(prev.pages ?? []), newPage], header, footer };
    });
  }, []);

  const deletePage = useCallback((pageIdx: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const target = prev.pages?.[pageIdx];
      const pages = (prev.pages ?? []).filter((_, i) => i !== pageIdx);
      if (!target) return { ...prev, pages };

      const oldHref = pageHref(target.slug);
      const header: HeaderSection | undefined = prev.header
        ? { ...prev.header, links: syncNavLinks(prev.header.links ?? [], oldHref, null) }
        : prev.header;
      const footer: FooterSection | undefined = prev.footer
        ? {
            ...prev.footer,
            columns: (prev.footer.columns ?? []).map((c) => ({
              ...c,
              links: syncFlatLinks(c.links, oldHref, null),
            })),
          }
        : prev.footer;

      return { ...prev, pages, header, footer };
    });
    setEditingPageIndex(null);
    setActiveTab('main');
    setSelectedIndex(0);
  }, []);

  const updatePageMeta = useCallback((pageIdx: number, patch: Partial<SitePage>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const pages = deepClone(prev.pages ?? []);
      const oldPage = pages[pageIdx];
      if (!oldPage) return prev;
      const updated = { ...oldPage, ...patch };
      pages[pageIdx] = updated;

      const oldHref = pageHref(oldPage.slug);
      const newLink = { label: updated.title, href: pageHref(updated.slug) };

      const header: HeaderSection | undefined = prev.header
        ? { ...prev.header, links: syncNavLinks(prev.header.links ?? [], oldHref, newLink) }
        : prev.header;
      const footer: FooterSection | undefined = prev.footer
        ? {
            ...prev.footer,
            columns: (prev.footer.columns ?? []).map((c) => ({
              ...c,
              links: syncFlatLinks(c.links, oldHref, newLink),
            })),
          }
        : prev.footer;

      return { ...prev, pages, header, footer };
    });
  }, []);

  // ---------------------------
  // Save
  // ---------------------------
  const canSave = useMemo(() => !!draft && Array.isArray(draft.sections), [draft]);

  const onSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);

    try {
      const variant = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? 'draft') as 'draft' | 'published';
      const url = `/api/admin/config/${encodeURIComponent(siteId)}?variant=${variant}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-local-admin': '1',
        },
        body: JSON.stringify(normalizeSiteConfig(draft)),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Save failed with HTTP ${res.status}`);
      }

      const saved: SiteConfig = await res.json();
      setConfig(saved);
      originalRef.current = deepClone(saved);
      clearStoredDraft(siteId);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [draft, onClose, setConfig, siteId]);

  const onRestore = useCallback(() => {
    if (!originalRef.current) return;
    const restored = deepClone(originalRef.current);
    setDraft(restored);
    setSelectedIndex(0);
    clearStoredDraft(siteId);
  }, [siteId]);

  const returnToEditor = useCallback(() => {
    if (previewDraftRef.current) {
      ignoreConfigSyncRef.current = true;
      setConfig(previewDraftRef.current);
    }
    setIsPreviewing(false);
  }, [setConfig]);

  const undoChanges = useCallback(() => {
    if (!originalRef.current) return;
    const restored = deepClone(originalRef.current);
    ignoreConfigSyncRef.current = true;
    setConfig(restored);
    setDraft(restored);
    previewDraftRef.current = null;
    setIsPreviewing(false);
    clearStoredDraft(siteId);
    onClose();
  }, [onClose, setConfig, siteId]);

  // ---------------------------
  // Named versions (save/list/load/delete snapshots in S3)
  // ---------------------------
  const versionsUrl = `/api/admin/config/${encodeURIComponent(siteId)}/versions`;

  const [showVersionsPanel, setShowVersionsPanel] = useState(false);
  const [versions, setVersions] = useState<SiteConfigVersionMeta[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);
  const [newVersionName, setNewVersionName] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);
  const [busyVersionId, setBusyVersionId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setVersionsLoading(true);
    setVersionsError(null);
    try {
      const res = await adminFetch(versionsUrl);
      if (!res.ok) throw new Error(`Failed to load versions (HTTP ${res.status})`);
      const data: { versions: SiteConfigVersionMeta[] } = await res.json();
      setVersions(Array.isArray(data.versions) ? data.versions : []);
    } catch (e) {
      setVersionsError(e instanceof Error ? e.message : 'Failed to load versions.');
    } finally {
      setVersionsLoading(false);
    }
  }, [versionsUrl]);

  const openVersionsPanel = useCallback(() => {
    setShowVersionsPanel(true);
    fetchVersions();
  }, [fetchVersions]);

  const saveAsVersion = useCallback(async () => {
    if (!draft) return;
    const name = newVersionName.trim();
    if (!name) return;

    setSavingVersion(true);
    setVersionsError(null);
    try {
      const res = await adminFetch(versionsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config: normalizeSiteConfig(draft) }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Failed to save version (HTTP ${res.status})`);
      }
      const meta: SiteConfigVersionMeta = await res.json();
      setVersions((prev) => [meta, ...prev]);
      setNewVersionName('');
    } catch (e) {
      setVersionsError(e instanceof Error ? e.message : 'Failed to save version.');
    } finally {
      setSavingVersion(false);
    }
  }, [draft, newVersionName, versionsUrl]);

  const loadVersion = useCallback(
    async (version: SiteConfigVersionMeta) => {
      if (
        isDirty &&
        !window.confirm(
          `Loading "${version.name}" will replace your current unsaved changes in the editor. Continue?`
        )
      ) {
        return;
      }
      setBusyVersionId(version.id);
      setVersionsError(null);
      try {
        const res = await adminFetch(`${versionsUrl}/${encodeURIComponent(version.id)}`);
        if (!res.ok) throw new Error(`Failed to load "${version.name}" (HTTP ${res.status})`);
        const loaded: SiteConfig = await res.json();
        setDraft(loaded);
        setSelectedIndex(0);
        setShowVersionsPanel(false);
      } catch (e) {
        setVersionsError(e instanceof Error ? e.message : 'Failed to load version.');
      } finally {
        setBusyVersionId(null);
      }
    },
    [isDirty, versionsUrl]
  );

  const deleteVersion = useCallback(
    async (version: SiteConfigVersionMeta) => {
      if (!window.confirm(`Delete saved version "${version.name}"? This cannot be undone.`)) return;
      setBusyVersionId(version.id);
      setVersionsError(null);
      try {
        const res = await adminFetch(`${versionsUrl}/${encodeURIComponent(version.id)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`Failed to delete "${version.name}" (HTTP ${res.status})`);
        setVersions((prev) => prev.filter((v) => v.id !== version.id));
      } catch (e) {
        setVersionsError(e instanceof Error ? e.message : 'Failed to delete version.');
      } finally {
        setBusyVersionId(null);
      }
    },
    [versionsUrl]
  );

  // ---------------------------
  // Single-section editor renderer
  // ---------------------------
  function renderEditor(
    section: AnySection,
    index: number,
    onChange: (next: AnySection) => void
  ) {
    const Editor = getEditorForSection(section);

    return (
      <>
        <div className="flex items-center justify-between">
          <div className="font-semibold">{section.type.toUpperCase()}</div>
          <div className="pt-2 flex items-center gap-2">
            <div className="flex-1" />
            {section.type !== 'header' && section.type !== 'footer' && index >= 0 && (
              <button className="btn btn-ghost" onClick={() => removeSection(index)}>
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
                Remove section
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium">ID</label>
              <input className="input w-full" value={section.id} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium">Type</label>
              <input className="input w-full" value={section.type} readOnly />
            </div>
            <label className="flex items-end gap-2">
              <input
                type="checkbox"
                checked={
                  section.type === 'header'
                    ? (draft?.showHeader ?? true)
                    : section.type === 'footer'
                      ? (draft?.showFooter ?? true)
                      : section.visible !== false
                }
                onChange={(e) => {
                  if (section.type === 'header') {
                    setDraft((prev) => (prev ? { ...prev, showHeader: e.target.checked } : prev));
                    return;
                  }
                  if (section.type === 'footer') {
                    setDraft((prev) => (prev ? { ...prev, showFooter: e.target.checked } : prev));
                    return;
                  }
                  onChange({ ...section, visible: e.target.checked });
                }}
              />
              <span>{section.type === 'header' || section.type === 'footer' ? 'Show' : 'Visible'}</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Top wave</label>
              <select
                className="select w-full"
                value={section.topWaveType ?? ''}
                onChange={(e) =>
                  onChange({
                    ...section,
                    topWaveType: (e.target.value || undefined) as AnySection['topWaveType'],
                  })
                }
              >
                <option value="">— none —</option>
                {WAVE_TYPES.map((waveType) => (
                  <option key={waveType} value={waveType}>
                    {waveType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Bottom wave</label>
              <select
                className="select w-full"
                value={section.bottomWaveType ?? ''}
                onChange={(e) =>
                  onChange({
                    ...section,
                    bottomWaveType: (e.target.value || undefined) as AnySection['bottomWaveType'],
                  })
                }
              >
                <option value="">— none —</option>
                {WAVE_TYPES.map((waveType) => (
                  <option key={waveType} value={waveType}>
                    {waveType}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Type-specific */}
          {Editor ? (
            <Editor
              section={section as AnySection}
              onChange={(s: AnySection) => onChange(s)}
              openMediaPicker={openMediaPicker}
              openMediaPickerMulti={openMediaPickerMulti}
              siteId={siteId}
            />
          ) : (
            <div className="text-sm text-muted">
              No editor implemented for <code>{section.type}</code> yet.
            </div>
          )}

        </div>
      </>
    );
  }

  // ---------------------------
  // UI
  // ---------------------------
  if (!draft) {
    return (
      <div className="fixed inset-0 z-[1200] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card p-6">
          <div className="text-sm text-muted">Loading config…</div>
          <div className="mt-4 text-right">
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPreviewing) {
    return (
      <div className="fixed inset-0 z-[12000] pointer-events-none">
        <div className="fixed top-[90px] right-4 z-[12010] pointer-events-auto">
          <div className="card card-solid admin-card px-4 py-3 flex items-center gap-3">
            <div className="text-sm text-muted">Previewing draft</div>
            <button className="btn btn-primary" onClick={onSave} disabled={!canSave || saving || !isDirty}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-ghost" onClick={undoChanges}>
              Undo Changes
            </button>
            <button className="btn btn-inverted" onClick={returnToEditor}>
              Return to editor
            </button>
          </div>
        </div>
      </div>
    );
  }

  // page-mode helpers
  const inPageMode = activeTab === 'pages' && editingPageIndex !== null;
  const currentSectionCount = inPageMode
    ? (draft.pages?.[editingPageIndex!]?.sections.length ?? 0)
    : draft.sections.length;

  const selected = inPageMode
    ? (selectedSlot?.kind === 'section'
        ? draft.pages?.[editingPageIndex!]?.sections[selectedSlot.index]
        : undefined)
    : selectedSlot?.kind === 'header'
      ? draft.header
      : selectedSlot?.kind === 'footer'
        ? draft.footer
        : selectedSlot?.kind === 'section'
          ? draft.sections[selectedSlot.index]
          : undefined;

  // Which list the drag-fallback (see dragFallbackHandlers) should reorder —
  // whichever section list is actually on screen right now.
  const activeMoveFn: ((from: number, to: number) => void) | null =
    activeTab === 'main'
      ? moveSection
      : activeTab === 'pages' && editingPageIndex !== null
        ? (from, to) => movePageSection(editingPageIndex, from, to)
        : null;

  return (
    <div className="fixed edit-modal config-modal-root inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
      <div className="card card-solid admin-card p-4 relative w-fit !max-w-full pr-[70px] overflow-hidden card-screen-height !pt-0">
        {/* Header + unsaved-changes banner stay pinned together while the modal scrolls */}
        <div className="config-modal-sticky-header">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="font-semibold text-lg">Edit Site Content</div>
            <div className="flex items-center gap-2 save-config-btns">
              {error && <div className="text-red-600 text-sm mr-3">{error}</div>}
              {isDirty && (
                <button className="btn btn-inverted" onClick={startPreview}>
                  Preview
                </button>
              )}
              {isDirty && (
                <button className="btn btn-ghost" onClick={onRestore}>
                  Restore
                </button>
              )}
              <button className="btn btn-ghost" onClick={openVersionsPanel}>
                Versions
              </button>
              <button className="btn btn-ghost" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onSave} disabled={!canSave || saving || !isDirty}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
          {isDirty && !pendingLocalDraft && (
            <div className="text-right px-4 py-2 border-b bg-blue-50 font-bold text-red-900 text-sm flex flex-wrap justify-end items-center content-end gap-2">
              <span aria-hidden="true">⚠</span>
              <span>
                You have unsaved changes. They&apos;re autosaved in this browser as a backup, but click{' '}
                <strong>Save Changes</strong> to actually publish them.
              </span>
            </div>
          )}
        </div>
        {pendingLocalDraft && (
          <div className="p-3 border-b bg-amber-50 text-amber-900 flex items-center justify-between gap-3 text-sm">
            <div>
              We found unsaved edits from {new Date(pendingLocalDraft.savedAt).toLocaleString()} that were never saved
              (e.g. a closed tab or crash). Restore them?
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="btn btn-primary" onClick={dismissLocalDraft}>
                Discard
              </button>
              <button className="btn btn-primary" onClick={acceptLocalDraft}>
                Restore
              </button>
            </div>
          </div>
        )}
        {adminAiEnabled && (
          <div className="p-4 border-b">
            <AdminAIChatPanel
              mode="inline"
              title="AI (Edit Sections)"
              placeholder="Ask AI to update sections, content, or theme..."
              config={draft}
              onApplyPatch={(patch) => {
                pendingAutoPreviewRef.current = true;
                setDraft((prev) => (prev ? applySiteConfigPatch(prev, patch) : prev));
              }}
            />
          </div>
        )}
 {/* Page tabs: Main Page + every custom page, in one row, plus Add New Page */}
            <div className="flex flex-wrap items-center gap-2 border-b pb-3 pt-3">
              <button
                className={['btn btn-ghost text-sm px-3 py-1', activeTab === 'main' ? 'font-bold underline' : ''].join(' ')}
                onClick={() => { setActiveTab('main'); setEditingPageIndex(null); setSelectedIndex(0); }}
              >
                Main Page
              </button>
              {(draft.pages ?? []).map((page, i) => (
                <button
                  key={page.slug}
                  className={[
                    'btn btn-ghost text-sm px-3 py-1',
                    activeTab === 'pages' && editingPageIndex === i ? 'font-bold underline' : '',
                  ].join(' ')}
                  onClick={() => { setActiveTab('pages'); setEditingPageIndex(i); setSelectedIndex(0); }}
                >
                  {page.title || page.slug || 'Untitled'}
                </button>
              ))}
              <button className="btn btn-ghost text-sm px-3 py-1 ml-auto flex-shrink-0" onClick={addPage}>
                + Add New Page
              </button>
            </div>
        {/* Body */}
        <div className="grid md:grid-cols-3 gap-0">
          {/* Left panel */}
          <div
            className="border-r p-4 space-y-3"
            {...(activeMoveFn ? dragFallbackHandlers(activeMoveFn) : {})}
          >

           

            {/* ── PAGE SECTION EDITING view ── */}
            {activeTab === 'pages' && editingPageIndex !== null && (
              <>
                {/* Page meta */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold">Page Settings</div>
                    <button
                      className="btn btn-ghost text-red-500 text-xs !px-2 !py-1"
                      onClick={() => deletePage(editingPageIndex)}
                      title="Delete this page"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" /> Delete
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-0.5">Page Title</label>
                    <input
                      className="input w-full text-sm"
                      value={draft.pages?.[editingPageIndex]?.title ?? ''}
                      onChange={(e) => updatePageMeta(editingPageIndex, { title: e.target.value })}
                      placeholder="My Page"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-0.5">Slug (URL path)</label>
                    <input
                      className="input w-full text-sm font-mono"
                      value={draft.pages?.[editingPageIndex]?.slug ?? ''}
                      onChange={(e) => updatePageMeta(editingPageIndex, { slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })}
                      placeholder="my-page"
                    />
                    <p className="text-xs text-muted mt-0.5">Accessible at /{draft.pages?.[editingPageIndex]?.slug}</p>
                  </div>
                </div>

                {/* Section list for this page */}
                <div className="space-y-2">
                  {slots.map((slot, i) => {
                    if (slot.kind !== 'section') return null;
                    const s = slot.section;
                    const isSelected = i === selectedIndex;
                    const isDragTarget = draggingIndex !== null && dragOverIndex === slot.index;
                    return (
                      <Fragment key={`page-sec:${s.id}`}>
                        {isDragTarget &&
                          !dropAfter &&
                          renderDragPlaceholder(slot.index, (from, to) => movePageSection(editingPageIndex, from, to))}
                        <div
                        onClick={() => setSelectedIndex(i)}
                        {...makeDragHandlers(slot.index, (from, to) => movePageSection(editingPageIndex, from, to))}
                        className={[
                          'card card-solid admin-card p-3 w-full text-left flex items-start justify-between gap-2 transition hover:cursor-pointer',
                          isSelected ? 'outline outline-2 outline-primary bg-black/5' : 'hover:bg-black/5',
                          draggingIndex === slot.index ? 'opacity-40' : '',
                        ].join(' ')}
                        aria-current={isSelected ? 'true' : undefined}
                      >
                        <div className="flex flex-row gap-3">
                          <div className="flex flex-col items-center justify-center !my-[-.4rem] cursor-grab active:cursor-grabbing text-muted" title="Drag to reorder">
                            <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
                          </div>
                          <div className="flex flex-col gap-1 !my-[-.4rem]">
                            {slot.index > 0 && (
                              <button
                                className="btn btn-ghost !px-2 !py-1"
                                onClick={(e) => { e.stopPropagation(); movePageSection(editingPageIndex, slot.index, slot.index - 1); }}
                                title="Move up"
                              >
                                <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                              </button>
                            )}
                            {slot.index < currentSectionCount - 1 && (
                              <button
                                className="btn btn-ghost !px-2 !py-1"
                                onClick={(e) => { e.stopPropagation(); movePageSection(editingPageIndex, slot.index, slot.index + 1); }}
                                title="Move down"
                              >
                                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                              </button>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium">{s.type}</div>
                            <div className="text-xs text-muted break-all">{s.id}</div>
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => { e.stopPropagation(); removePageSection(editingPageIndex, slot.index); }}
                          title="Remove section"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </button>
                        </div>
                        {isDragTarget &&
                          dropAfter &&
                          renderDragPlaceholder(slot.index, (from, to) => movePageSection(editingPageIndex, from, to))}
                      </Fragment>
                    );
                  })}
                  {currentSectionCount === 0 && (
                    <div className="text-muted text-sm">No sections yet. Add one below.</div>
                  )}
                </div>

                {/* Add section */}
                <div className="pt-4 border-t">
                  <div className="text-sm opacity-70 mb-2">Add section</div>
                  <div className="flex flex-wrap gap-2">
                    {getAllowedSectionTypes().map((t) => (
                      <button
                        key={t}
                        className="btn btn-inverted"
                        onClick={() => addPageSection(editingPageIndex, t)}
                      >
                        {SECTION_REGISTRY[t].label}
                      </button>
                    ))}
                  </div>

                  <div className="text-sm opacity-70 mt-3 mb-2">Duplicate existing section</div>
                  <div className="flex flex-col gap-2">
                    <select
                      className="select w-full"
                      value={duplicateSourceKey}
                      onChange={(e) => setDuplicateSourceKey(e.target.value)}
                    >
                      <option value="">— choose a section —</option>
                      {duplicateSourceOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-inverted w-full"
                      disabled={!duplicateSourceKey}
                      onClick={() => {
                        duplicateSectionIntoPage(editingPageIndex, duplicateSourceKey);
                        setDuplicateSourceKey('');
                      }}
                    >
                      <FontAwesomeIcon icon={faClone} className="text-sm" />
                      Duplicate
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── MAIN PAGE section list ── */}
            {activeTab === 'main' && (
              <>
                <div className="space-y-2">
                  {slots.map((slot, i) => {
                    const s = slot.section;
                    const isLocked = slot.kind === 'header' || slot.kind === 'footer';
                    const isSelected = i === selectedIndex;
                    const isDragTarget =
                      slot.kind === 'section' && draggingIndex !== null && dragOverIndex === slot.index;
                    return (
                      <Fragment key={`${slot.kind}:${s.id}`}>
                        {isDragTarget && !dropAfter && renderDragPlaceholder(slot.index, moveSection)}
                        <div
                        onClick={() => setSelectedIndex(i)}
                        {...(slot.kind === 'section' ? makeDragHandlers(slot.index, moveSection) : {})}
                        className={[
                          'card card-solid admin-card p-3 w-full text-left flex items-start justify-between gap-2 transition hover:cursor-pointer',
                          isSelected ? 'outline outline-2 outline-primary bg-black/5' : 'hover:bg-black/5',
                          slot.kind === 'section' && draggingIndex === slot.index ? 'opacity-40' : '',
                        ].join(' ')}
                        aria-current={isSelected ? 'true' : undefined}
                      >
                        <div className="flex flex-row gap-3">
                          {!isLocked && (
                            <div
                              className="flex flex-col items-center justify-center !my-[-.4rem] cursor-grab active:cursor-grabbing text-muted"
                              title="Drag to reorder"
                            >
                              <FontAwesomeIcon icon={faGripVertical} className="text-xs" />
                            </div>
                          )}
                          <div className="flex flex-col gap-1 !my-[-.4rem]">
                            {!isLocked && slot.kind === 'section' && slot.index > 0 && (
                              <button
                                className="btn btn-ghost !px-2 !py-1"
                                onClick={(e) => { e.stopPropagation(); moveUp(slot.index); }}
                                title="Move up"
                              >
                                <FontAwesomeIcon icon={faChevronUp} className="text-xs" />
                              </button>
                            )}
                            {!isLocked && slot.kind === 'section' && slot.index < currentSectionCount - 1 && (
                              <button
                                className="btn btn-ghost !px-2 !py-1"
                                onClick={(e) => { e.stopPropagation(); moveDown(slot.index); }}
                                title="Move down"
                              >
                                <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
                              </button>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium">{s.type}</div>
                            <div className="text-xs text-muted break-all">{s.id}</div>
                          </div>
                        </div>
                        {slot.kind === 'section' && (
                          <button
                            className="btn btn-ghost"
                            onClick={(e) => { e.stopPropagation(); removeSection(slot.index); }}
                            title="Remove section"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        )}
                        </div>
                        {isDragTarget && dropAfter && renderDragPlaceholder(slot.index, moveSection)}
                      </Fragment>
                    );
                  })}
                  {draft.sections.length === 0 && (
                    <div className="text-muted text-sm">No body sections yet.</div>
                  )}
                </div>

                {/* Quick add */}
                <div className="pt-4 border-t">
                  <div className="text-sm opacity-70 mb-2">Add section</div>
                  <div className="flex flex-wrap gap-2">
                    {getAllowedSectionTypes().map((t) => (
                      <button
                        key={t}
                        className="btn btn-inverted"
                        onClick={() => addSection(t)}
                      >
                        {SECTION_REGISTRY[t].label}
                      </button>
                    ))}
                  </div>

                  <div className="text-sm opacity-70 mt-3 mb-2">Duplicate existing section</div>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="select flex-1 min-w-0"
                      value={duplicateSourceKey}
                      onChange={(e) => setDuplicateSourceKey(e.target.value)}
                    >
                      <option value="">— choose a section —</option>
                      {duplicateSourceOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-inverted"
                      disabled={!duplicateSourceKey}
                      onClick={() => {
                        duplicateSectionIntoMain(duplicateSourceKey);
                        setDuplicateSourceKey('');
                      }}
                    >
                      <FontAwesomeIcon icon={faClone} className="text-sm" />
                      Duplicate
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Right: editor panel */}
          <div className="md:col-span-2 p-4 space-y-4">
            {activeTab === 'pages' && editingPageIndex === null ? (
              <div className="text-sm text-muted">Select a page to edit its sections, or create a new one.</div>
            ) : selected ? (
              <div key={selected.id} className="card card-solid admin-card p-4 space-y-3 right-editor-card">
                {inPageMode
                  ? (selectedSlot?.kind === 'section'
                      ? renderEditor(selected as AnySection, selectedSlot.index, (next) =>
                          updatePageSection(editingPageIndex!, selectedSlot.index, next)
                        )
                      : null)
                  : selectedSlot?.kind === 'header'
                    ? renderEditor(selected as AnySection, -1, (next) =>
                        setDraft((prev) => (prev ? { ...prev, header: next as HeaderSection } : prev))
                      )
                    : selectedSlot?.kind === 'footer'
                      ? renderEditor(selected as AnySection, -1, (next) =>
                          setDraft((prev) => (prev ? { ...prev, footer: next as FooterSection } : prev))
                        )
                      : selectedSlot?.kind === 'section'
                        ? renderEditor(selected as AnySection, selectedSlot.index, (next) =>
                            updateSection(selectedSlot.index, next)
                          )
                        : null}
              </div>
            ) : (
              <div className="text-sm text-muted">Select a section to edit.</div>
            )}
          </div>
        </div>
      </div>

      {/* Media Picker Overlay */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[1300] bg-black/60 flex items-center justify-center p-4">
          <div className="card card-solid admin-card p-4 relative w-fit max-w-[95vw] pr-[70px] max-h-[90vh] overflow-auto">
            <button
              onClick={handleCancelPick}
              className="absolute right-3 top-3 btn btn-ghost"
              aria-label="Close media picker"
            >
              ✕
            </button>
            <MediaPicker
              bucket={bucket}
              prefix={pickerPrefix}
              multiple={pickerMultiple}
              initialSelected={pickerInitialSelected}
              onPick={(key) => {
                handlePick(key);
              }}
              onPickMany={(keys) => {
                handlePickMany(keys);
              }}
            />
          </div>
        </div>
      )}

      {/* Saved Versions Overlay */}
      {showVersionsPanel && (
        <div className="fixed inset-0 z-[13000] bg-black/60 flex items-center justify-center p-4">
          <div className="card card-solid admin-card p-4 relative w-full max-w-lg max-h-[85vh] flex flex-col gap-4">
            <button
              onClick={() => setShowVersionsPanel(false)}
              className="absolute right-3 top-3 btn btn-ghost"
              aria-label="Close saved versions"
            >
              ✕
            </button>

            <div className="font-semibold text-lg">Saved Versions</div>

            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                placeholder="Name this version…"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newVersionName.trim() && !savingVersion) saveAsVersion();
                }}
              />
              <button
                className="btn btn-primary flex-shrink-0"
                onClick={saveAsVersion}
                disabled={!newVersionName.trim() || savingVersion}
              >
                {savingVersion ? 'Saving…' : 'Save Current As Version'}
              </button>
            </div>
            <p className="text-xs text-muted -mt-2">
              Saves what&apos;s currently in the editor (including unsaved changes) as a named snapshot you can come back to.
            </p>

            {versionsError && <div className="text-red-600 text-sm">{versionsError}</div>}

            <div className="overflow-y-auto space-y-2 pr-1">
              {versionsLoading && <div className="text-sm text-muted">Loading versions…</div>}
              {!versionsLoading && versions.length === 0 && (
                <div className="text-sm text-muted">No saved versions yet.</div>
              )}
              {versions.map((v) => (
                <div
                  key={v.id}
                  className="card card-solid admin-card p-3 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{v.name}</div>
                    <div className="text-xs text-muted">{new Date(v.savedAt).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      className="btn btn-ghost text-sm"
                      onClick={() => loadVersion(v)}
                      disabled={busyVersionId === v.id}
                    >
                      {busyVersionId === v.id ? '…' : 'Load'}
                    </button>
                    <button
                      className="btn btn-ghost text-red-500 text-sm"
                      onClick={() => deleteVersion(v)}
                      disabled={busyVersionId === v.id}
                      title="Delete version"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
