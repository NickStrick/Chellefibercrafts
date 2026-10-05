'use client';

import type { SchedulingSection } from '@/types/site';
import type { EditorProps } from './types';

export default function EditScheduling({
  section,
  onChange,
}: EditorProps<SchedulingSection>) {
  const setField = <K extends keyof SchedulingSection>(
    key: K,
    value: SchedulingSection[K]
  ) => {
    if (section[key] === value) return;
    onChange({ ...section, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Book a time"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          className="textarea w-full"
          value={section.body ?? ''}
          onChange={(e) => setField('body', e.target.value)}
          placeholder="Pick a slot that works for you."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Calendly URL</label>
        <input
          className="input w-full"
          value={section.calendlyUrl}
          onChange={(e) => setField('calendlyUrl', e.target.value)}
          placeholder="https://calendly.com/your-handle/30min"
        />
        <p className="text-xs text-muted mt-1">
          Paste a public Calendly link (e.g., <code>https://calendly.com/your-handle/30min</code>).
        </p>
      </div>
    </div>
  );
}
