'use client';

import { useMemo } from 'react';
import type { HeaderSection, HeaderStyle } from '@/types/site';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus} from '@fortawesome/free-solid-svg-icons';
import { useSite } from '@/context/SiteContext';

export type EditorProps<T> = {
  section: T;
  onChange: (next: T) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>; // not used here
  siteId: string; // not used here
};

type NavLink = { label: string; href: string };
type NavItem = NavLink & { children?: NavLink[] };

// tiny immutable helper (avoid local shadow state — resyncing local state from
// props on every keystroke via useEffect regenerates keys and steals input focus)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function ensureStyle(style?: HeaderStyle): HeaderStyle {
  return {
    sticky: style?.sticky ?? true,
    blur: style?.blur ?? true,
    elevation: style?.elevation ?? 'sm',
    transparent: style?.transparent ?? false,
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

// Mode selector (internal section / sub-page / external) + the matching target
// picker. Shared between top-level links and dropdown-group children.
function LinkTargetFields({
  href,
  allSections,
  allPages,
  onChangeHref,
}: {
  href: string;
  allSections: { id: string; type: string }[];
  allPages: { slug: string; title: string }[];
  onChangeHref: (href: string) => void;
}) {
  const { kind, sectionId } = hrefKind(href);

  return (
    <div className="flex gap-2">
      {/* Mode */}
      <select
        className="select w-36"
        value={kind}
        onChange={(e) => {
          const nextKind = e.target.value as 'internal' | 'external' | 'sub-page';
          if (nextKind === 'internal') {
            const first = allSections[0]?.id ?? '';
            onChangeHref(first ? `/#${first}` : '');
          } else if (nextKind === 'sub-page') {
            const first = allPages[0]?.slug ?? '';
            onChangeHref(first ? `/${first.replace(/^\/+/, '')}` : '');
          } else {
            onChangeHref('');
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
            onChangeHref(id === '/' ? '/' : id ? `/#${id}` : '');
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
          value={href}
          onChange={(e) => onChangeHref(e.target.value)}
        >
          <option value="">— Select page —</option>
          {allPages.map((page) => {
            const pageHref = `/${page.slug.replace(/^\/+/, '')}`;
            return (
              <option key={page.slug} value={pageHref}>
                {page.title || page.slug}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          className="input flex-1"
          value={href}
          onChange={(e) => onChangeHref(e.target.value)}
          placeholder="https://…, /contact, mailto:…, tel:…"
        />
      )}
    </div>
  );
}

export function EditHeader({
  section,
  onChange,
}: EditorProps<HeaderSection>) {
  const { config } = useSite(); // 👈 get sections without changing props
  // Dedupe by id: a config can end up with duplicate section ids (bad data),
  // which would otherwise crash this dropdown on a React "duplicate key" error.
  const allSections = useMemo(() => {
    const seen = new Set<string>();
    return (config?.sections ?? []).filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
  }, [config?.sections]);
  const allPages = useMemo(() => config?.pages ?? [], [config?.pages]);

  const links = section.links ?? [];
  const style = ensureStyle(section.style);

  const setLinks = (next: NavItem[]) => onChange({ ...section, links: next });

  // ---- logo text ----
  const setLogoText = (logoText?: string) =>
    onChange({ ...section, logoText });

  // ---- links CRUD ----
  const updateLink = (idx: number, patch: Partial<NavLink>) => {
    const next = deepClone(links);
    next[idx] = { ...next[idx], ...patch };
    setLinks(next);
  };

  const addLink = () => {
    setLinks([...links, { label: 'New', href: '' }]);
  };

  const removeLink = (idx: number) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  const moveLink = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= links.length) return;
    const next = deepClone(links);
    const [row] = next.splice(idx, 1);
    next.splice(to, 0, row);
    setLinks(next);
  };

  // ---- dropdown-group CRUD (a top-level item with `children` renders as a
  // "Label ▾" group in the nav instead of a direct link) ----
  const makeGroup = (idx: number) => {
    const next = deepClone(links);
    next[idx] = { ...next[idx], children: next[idx].children ?? [{ label: 'New', href: '' }] };
    setLinks(next);
  };

  const removeGroup = (idx: number) => {
    const next = deepClone(links);
    delete next[idx].children;
    setLinks(next);
  };

  const updateChild = (idx: number, childIdx: number, patch: Partial<NavLink>) => {
    const next = deepClone(links);
    const children = next[idx].children ?? [];
    children[childIdx] = { ...children[childIdx], ...patch };
    next[idx] = { ...next[idx], children };
    setLinks(next);
  };

  const addChild = (idx: number) => {
    const next = deepClone(links);
    next[idx] = { ...next[idx], children: [...(next[idx].children ?? []), { label: 'New', href: '' }] };
    setLinks(next);
  };

  const removeChild = (idx: number, childIdx: number) => {
    const next = deepClone(links);
    next[idx] = { ...next[idx], children: (next[idx].children ?? []).filter((_, i) => i !== childIdx) };
    setLinks(next);
  };

  const moveChild = (idx: number, childIdx: number, dir: -1 | 1) => {
    const next = deepClone(links);
    const children = next[idx].children ?? [];
    const to = childIdx + dir;
    if (to < 0 || to >= children.length) return;
    const [row] = children.splice(childIdx, 1);
    children.splice(to, 0, row);
    next[idx] = { ...next[idx], children };
    setLinks(next);
  };

  // ---- CTA (optional) ----
  const cta = section.cta;
  const setCta = (patch: Partial<NonNullable<HeaderSection['cta']>>) => {
    const current = cta ?? { label: '', href: '' };
    const merged = { ...current, ...patch };
    const isEmpty = !merged.label && !merged.href;
    onChange({ ...section, cta: isEmpty ? undefined : merged });
  };

  const clearCta = () => onChange({ ...section, cta: undefined });

  // ---- Style ----
  const setStyle = (patch: Partial<HeaderStyle>) => {
    onChange({ ...section, style: { ...style, ...patch } });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div>
        <label className="block text-sm font-medium">Logo Text</label>
        <input
          className="input w-full"
          value={section.logoText ?? ''}
          onChange={(e) => setLogoText(e.target.value)}
          placeholder="e.g., CM Florals"
        />
      </div>

      {/* Links */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Navigation Links</label>
          <button className="btn btn-inverted" type="button" onClick={addLink}>
            <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Link
          </button>
        </div>
        <p className="text-xs text-muted">
          Got a lot of links? Group related ones into a dropdown (e.g. "Services") with "+ Make dropdown" below, instead of adding many separate top-level links — it keeps the header from getting crowded.
        </p>

        {links.length === 0 && (
          <div className="text-sm text-muted">No nav links yet.</div>
        )}

        <div className="space-y-2">
          {links.map((lnk, i) => {
            const isGroup = !!lnk.children;

            return (
              <div key={'linkid-' + i} className="card admin-card card-solid p-3 flex flex-col gap-2">
                {isGroup ? (
                  <input
                    className="input w-full"
                    value={lnk.label}
                    onChange={(e) => updateLink(i, { label: e.target.value })}
                    placeholder="Group label (e.g., Services)"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="input w-full"
                      value={lnk.label}
                      onChange={(e) => updateLink(i, { label: e.target.value })}
                      placeholder="Label (e.g., Home)"
                    />
                    <LinkTargetFields
                      href={lnk.href}
                      allSections={allSections}
                      allPages={allPages}
                      onChangeHref={(href) => updateLink(i, { href })}
                    />
                  </div>
                )}

                {isGroup && (
                  <div className="ml-4 pl-3 border-l-2 border-[color-mix(in_srgb,var(--fg)_15%,transparent)] space-y-2">
                    {(lnk.children ?? []).map((child, ci) => (
                      <div key={'childid-' + i + '-' + ci} className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="input w-full"
                            value={child.label}
                            onChange={(e) => updateChild(i, ci, { label: e.target.value })}
                            placeholder="Label (e.g., Weddings)"
                          />
                          <LinkTargetFields
                            href={child.href}
                            allSections={allSections}
                            allPages={allPages}
                            onChangeHref={(href) => updateChild(i, ci, { href })}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => moveChild(i, ci, -1)}
                            disabled={ci === 0}
                            title="Move up"
                          >
                            <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => moveChild(i, ci, +1)}
                            disabled={ci === (lnk.children?.length ?? 0) - 1}
                            title="Move down"
                          >
                            <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost text-red-600 ml-auto"
                            onClick={() => removeChild(i, ci)}
                            title="Remove sub-link"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-ghost" type="button" onClick={() => addChild(i)}>
                      <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Sub-link
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => moveLink(i, -1)}
                    disabled={i === 0}
                    title="Move up"
                  >
                    <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => moveLink(i, +1)}
                    disabled={i === links.length - 1}
                    title="Move down"
                  >
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                  </button>
                  {isGroup ? (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeGroup(i)}
                      title="Convert back to a single link"
                    >
                      Remove dropdown
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => makeGroup(i)}
                      title="Turn this into a dropdown group"
                    >
                      + Make dropdown
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-ghost text-red-600 ml-auto"
                    onClick={() => removeLink(i)}
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

      {/* CTA */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">CTA (optional)</label>
          {cta && (
            <button type="button" className="btn btn-ghost text-red-600" onClick={clearCta}>
              <FontAwesomeIcon icon={faTrash} className="text-sm" />
              Remove CTA
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input w-full"
            placeholder="CTA label (e.g., Call Now)"
            value={cta?.label ?? ''}
            onChange={(e) => setCta({ label: e.target.value })}
          />
          <input
            className="input w-full"
            placeholder="CTA href (tel:, mailto:, /path, https://…)"
            value={cta?.href ?? ''}
            onChange={(e) => setCta({ href: e.target.value })}
          />
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Header Style</label>

        <div className="grid md:grid-cols-4 gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!style.sticky}
              onChange={(e) => setStyle({ sticky: e.target.checked })}
            />
            <span>Sticky</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!style.blur}
              onChange={(e) => setStyle({ blur: e.target.checked })}
            />
            <span>Blur</span>
          </label>

          <div>
            <label className="block text-xs font-medium mb-1">Elevation</label>
            <select
              className="select w-full"
              value={style.elevation ?? 'sm'}
              onChange={(e) => setStyle({ elevation: e.target.value as HeaderStyle['elevation'] })}
            >
              <option value="none">none</option>
              <option value="sm">sm</option>
              <option value="md">md</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!style.transparent}
              onChange={(e) => setStyle({ transparent: e.target.checked })}
            />
            <span>Transparent</span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default EditHeader;
