'use client';

import type { DisclaimerSection } from '@/types/site';
import type { EditorProps } from './types';

// (no local utilities required)

export default function EditDisclaimer({
  section,
  onChange,
}: EditorProps<DisclaimerSection>) {
  const setField = <K extends keyof DisclaimerSection>(key: K, value: DisclaimerSection[K]) => {
    // keep object identity stable where possible
    if (section[key] === value) return;
    onChange({ ...section, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          id="disclaimer-enabled"
          type="checkbox"
          className="checkbox"
          checked={section.enabled ?? true}
          onChange={(e) => setField('enabled', e.target.checked)}
        />
        <label htmlFor="disclaimer-enabled" className="text-sm">
          Enabled
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title ?? ''}
          onChange={(e) => setField('title', e.target.value)}
          placeholder="Disclaimer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          className="textarea w-full min-h-32"
          value={section.body}
          onChange={(e) => setField('body', e.target.value)}
          placeholder="Write your disclaimer text (markdown or plain text)…"
        />
        <p className="text-xs text-muted mt-1">
          Supports plain text or markdown.
        </p>
      </div>
    </div>
  );
}
