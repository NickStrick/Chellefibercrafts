import type { VideoSection, VideoSource } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import VideoSourceEditor from './VideoSourceEditor';

export function EditVideo({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<VideoSection>) {
  const set = <K extends keyof VideoSection>(key: K, value: VideoSection[K]) =>
    onChange({ ...section, [key]: value });

  const setStyle = <K extends NonNullable<VideoSection['style']> extends infer S
      ? S extends object
        ? keyof S
        : never
      : never>(
    key: K,
    value: NonNullable<VideoSection['style']>[K]
  ) => {
    const current = section.style ?? {};
    onChange({ ...section, style: { ...current, [key]: value } });
  };

  const setSource = (next: VideoSource) => set('source', next);

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

      {/* Source (URL / Local / S3) */}
      <VideoSourceEditor
        value={section.source}
        onChange={setSource}
        onPickS3Key={async (apply: (key: string) => void) => {
          const picked = await openMediaPicker(`configs/${siteId}/videos/`);
          if (picked) apply(picked);
        }}
        onPickPoster={async (apply: (key: string) => void) => {
          const picked = await openMediaPicker(`configs/${siteId}/assets/`);
          if (picked) {
            set('posterUrl', picked);
            apply(picked);
          }
        }}
      />

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!section.controls}
            onChange={(e) => set('controls', e.target.checked)}
          />
          <span>Controls</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!section.autoplay}
            onChange={(e) => set('autoplay', e.target.checked)}
          />
          <span>Autoplay</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!section.muted}
            onChange={(e) => set('muted', e.target.checked)}
          />
          <span>Muted</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!section.loop}
            onChange={(e) => set('loop', e.target.checked)}
          />
          <span>Loop</span>
        </label>
      </div>

      {/* Poster */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Poster URL (optional)</label>
        <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
          {section.posterUrl ? (
            <img
              src={resolveAssetUrl(section.posterUrl) ?? section.posterUrl}
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
            className="input w-full"
            value={section.posterUrl ?? ''}
            onChange={(e) => set('posterUrl', e.target.value)}
            placeholder="configs/{siteId}/assets/poster.jpg or full URL"
          />
          <button
            type="button"
            className="btn btn-inverted"
            onClick={async () => {
              const picked = await openMediaPicker(`configs/${siteId}/assets/`);
              if (picked) set('posterUrl', picked);
            }}
          >
            Pick…
          </button>
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Style</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <span className="text-xs block mb-1">Aspect</span>
            <select
              className="select w-full"
              value={section.style?.aspect ?? '16/9'}
              onChange={(e) =>
                setStyle('aspect', e.target.value as NonNullable<VideoSection['style']>['aspect'])
              }
            >
              <option value="16/9">16/9</option>
              <option value="9/16">9/16</option>
              <option value="4/3">4/3</option>
              <option value="1/1">1/1</option>
            </select>
          </div>
          <div>
            <span className="text-xs block mb-1">Rounded</span>
            <select
              className="select w-full"
              value={section.style?.rounded ?? 'xl'}
              onChange={(e) =>
                setStyle('rounded', e.target.value as NonNullable<VideoSection['style']>['rounded'])
              }
            >
              <option value="lg">lg</option>
              <option value="xl">xl</option>
              <option value="2xl">2xl</option>
            </select>
          </div>
          <div>
            <span className="text-xs block mb-1">Shadow</span>
            <select
              className="select w-full"
              value={section.style?.shadow ?? 'md'}
              onChange={(e) =>
                setStyle('shadow', e.target.value as NonNullable<VideoSection['style']>['shadow'])
              }
            >
              <option value="none">none</option>
              <option value="sm">sm</option>
              <option value="md">md</option>
              <option value="lg">lg</option>
            </select>
          </div>
          <div>
            <span className="text-xs block mb-1">Background</span>
            <select
              className="select w-full"
              value={section.style?.background ?? 'default'}
              onChange={(e) =>
                setStyle(
                  'background',
                  e.target.value as NonNullable<VideoSection['style']>['background']
                )
              }
            >
              <option value="default">default</option>
              <option value="band">band</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
