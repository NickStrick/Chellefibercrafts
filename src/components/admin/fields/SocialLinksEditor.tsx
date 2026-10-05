'use client';

import { useCallback } from 'react';
import type { SocialItem } from '@/types/site';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const ALL_TYPES: SocialItem['type'][] = [
  'instagram',
  'facebook',
  'linkedin',
  'x',
  'youtube',
  'tiktok',
  'email',
  'website',
];

// optional light normalization for email type
const normalizeHref = (t: SocialItem['type'], href: string) => {
  if (t === 'email') {
    // if plain email, prepend mailto:
    if (href && !href.startsWith('mailto:') && !href.includes('://')) {
      return `mailto:${href}`;
    }
  }
  return href;
};

// Shared list editor for social links — used by the Socials section editor
// and Settings → General → Site Availability.
export default function SocialLinksEditor({
  items,
  onChange,
}: {
  items: SocialItem[];
  onChange: (items: SocialItem[]) => void;
}) {
  const addItem = useCallback(() => {
    onChange([...items, { type: 'instagram', href: '', label: '' }]);
  }, [onChange, items]);

  const removeItem = useCallback(
    (idx: number) => {
      onChange(items.filter((_, i) => i !== idx));
    },
    [onChange, items]
  );

  const moveItem = useCallback(
    (from: number, to: number) => {
      if (to < 0 || to >= items.length) return;
      const arr = [...items];
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      onChange(arr);
    },
    [onChange, items]
  );

  const updateItem = useCallback(
    (idx: number, patch: Partial<SocialItem>) => {
      onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    },
    [onChange, items]
  );

  return (
    <div className="space-y-3">
      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Links ({items.length})</div>
        <button className="btn btn-ghost" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add link
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, i) => {
          const hrefPlaceholder =
            it.type === 'email'
              ? 'name@example.com or mailto:name@example.com'
              : it.type === 'website'
              ? 'https://example.com'
              : `https://...`;

        return (
          <div key={`social-${i}`} className="card admin-card card-solid p-3 space-y-3">
            <div className="grid md:grid-cols-[1fr_2fr_1fr_auto_auto_auto] gap-2">
              <select
                className="select"
                value={it.type}
                onChange={(e) => updateItem(i, { type: e.target.value as SocialItem['type'] })}
                title="Platform"
              >
                {ALL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <input
                className="input"
                placeholder={hrefPlaceholder}
                value={it.href}
                onChange={(e) => updateItem(i, { href: normalizeHref(it.type, e.target.value) })}
              />

              <input
                className="input"
                placeholder="Optional label"
                value={it.label ?? ''}
                onChange={(e) => updateItem(i, { label: e.target.value })}
              />

              <button
                className="btn btn-ghost"
                onClick={() => moveItem(i, i - 1)}
                disabled={i === 0}
                title="Move up"
              >
                 <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => moveItem(i, i + 1)}
                disabled={i === items.length - 1}
                title="Move down"
              >
                <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => removeItem(i)}
                title="Remove"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
          </div>
        );})}

        {items.length === 0 && (
          <div className="text-sm text-muted">No links yet. Click “Add link”.</div>
        )}
      </div>
    </div>
  );
}
