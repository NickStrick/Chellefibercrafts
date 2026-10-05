'use client';

import type { HeroSection } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';

// Reuse this lightweight prop shape so each editor can live in its own file
export type EditorProps<T> = {
  section: T;
  onChange: (next: T) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
};

export function EditHero({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<HeroSection>) {
  const setPrimary = (patch: Partial<NonNullable<HeroSection['primaryCta']>>) => {
    const current = section.primaryCta ?? { label: '', href: '' };
    onChange({ ...section, primaryCta: { ...current, ...patch } });
  };

  const setSecondary = (patch: Partial<NonNullable<HeroSection['secondaryCta']>>) => {
    const current = section.secondaryCta ?? { label: '', href: '' };
    onChange({ ...section, secondaryCta: { ...current, ...patch } });
  };

  return (
    <div className="space-y-6">
      {/* Eyebrow / Title / Subtitle */}
      <div>
        <label className="block text-sm font-medium">Eyebrow</label>
        <input
          className="input w-full"
          value={section.eyebrow ?? ''}
          onChange={(e) => onChange({ ...section, eyebrow: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title}
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

      {/* Image */}
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
            onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
            placeholder="https://… or configs/{siteId}/assets/hero.jpg"
          />
          <button
            type="button"
            className="btn btn-inverted"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (picked) onChange({ ...section, imageUrl: picked });
            }}
          >
            Pick…
          </button>
        </div>
        {section.imageUrl && (
          <div className="text-xs text-muted break-all mt-1">{section.imageUrl}</div>
        )}
      </div>

      {/* CTAs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Primary CTA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Primary CTA</label>
            {section.primaryCta && (
              <button
                type="button"
                className="btn btn-ghost text-red-600"
                onClick={() => onChange({ ...section, primaryCta: undefined })}
              >
                Clear
              </button>
            )}
          </div>
          <input
            className="input w-full"
            placeholder="Label (e.g., Call for services)"
            value={section.primaryCta?.label ?? ''}
            onChange={(e) => setPrimary({ label: e.target.value })}
          />
          <input
            className="input w-full"
            placeholder="Href (e.g., tel:1773..., /contact, https://…)"
            value={section.primaryCta?.href ?? ''}
            onChange={(e) => setPrimary({ href: e.target.value })}
          />
        </div>

        {/* Secondary CTA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Secondary CTA</label>
            {section.secondaryCta && (
              <button
                type="button"
                className="btn btn-ghost text-red-600"
                onClick={() => onChange({ ...section, secondaryCta: undefined })}
              >
                Clear
              </button>
            )}
          </div>
          <input
            className="input w-full"
            placeholder="Label (e.g., DM on Insta)"
            value={section.secondaryCta?.label ?? ''}
            onChange={(e) => setSecondary({ label: e.target.value })}
          />
          <input
            className="input w-full"
            placeholder="Href (e.g., #socials, https://instagram.com/...)"
            value={section.secondaryCta?.href ?? ''}
            onChange={(e) => setSecondary({ href: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export default EditHero;
