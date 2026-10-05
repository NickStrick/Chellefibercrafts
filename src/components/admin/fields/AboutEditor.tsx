'use client';

import type { AboutSection } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

export function EditAbout({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<AboutSection>) {
  const set = <K extends keyof AboutSection>(key: K, value: AboutSection[K]) =>
    onChange({ ...section, [key]: value });

  const bullets = section.bullets ?? [];

  const updateBullet = (i: number, value: string) => {
    const next = [...bullets];
    next[i] = value;
    onChange({ ...section, bullets: next });
  };

  const addBullet = () => onChange({ ...section, bullets: [...bullets, ''] });

  const removeBullet = (i: number) =>
    onChange({ ...section, bullets: bullets.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium">Subtitle</label>
        <input
          className="input w-full"
          value={section.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value)}
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          className="textarea w-full"
          value={section.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder="Tell your story here…"
        />
      </div>

      {/* Image URL + Picker */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Image URL</label>
        <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {section.imageUrl ? (
            <img
              src={resolveAssetUrl(section.imageUrl) ?? section.imageUrl}
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
            value={section.imageUrl ?? ''}
            onChange={(e) => set('imageUrl', e.target.value)}
            placeholder={`https://… or configs/${siteId}/assets/about.jpg`}
          />
          <button
            type="button"
            className="btn btn-inverted"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (picked) set('imageUrl', picked);
            }}
          >
            Pick…
          </button>
        </div>
      </div>

      {/* Align */}
      <div>
        <label className="block text-sm font-medium">Align</label>
        <select
          className="select w-full"
          value={section.align ?? 'left'}
          onChange={(e) => set('align', e.target.value as AboutSection['align'])}
        >
          <option value="left">left</option>
          <option value="center">center</option>
          <option value="right">right</option>
        </select>
      </div>

      {/* Bullets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Bullets (quick facts)</label>
          <button type="button" className="btn btn-inverted" onClick={addBullet}>
            <FontAwesomeIcon icon={faPlus} className="text-xs" />Add bullet
          </button>
        </div>

        {bullets.length === 0 && (
          <div className="text-sm text-muted">No bullets yet.</div>
        )}

        <div className="grid gap-2">
          {bullets.map((b, i) => (
            <div key={`bullet-${i}`} className="flex gap-2 items-center">
              <input
                className="input flex-1"
                value={b}
                onChange={(e) => updateBullet(i, e.target.value)}
                placeholder="e.g., 45+ years of floral experience"
              />
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => removeBullet(i)}
                aria-label="Remove bullet"
              >
                <FontAwesomeIcon icon={faTrash} className="text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Optional: background class (inherited from SectionBase) */}
      <div>
        <label className="block text-sm font-medium">Background Class (optional)</label>
        <input
          className="input w-full"
          value={section.backgroundClass ?? ''}
          onChange={(e) => set('backgroundClass', e.target.value)}
          placeholder="e.g., bg-gradient-1"
        />
      </div>
    </div>
  );
}
