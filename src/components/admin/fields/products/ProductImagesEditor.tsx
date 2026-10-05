'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

type LocalImage = { _id: string; url: string; alt?: string };
type LocalProduct = {
  _id: string;
  images: LocalImage[];
  thumbnailUrl?: string;
};

export default function ProductImagesEditor({
  product,
  onUpdate,
  openMediaPicker,
  siteId,
}: {
  product: LocalProduct;
  onUpdate: (patch: Partial<LocalProduct>) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
}) {
  const addImage = async () => {
    const key = await openMediaPicker(`configs/${siteId}/assets/`);
    if (!key) return;
    const next = [...(product.images ?? []), { _id: crypto.randomUUID(), url: key, alt: '' }];
    onUpdate({ images: next, thumbnailUrl: product.thumbnailUrl || key });
  };
  const updateImage = (idx: number, patch: Partial<LocalImage>) => {
    const next = product.images.slice();
    next[idx] = { ...next[idx], ...patch };
    onUpdate({ images: next });
  };
  const removeImage = (idx: number) => {
    const next = product.images.slice().filter((_, i) => i !== idx);
    onUpdate({ images: next });
  };
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= product.images.length) return;
    const next = product.images.slice();
    const [sp] = next.splice(from, 1);
    next.splice(to, 0, sp);
    onUpdate({ images: next });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Images</label>
        <button className="btn btn-ghost" onClick={addImage}>Add image</button>
      </div>
      <div className="space-y-2">
        {product.images.map((im, ii) => (
          <div key={im._id} className="grid md:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center">
            <input
              className="input"
              placeholder="Image URL"
              value={im.url}
              onChange={(e) => updateImage(ii, { url: e.target.value })}
            />
            <input
              className="input"
              placeholder="Alt text"
              value={im.alt ?? ''}
              onChange={(e) => updateImage(ii, { alt: e.target.value })}
            />
            <button
              className="btn btn-ghost"
              onClick={() => moveImage(ii, ii - 1)}
              disabled={ii === 0}
              title="Move up"
            >
              <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => moveImage(ii, ii + 1)}
              disabled={ii === product.images.length - 1}
              title="Move down"
            >
              <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
            </button>
            <button className="btn btn-ghost" onClick={() => removeImage(ii)} title="Remove">
              Remove
            </button>
          </div>
        ))}
        {product.images.length === 0 && (
          <div className="text-sm text-muted">No images yet. Click “Add image”.</div>
        )}
      </div>
    </div>
  );
}
