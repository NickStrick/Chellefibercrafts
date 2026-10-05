'use client';

import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { resolveAssetUrl } from '@/lib/assetUrl';
import type { GalleryItem } from '@/types/site';

export default function GalleryImageCard({
  item,
  index,
  isDragging,
  isDragOver,
  onAltChange,
  onUrlChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  item: GalleryItem;
  index: number;
  isDragging: boolean;
  isDragOver: boolean;
  onAltChange: (alt: string) => void;
  onUrlChange: (url: string) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  const previewUrl = resolveAssetUrl(item.imageUrl);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={[
        'relative rounded-xl border p-2 space-y-2 bg-white cursor-grab active:cursor-grabbing transition',
        isDragging ? 'opacity-40' : '',
        isDragOver ? 'outline outline-2 outline-primary' : '',
      ].join(' ')}
      title="Drag to reorder"
    >
      <div className="absolute top-1 left-1 z-10 h-5 w-5 rounded-full bg-black/60 text-white text-[10px] font-medium flex items-center justify-center">
        {index + 1}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 z-10 h-6 w-6 rounded-full bg-white/90 hover:bg-red-50 text-red-600 flex items-center justify-center shadow"
        title="Remove image"
      >
        <FontAwesomeIcon icon={faTrash} className="text-xs" />
      </button>

      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={item.alt ?? ''}
            fill
            className="object-cover pointer-events-none"
            sizes="150px"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-center text-[11px] text-muted px-2">
            No image yet — paste a URL below
          </div>
        )}
        <FontAwesomeIcon
          icon={faGripVertical}
          className="absolute bottom-1 right-1 text-xs text-white drop-shadow"
        />
      </div>

      {!item.imageUrl && (
        <input
          className="input w-full text-xs"
          placeholder="Image URL"
          value={item.imageUrl}
          onChange={(e) => onUrlChange(e.target.value)}
        />
      )}
      <input
        className="input w-full text-xs"
        placeholder="Alt text"
        value={item.alt ?? ''}
        onChange={(e) => onAltChange(e.target.value)}
      />
    </div>
  );
}
