'use client';

import { useCallback } from 'react';
import type { ClassListSection } from '@/types/site';
import type { EditorProps } from './types';
import { useSite } from '@/context/SiteContext';

export default function EditClassList({ section, onChange }: EditorProps<ClassListSection>) {
  const { config } = useSite();
  const items = config?.classes?.classItems ?? [];
  const qualifying = items.filter((c) => (c.times ?? []).length > 0);

  const set = useCallback(
    <K extends keyof ClassListSection>(key: K, value: ClassListSection[K]) =>
      onChange({ ...section, [key]: value }),
    [onChange, section]
  );

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Our Classes"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Subtitle</label>
        <input
          className="input w-full"
          value={section.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Button label</label>
        <input
          className="input w-full"
          value={section.buyCtaFallback ?? 'Book Now'}
          onChange={(e) => set('buyCtaFallback', e.target.value)}
          placeholder="Book Now"
        />
      </div>

      <div className="card admin-card card-solid p-3">
        <div className="text-sm font-medium mb-1">
          {qualifying.length} of {items.length} class{items.length === 1 ? '' : 'es'} will show
        </div>
        <p className="text-xs text-muted">
          A class only appears here once it has at least one scheduled time. Assign times to a
          class via the <strong>Classes</strong> button in the admin bar.
        </p>
        {items.length === 0 && (
          <p className="text-xs text-muted mt-1">No classes in catalog yet.</p>
        )}
      </div>
    </div>
  );
}
