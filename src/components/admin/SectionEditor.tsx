'use client';

import { WAVE_TYPES, type AnySection } from '@/types/site';
import { sectionRegistry } from './SectionRegistry';

export default function SectionEditor({
  section,
  siteId,
  openMediaPicker,
  onChange,
  onRemove,
}: {
  section: AnySection;
  siteId: string;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  onChange: (next: AnySection) => void;
  onRemove: () => void;
}) {
  const reg = sectionRegistry[section.type];

  return (
    <div className="card admin-card card-solid p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">{section.type.toUpperCase()}</div>
      </div>

      {/* Common fields */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium">ID</label>
          <input
            className="input w-full"
            value={section.id}
            onChange={(e) => onChange({ ...section, id: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Type</label>
          <input className="input w-full" value={section.type} readOnly />
        </div>
        <label className="flex items-end gap-2">
          <input
            type="checkbox"
            checked={section.visible !== false}
            onChange={(e) => onChange({ ...section, visible: e.target.checked })}
          />
          <span>Visible</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Top wave</label>
          <select
            className="select w-full"
            value={section.topWaveType ?? ''}
            onChange={(e) =>
              onChange({
                ...section,
                topWaveType: (e.target.value || undefined) as AnySection['topWaveType'],
              })
            }
          >
            <option value="" defaultChecked>— none —</option>
            {WAVE_TYPES.map((waveType) => (
              <option key={waveType} value={waveType}>
                {waveType}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Bottom wave</label>
          <select
            className="select w-full"
            value={section.bottomWaveType ?? ''}
            onChange={(e) =>
              onChange({
                ...section,
                bottomWaveType: (e.target.value || undefined) as AnySection['bottomWaveType'],
              })
            }
          >
            <option value="" defaultChecked>— none —</option>
            {WAVE_TYPES.map((waveType) => (
              <option key={waveType} value={waveType}>
                {waveType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Type-specific editor */}
      {reg?.Editor ? (
        <reg.Editor
          // TS: tell the editor its exact subtype
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          section={section as any}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(next: any) => onChange(next)}
          openMediaPicker={openMediaPicker}
          siteId={siteId}
        />
      ) : (
        <div className="text-sm text-muted">
          No editor registered for <code>{section.type}</code>.
        </div>
      )}

      {/* Remove */}
      <div className="pt-2">
        <button className="btn btn-ghost" onClick={onRemove}>
          Remove section
        </button>
      </div>
    </div>
  );
}
