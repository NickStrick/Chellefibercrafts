import type { CTASection } from '@/types/site';
import type { EditorProps } from './types';

export function EditCTA({ section, onChange }: EditorProps<CTASection>) {
  // ensure we always have a full CTA object to edit
  const cta = section.cta ?? { label: '', href: '' };

  const set = <K extends keyof CTASection>(key: K, value: CTASection[K]) =>
    onChange({ ...section, [key]: value });

  const setCta = <K extends keyof typeof cta>(key: K, value: (typeof cta)[K]) =>
    onChange({ ...section, cta: { ...cta, [key]: value } });

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          className="input w-full"
          value={section.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          className="textarea w-full"
          value={section.body ?? ''}
          onChange={(e) => set('body', e.target.value)}
        />
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium">CTA label</label>
          <input
            className="input w-full"
            value={cta.label}
            onChange={(e) => setCta('label', e.target.value)}
            placeholder="Call Now"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">CTA href</label>
          <input
            className="input w-full"
            value={cta.href}
            onChange={(e) => setCta('href', e.target.value)}
            placeholder="tel:..., mailto:..., /contact, https://..."
          />
        </div>
      </div>
    </div>
  );
}
