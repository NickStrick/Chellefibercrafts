'use client';

import { useMemo } from 'react';
import type { PageLinksSection, PageLinksStyle } from '@/types/site';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useSite } from '@/context/SiteContext';
import type { EditorProps } from './types';

type LinkItem = { label: string; href: string; variant?: 'primary' | 'inverted' };

// tiny immutable helper (avoid local shadow state — resyncing local state from
// props on every keystroke via useEffect regenerates keys and steals input focus)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function ensureStyle(style?: PageLinksStyle): PageLinksStyle {
  return {
    align: style?.align ?? 'center',
  };
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

export function EditPageLinks({ section, onChange }: EditorProps<PageLinksSection>) {
  const { config } = useSite();
  // Dedupe by id: a config can end up with duplicate section ids (bad data),
  // which would otherwise crash this dropdown on a React "duplicate key" error.
  const allSections = useMemo(() => {
    const seen = new Set<string>();
    return (config?.sections ?? []).filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [config?.sections]);
  const allPages = useMemo(() => config?.pages ?? [], [config?.pages]);

  const items = section.items ?? [];
  const style = ensureStyle(section.style);

  const setItems = (next: LinkItem[]) => onChange({ ...section, items: next });

  const updateItem = (idx: number, patch: Partial<LinkItem>) => {
    const next = deepClone(items);
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addItem = () => {
    setItems([...items, { label: 'New Link', href: '', variant: 'primary' as const }]);
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

  const setStyle = (patch: Partial<PageLinksStyle>) => {
    onChange({ ...section, style: { ...style, ...patch } });
  };

  return (
    <div className="space-y-6">
      {/* Title / Subtitle */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Subtitle</label>
        <textarea
          className="textarea w-full"
          value={section.subtitle ?? ''}
          onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
        />
      </div>

      {/* Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Links</label>
          <button className="btn btn-inverted" type="button" onClick={addItem}>
            <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Link
          </button>
        </div>

        {items.length === 0 && (
          <div className="text-sm text-muted">No links yet.</div>
        )}

        <div className="space-y-2">
          {items.map((lnk, i) => {
            const { kind, sectionId } = hrefKind(lnk.href);

            return (
              <div key={i} className="card admin-card card-solid p-3 flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* Label */}
                  <input
                    className="input w-full"
                    value={lnk.label}
                    onChange={(e) => updateItem(i, { label: e.target.value })}
                    placeholder="Label (e.g., Shop Now)"
                  />

                  {/* Mode selector + target */}
                  <div className="flex gap-2">
                    {/* Mode */}
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

                    {/* Target */}
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
                        value={lnk.href}
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
                        value={lnk.href}
                        onChange={(e) => updateItem(i, { href: e.target.value })}
                        placeholder="https://…, /contact, mailto:…, tel:…"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted">Style</label>
                  <select
                    className="select w-36"
                    value={lnk.variant ?? 'primary'}
                    onChange={(e) =>
                      updateItem(i, { variant: e.target.value as 'primary' | 'inverted' })
                    }
                  >
                    <option value="primary">Primary</option>
                    <option value="inverted">Inverted</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-ghost ml-auto"
                    onClick={() => moveItem(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                  >
                    <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => moveItem(i, +1)}
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
                    <FontAwesomeIcon icon={faTrash} className="text-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Alignment</label>
        <select
          className="select w-48"
          value={style.align ?? 'center'}
          onChange={(e) => setStyle({ align: e.target.value as PageLinksStyle['align'] })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  );
}

export default EditPageLinks;
