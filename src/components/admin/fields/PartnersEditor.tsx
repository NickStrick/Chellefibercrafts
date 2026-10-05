'use client';

import { useCallback } from 'react';
import type { PartnersSection, PartnersStyle, PartnerItem, PartnerLink } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
// small immutable helper (keeps parity with your other editors)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

const LINK_TYPES: PartnerLink['type'][] = [
  'website',
  'instagram',
  'facebook',
  'linkedin',
  'youtube',
  'tiktok',
  'linktree',
];

export default function EditPartners({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<PartnersSection>) {
  const style = section.style ?? {};
  const items = section.items ?? [];

  // ----- section + style setters -----
  const setField = useCallback(
    <K extends keyof PartnersSection>(key: K, value: PartnersSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const setStyle = useCallback(
    <K extends keyof PartnersStyle>(key: K, value: PartnersStyle[K]) => {
      onChange({ ...section, style: { ...(section.style ?? {}), [key]: value } });
    },
    [onChange, section]
  );

  // ----- partners list ops -----
  const addPartner = useCallback(() => {
    const next = deepClone(section);
    const newItem: PartnerItem = { name: 'New Partner', description: '', logoUrl: '', links: [] };
    next.items = [...(next.items ?? []), newItem];
    onChange(next);
  }, [onChange, section]);

  const removePartner = useCallback(
    (idx: number) => {
      const next = deepClone(section);
      next.items = (next.items ?? []).filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, section]
  );

  const movePartner = useCallback(
    (from: number, to: number) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const updatePartner = useCallback(
    (idx: number, patch: Partial<PartnerItem>) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      arr[idx] = { ...(arr[idx] as PartnerItem), ...patch };
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  // ----- per-partner link ops -----
  const addLink = useCallback(
    (pIdx: number) => {
      const next = deepClone(section);
      const partner = (next.items ?? [])[pIdx];
      const links = partner.links ?? [];
      links.push({ type: 'website', href: '' });
      partner.links = links;
      onChange(next);
    },
    [onChange, section]
  );

  const removeLink = useCallback(
    (pIdx: number, lIdx: number) => {
      const next = deepClone(section);
      const partner = (next.items ?? [])[pIdx];
      partner.links = (partner.links ?? []).filter((_, i) => i !== lIdx);
      onChange(next);
    },
    [onChange, section]
  );

  const moveLink = useCallback(
    (pIdx: number, from: number, to: number) => {
      const next = deepClone(section);
      const partner = (next.items ?? [])[pIdx];
      const links = partner.links ?? [];
      if (to < 0 || to >= links.length) return;
      const [sp] = links.splice(from, 1);
      links.splice(to, 0, sp);
      partner.links = links;
      onChange(next);
    },
    [onChange, section]
  );

  const updateLink = useCallback(
    (pIdx: number, lIdx: number, patch: Partial<PartnerLink>) => {
      const next = deepClone(section);
      const partner = (next.items ?? [])[pIdx];
      const links = partner.links ?? [];
      links[lIdx] = { ...(links[lIdx] as PartnerLink), ...patch };
      partner.links = links;
      onChange(next);
    },
    [onChange, section]
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="Our Partners"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="Organizations we collaborate with"
          />
        </div>
      </div>

      {/* Style */}
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium">Variant</label>
          <select
            className="select w-full"
            value={style.variant ?? 'cards'}
            onChange={(e) => setStyle('variant', e.target.value as NonNullable<PartnersStyle['variant']>)}
          >
            <option value="cards">cards</option>
            <option value="grid">grid</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={style.columns ?? 3}
            onChange={(e) => setStyle('columns', Number(e.target.value) as NonNullable<PartnersStyle['columns']>)}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Rounded</label>
          <select
            className="select w-full"
            value={style.rounded ?? 'xl'}
            onChange={(e) => setStyle('rounded', e.target.value as NonNullable<PartnersStyle['rounded']>)}
          >
            <option value="lg">lg</option>
            <option value="xl">xl</option>
            <option value="2xl">2xl</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Background</label>
          <select
            className="select w-full"
            value={style.background ?? 'default'}
            onChange={(e) => setStyle('background', e.target.value as NonNullable<PartnersStyle['background']>)}
          >
            <option value="default">default</option>
            <option value="band">band</option>
          </select>
        </div>
      </div>

      {/* Header for list */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Partners ({items.length})</div>
        <button className="btn btn-ghost" onClick={addPartner}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Partner
        </button>
      </div>

      {/* Partners list */}
      <div className="space-y-4">
        {items.map((p, idx) => (
          <div key={`partner-${idx}`} className="card admin-card card-solid p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.name || 'New Partner'}</div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => movePartner(idx, idx - 1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                   <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => movePartner(idx, idx + 1)}
                  disabled={idx === items.length - 1}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </button>
                <button className="btn btn-ghost" onClick={() => removePartner(idx)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="input w-full"
                  value={p.name}
                  onChange={(e) => updatePartner(idx, { name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Logo URL</label>
                <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {p.logoUrl ? (
                    <img
                      src={resolveAssetUrl(p.logoUrl) ?? p.logoUrl}
                      alt="Image preview"
                      className="admin-image-preview"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={p.logoUrl ?? ''}
                    onChange={(e) => updatePartner(idx, { logoUrl: e.target.value })}
                    placeholder="https://… or configs/{siteId}/assets/logo.png"
                  />
                  <button
                    type="button"
                    className="btn btn-inverted"
                    onClick={async () => {
                      const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                      if (picked) updatePartner(idx, { logoUrl: picked });
                    }}
                  >
                    Pick…
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                className="textarea w-full"
                value={p.description ?? ''}
                onChange={(e) => updatePartner(idx, { description: e.target.value })}
              />
            </div>

            {/* Links */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Links ({p.links?.length ?? 0})</div>
              <button className="btn btn-ghost" onClick={() => addLink(idx)}>
                <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Link
              </button>
            </div>

            {(p.links ?? []).length > 0 ? (
              <div className="space-y-2">
                {(p.links ?? []).map((lnk, lIdx) => (
                  <div key={`partner-${idx}-link-${lIdx}`} className="grid md:grid-cols-[1fr_3fr_auto_auto_auto] gap-2 items-end">
                    <div>
                      <label className="block text-sm font-medium">Type</label>
                      <select
                        className="select w-full"
                        value={lnk.type}
                        onChange={(e) =>
                          updateLink(idx, lIdx, { type: e.target.value as PartnerLink['type'] })
                        }
                      >
                        {LINK_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium">Href</label>
                      <input
                        className="input w-full"
                        value={lnk.href}
                        onChange={(e) => updateLink(idx, lIdx, { href: e.target.value })}
                        placeholder="https://…"
                      />
                    </div>
                    <button
                      className="btn btn-ghost"
                      onClick={() => moveLink(idx, lIdx, lIdx - 1)}
                      disabled={lIdx === 0}
                      title="Move up"
                    >
                       <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => moveLink(idx, lIdx, lIdx + 1)}
                      disabled={lIdx === (p.links?.length ?? 1) - 1}
                      title="Move down"
                    >
                      <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => removeLink(idx, lIdx)}
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted">No links yet.</div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-muted">No partners yet. Click “Add Partner”.</div>
        )}
      </div>
    </div>
  );
}
