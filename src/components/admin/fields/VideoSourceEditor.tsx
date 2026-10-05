'use client';

import type {
  VideoSource,
  VideoSourceUrl,
  VideoSourceLocal,
  VideoSourceS3,
} from '@/types/site';

function isVideoUrl(src: VideoSource): src is VideoSourceUrl {
  return src.type === 'url';
}
function isVideoLocal(src: VideoSource): src is VideoSourceLocal {
  return src.type === 'local';
}
function isVideoS3(src: VideoSource): src is VideoSourceS3 {
  return src.type === 's3';
}

export type VideoSourceEditorProps = {
  value: VideoSource;
  onChange: (next: VideoSource) => void;
  /** Optional hooks to open your MediaPicker */
  onPickS3Key?: (cb: (key: string) => void) => void;
  onPickPoster?: (cb: (keyOrUrl: string) => void) => void;
};

export default function VideoSourceEditor({
  value,
  onChange,
  onPickS3Key,
  onPickPoster,
}: VideoSourceEditorProps) {
  const currentType = value.type;

  const switchType = (t: VideoSource['type']) => {
    if (t === currentType) return;
    switch (t) {
      case 'url':
        onChange({ type: 'url', href: '' });
        break;
      case 'local':
        onChange({ type: 'local', path: '' });
        break;
      case 's3':
        onChange({ type: 's3', key: '' });
        break;
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium">Video Source</label>
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn ${currentType === 'url' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => switchType('url')}
        >
          URL (YouTube/Vimeo/mp4)
        </button>
        <button
          type="button"
          className={`btn ${currentType === 'local' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => switchType('local')}
        >
          Local (/public)
        </button>
        <button
          type="button"
          className={`btn ${currentType === 's3' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => switchType('s3')}
        >
          S3 object
        </button>
      </div>

      {isVideoUrl(value) && (
        <div className="space-y-2">
          <label className="block text-xs opacity-70">URL</label>
          <input
            className="input w-full"
            value={value.href}
            onChange={(e) => onChange({ ...value, href: e.target.value })}
            placeholder="https://youtu.be/... or https://cdn.example.com/video.mp4"
          />
        </div>
      )}

      {isVideoLocal(value) && (
        <div className="space-y-2">
          <label className="block text-xs opacity-70">Local path</label>
          <input
            className="input w-full"
            value={value.path}
            onChange={(e) => onChange({ ...value, path: e.target.value })}
            placeholder="/videos/intro.mp4"
          />
        </div>
      )}

      {isVideoS3(value) && (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-xs opacity-70">S3 key</label>
              <input
                className="input w-full"
                value={value.key}
                onChange={(e) => onChange({ ...value, key: e.target.value })}
                placeholder="configs/{siteId}/videos/intro.mp4"
              />
            </div>
            {onPickS3Key && (
              <button
                type="button"
                className="btn btn-inverted"
                onClick={() => onPickS3Key((key) => onChange({ ...value, key }))}
              >
                Pick…
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs opacity-70">Bucket (optional)</label>
              <input
                className="input w-full"
                value={value.bucket ?? ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    bucket: e.target.value.trim() ? e.target.value : undefined,
                  })
                }
                placeholder="Defaults from env"
              />
            </div>
            <div>
              <label className="block text-xs opacity-70">CDN base (optional)</label>
              <input
                className="input w-full"
                value={value.cdnBase ?? ''}
                onChange={(e) =>
                  onChange({
                    ...value,
                    cdnBase: e.target.value.trim() ? e.target.value : undefined,
                  })
                }
                placeholder="https://dxxxxx.cloudfront.net"
              />
            </div>
          </div>
        </div>
      )}

      {/* optional poster chooser */}
            {onPickPoster && (
        <div>
          <label className="block text-xs opacity-70">Poster (optional)</label>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-ghost"
                    onClick={() => onPickPoster(() => {
                      // parent will receive the picked key/url via the provided callback
                    })}
            >
              Choose Poster…
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

