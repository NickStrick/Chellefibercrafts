'use client';

import type { SectionalSection } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';
// ⬇️ Adjust this import if your shared types file lives elsewhere
import type { EditorProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';

export function EditSectional({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<SectionalSection>) {
  const set = <K extends keyof SectionalSection>(key: K, value: SectionalSection[K]) =>
    onChange({ ...section, [key]: value });

  const toNum = (v: string): number | undefined => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };

  const motion = section.motion ?? {};

  const setMotion = <K extends keyof NonNullable<SectionalSection['motion']>>(
    key: K,
    value: NonNullable<SectionalSection['motion']>[K]
  ) => {
    const next = { ...(section.motion ?? {}), [key]: value };

    // If everything is undefined/empty, remove motion entirely to keep JSON clean
    const allEmpty =
      (next.direction === undefined || next.direction === null) &&
      (next.offset === undefined || next.offset === null) &&
      (next.duration === undefined || next.duration === null);

    onChange({
      ...section,
      motion: allEmpty ? undefined : next,
    });
  };

  const clearMotion = () => onChange({ ...section, motion: undefined });

  return (
    <div className="space-y-4">
      {/* Title + Align */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title}
            onChange={(e) => set('title', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Align</label>
          <select
            className="select w-full"
            value={section.align ?? 'center'}
            onChange={(e) => set('align', e.target.value as SectionalSection['align'])}
          >
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </div>
      </div>

      {/* Body + Subtitle Align */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">Body</label>
          <div>
            <label className="block text-xs font-medium text-muted mb-0.5 text-right">Subtitle Align</label>
            <select
              className="select"
              value={section.subtitleAlign ?? 'center'}
              onChange={(e) => set('subtitleAlign', e.target.value as SectionalSection['subtitleAlign'])}
            >
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </div>
        </div>
        <textarea
          className="input w-full"
          rows={4}
          value={section.body ?? ''}
          onChange={(e) => set('body', e.target.value)}
        />
      </div>

      {/* Background URL + Picker */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Background URL</label>
        <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {section.backgroundUrl ? (
            <img
              src={resolveAssetUrl(section.backgroundUrl) ?? section.backgroundUrl}
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
            value={section.backgroundUrl ?? ''}
            onChange={(e) => set('backgroundUrl', e.target.value)}
            placeholder={`https://… or configs/${siteId}/assets/hero.jpg`}
          />
          <button
            type="button"
            className="btn btn-inverted"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (picked) set('backgroundUrl', picked);
            }}
          >
            Pick…
          </button>
        </div>
      </div>

      {/* Overlay + Height */}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!section.overlay}
            onChange={(e) => set('overlay', e.target.checked)}
          />
          <span>Overlay (tint background for contrast)</span>
        </label>

        <div>
          <label className="block text-sm font-medium">Height</label>
          <select
            className="select w-full"
            value={section.height ?? 'md'}
            onChange={(e) => set('height', e.target.value as SectionalSection['height'])}
          >
            <option value="xs">xs</option>
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
            <option value="full">full</option>
          </select>
        </div>
      </div>

      {/* Motion */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Motion (parallax/slide)</label>
          <button type="button" className="btn btn-ghost" onClick={clearMotion}>
            <FontAwesomeIcon icon={faRotateLeft} className="text-sm" />
            Reset motion
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm">Direction</label>
            <select
              className="select w-full"
              value={(motion.direction as SectionalSection['motion'] extends infer M
                ? M extends { direction?: infer D }
                  ? D
                  : undefined
                : undefined) ?? ''}
              onChange={(e) =>
                setMotion('direction', (e.target.value || undefined) as 'x' | 'y' | undefined)
              }
            >
              <option value="">(none)</option>
              <option value="x">x</option>
              <option value="y">y</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">Offset (px)</label>
            <input
              className="input w-full"
              inputMode="numeric"
              value={motion.offset ?? ''}
              onChange={(e) => setMotion('offset', toNum(e.target.value))}
              placeholder="e.g., 40"
            />
          </div>

          <div>
            <label className="block text-sm">Duration (s)</label>
            <input
              className="input w-full"
              inputMode="decimal"
              value={motion.duration ?? ''}
              onChange={(e) => setMotion('duration', toNum(e.target.value))}
              placeholder="e.g., 0.6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
