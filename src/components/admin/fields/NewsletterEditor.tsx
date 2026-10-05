'use client';

import type { NewsletterSection } from '@/types/site';
import type { EditorProps } from './types';

export default function EditNewsletter({
  section,
  onChange,
}: EditorProps<NewsletterSection>) {
  const setField = <K extends keyof NewsletterSection>(
    key: K,
    value: NewsletterSection[K]
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
          placeholder="Get updates in your inbox"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          className="textarea w-full"
          value={section.body ?? ''}
          onChange={(e) => setField('body', e.target.value)}
          placeholder="Short description of your newsletter."
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Google Form Embed URL</label>
        <input
          className="input w-full"
          value={section.googleFormEmbedUrl}
          onChange={(e) => setField('googleFormEmbedUrl', e.target.value)}
          placeholder="https://docs.google.com/forms/d/e/.../viewform?embedded=true"
        />
        <p className="text-xs text-muted mt-1">
          Use the Google Form&apos;s <em>Embed</em> URL (the one that works inside an iframe).
        </p>
      </div>
    </div>
  );
}
