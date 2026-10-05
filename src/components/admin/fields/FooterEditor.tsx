'use client';

import { useCallback, useMemo } from 'react';
import type { FooterSection } from '@/types/site';
import type { EditorProps } from './types';
import { useSite } from '@/context/SiteContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

// tiny immutable helper (kept consistent with other editors)
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

export default function EditFooter({
  section,
  onChange,
}: EditorProps<FooterSection>) {
  const columns = section.columns ?? [];
  const { config } = useSite();
  // Dedupe by id: a config can end up with duplicate section ids (bad data),
  // which would otherwise crash this dropdown on a React "duplicate key" error.
  const allSections = useMemo(() => {
    const seen = new Set<string>();
    return (config?.sections ?? []).filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [config?.sections]);
  const allPages = useMemo(() => config?.pages ?? [], [config?.pages]);

  const setField = useCallback(
    <K extends keyof FooterSection>(key: K, value: FooterSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const addColumn = useCallback(() => {
    const next = deepClone(section);
    next.columns = [
      ...(next.columns ?? []),
      { title: '', links: [{ label: '', href: '' }] },
    ];
    onChange(next);
  }, [onChange, section]);

  const removeColumn = useCallback(
    (idx: number) => {
      const next = deepClone(section);
      next.columns = (next.columns ?? []).filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, section]
  );

  const moveColumn = useCallback(
    (from: number, to: number) => {
      const next = deepClone(section);
      const arr = next.columns ?? [];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      next.columns = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const setColumnTitle = useCallback(
    (idx: number, title: string) => {
      const next = deepClone(section);
      const arr = next.columns ?? [];
      arr[idx] = { ...(arr[idx] ?? { links: [] }), title };
      next.columns = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const addLink = useCallback(
    (colIdx: number) => {
      const next = deepClone(section);
      const arr = next.columns ?? [];
      const col = arr[colIdx] ?? { title: '', links: [] };
      col.links = [...(col.links ?? []), { label: '', href: '' }];
      arr[colIdx] = col;
      next.columns = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const updateLink = useCallback(
    (
      colIdx: number,
      linkIdx: number,
      patch: Partial<NonNullable<FooterSection['columns']>[number]['links'][number]>
    ) => {
      const next = deepClone(section);
      const col = (next.columns ?? [])[colIdx];
      if (!col) return;
      const links = col.links ?? [];
      links[linkIdx] = { ...(links[linkIdx] ?? { label: '', href: '' }), ...patch };
      col.links = links;
      (next.columns ?? [])[colIdx] = col;
      onChange(next);
    },
    [onChange, section]
  );

  const removeLink = useCallback(
    (colIdx: number, linkIdx: number) => {
      const next = deepClone(section);
      const col = (next.columns ?? [])[colIdx];
      if (!col) return;
      col.links = (col.links ?? []).filter((_, i) => i !== linkIdx);
      (next.columns ?? [])[colIdx] = col;
      onChange(next);
    },
    [onChange, section]
  );

  const moveLink = useCallback(
    (colIdx: number, from: number, to: number) => {
      const next = deepClone(section);
      const col = (next.columns ?? [])[colIdx];
      if (!col) return;
      const arr = col.links ?? [];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      col.links = arr;
      (next.columns ?? [])[colIdx] = col;
      onChange(next);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-6">
      {/* Legal line */}
      <div>
        <label className="block text-sm font-medium">Legal Text</label>
        <input
          className="input w-full"
          value={section.legal ?? ''}
          onChange={(e) => setField('legal', e.target.value)}
          placeholder="© 2025 Your Company. All rights reserved."
        />
      </div>

      {/* Columns */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Columns</div>
        <button className="btn btn-ghost" onClick={addColumn}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />Add column
        </button>
      </div>

      <div className="space-y-4">
        {columns.map((col, ci) => {
          const links = col.links ?? [];
          return (
            <div key={`footer-col-${ci}`} className="card admin-card card-solid p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="Column title (optional)"
                  value={col.title ?? ''}
                  onChange={(e) => setColumnTitle(ci, e.target.value)}
                />
                <button
                  className="btn btn-ghost"
                  onClick={() => moveColumn(ci, ci - 1)}
                  disabled={ci === 0}
                  title="Move column up"
                >
                  <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => moveColumn(ci, ci + 1)}
                  disabled={ci === columns.length - 1}
                  title="Move column down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => removeColumn(ci)}
                  title="Remove column"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>

              {/* Links */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-70">Links</div>
                  <button className="btn btn-ghost" onClick={() => addLink(ci)}>
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />Add link
                  </button>
                </div>

                {links.map((lnk, li) => {
                  const { kind, sectionId } = hrefKind(lnk.href);

                  return (
                    <div
                      key={`footer-col-${ci}-link-${li}`}
                      className="grid md:grid-cols-[1fr_auto_1fr_auto_auto_auto] gap-2"
                    >
                      {/* Label */}
                      <input
                        className="input"
                        placeholder="Label"
                        value={lnk.label}
                        onChange={(e) => updateLink(ci, li, { label: e.target.value })}
                      />

                      {/* Mode */}
                      <select
                        className="select w-36"
                        value={kind}
                        onChange={(e) => {
                          const nextKind = e.target.value as 'internal' | 'external' | 'sub-page';
                          if (nextKind === 'internal') {
                            const first = allSections[0]?.id ?? '';
                            updateLink(ci, li, { href: first ? `/#${first}` : '' });
                          } else if (nextKind === 'sub-page') {
                            const first = allPages[0]?.slug ?? '';
                            updateLink(ci, li, { href: first ? `/${first.replace(/^\/+/, '')}` : '' });
                          } else {
                            updateLink(ci, li, { href: '' });
                          }
                        }}
                      >
                        <option value="internal">Internal</option>
                        <option value="sub-page">Sub-page</option>
                        <option value="external">External</option>
                      </select>

                      {/* Target */}
                      {kind === 'internal' ? (
                        <select
                          className="select"
                          value={sectionId || (lnk.href === '/' ? '/' : '')}
                          onChange={(e) => {
                            const id = e.target.value;
                            updateLink(ci, li, { href: id === '/' ? '/' : id ? `/#${id}` : '' });
                          }}
                        >
                          <option value="">— Select section —</option>
                          <option value="/">Home â€¢ Top of page</option>
                          {allSections.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.type.charAt(0).toUpperCase() + s.type.slice(1)} • {s.id}
                            </option>
                          ))}
                        </select>
                      ) : kind === 'sub-page' ? (
                        <select
                          className="select"
                          value={lnk.href}
                          onChange={(e) => updateLink(ci, li, { href: e.target.value })}
                        >
                          <option value="">â€” Select page â€”</option>
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
                          className="input"
                          placeholder="Href (/about, https://, mailto:, tel:)"
                          value={lnk.href}
                          onChange={(e) => updateLink(ci, li, { href: e.target.value })}
                        />
                      )}

                      {/* Reorder / Remove */}
                      <button
                        className="btn btn-ghost"
                        onClick={() => moveLink(ci, li, li - 1)}
                        disabled={li === 0}
                        title="Move up"
                      >
                        <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => moveLink(ci, li, li + 1)}
                        disabled={li === links.length - 1}
                        title="Move down"
                      >
                        <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() => removeLink(ci, li)}
                        title="Remove"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </button>
                    </div>
                  );
                })}

                {links.length === 0 && (
                  <div className="text-sm text-muted">No links yet. Click “Add link”.</div>
                )}
              </div>
            </div>
          );
        })}

        {columns.length === 0 && (
          <div className="text-sm text-muted">No columns yet. Click “Add column”.</div>
        )}
      </div>
    </div>
  );
}
