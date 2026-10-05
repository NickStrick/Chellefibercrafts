'use client';

import type { ProductShopSection } from '@/types/site';
import type { EditorProps } from './types';

export default function EditProductShop({ section, onChange }: EditorProps<ProductShopSection>) {
  const set = <K extends keyof ProductShopSection>(key: K, value: ProductShopSection[K]) =>
    onChange({ ...section, [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Shop Our Products"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="Browse our offerings"
          />
        </div>
      </div>

      <p className="text-xs text-muted">
        Products and filters are managed via the <strong>Products</strong> button in the admin bar.
      </p>
    </div>
  );
}
