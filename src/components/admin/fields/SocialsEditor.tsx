'use client';

import { useCallback, useMemo } from 'react';
import type { SocialsSection } from '@/types/site';
import type { EditorProps } from './types';
import SocialLinksEditor from './SocialLinksEditor';

export default function EditSocials({
  section,
  onChange,
}: EditorProps<SocialsSection>) {
  // ---- top-level setters ----
  const setField = useCallback(
    <K extends keyof SocialsSection>(key: K, value: SocialsSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const style = useMemo(
    () => section.style ?? { background: 'default', rounded: 'xl', size: 'md', gap: 'md', align: 'center' },
    [section.style]
  );
  const setStyle = useCallback(
    <K extends keyof NonNullable<SocialsSection['style']>>(key: K, value: NonNullable<SocialsSection['style']>[K]) => {
      onChange({ ...section, style: { ...(section.style ?? {}), [key]: value } });
    },
    [onChange, section]
  );

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => setField('title', e.target.value)}
            placeholder="e.g., Connect With Me"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="Optional supporting text"
          />
        </div>
      </div>

      {/* Style */}
      <div className="grid md:grid-cols-5 gap-3">
        <div>
          <label className="block text-sm font-medium">Background</label>
          <select
            className="select w-full"
            value={style.background ?? 'default'}
            onChange={(e) => setStyle('background', e.target.value as NonNullable<SocialsSection['style']>['background'])}
          >
            <option value="default">default</option>
            <option value="band">band</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Rounded</label>
          <select
            className="select w-full"
            value={style.rounded ?? 'xl'}
            onChange={(e) => setStyle('rounded', e.target.value as NonNullable<SocialsSection['style']>['rounded'])}
          >
            <option value="lg">lg</option>
            <option value="xl">xl</option>
            <option value="2xl">2xl</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Icon Size</label>
          <select
            className="select w-full"
            value={style.size ?? 'md'}
            onChange={(e) => setStyle('size', e.target.value as NonNullable<SocialsSection['style']>['size'])}
          >
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Gap</label>
          <select
            className="select w-full"
            value={style.gap ?? 'md'}
            onChange={(e) => setStyle('gap', e.target.value as NonNullable<SocialsSection['style']>['gap'])}
          >
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Align</label>
          <select
            className="select w-full"
            value={style.align ?? 'center'}
            onChange={(e) => setStyle('align', e.target.value as NonNullable<SocialsSection['style']>['align'])}
          >
            <option value="left">left</option>
            <option value="center">center</option>
          </select>
        </div>
      </div>

      <SocialLinksEditor items={section.items ?? []} onChange={(items) => setField('items', items)} />
    </div>
  );
}
