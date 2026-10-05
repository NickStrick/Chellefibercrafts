'use client';

import { useCallback } from 'react';
import type { PersonsSection, PersonsStyle, PersonItem } from '@/types/site';
import type { EditorProps } from './types';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

// small immutable helper (keeps parity with your other editors)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditPersons({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<PersonsSection>) {
  const style = section.style ?? {};
  const items = section.items ?? [];

  // ----- section + style setters -----
  const setField = useCallback(
    <K extends keyof PersonsSection>(key: K, value: PersonsSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  const setStyle = useCallback(
    <K extends keyof PersonsStyle>(key: K, value: PersonsStyle[K]) => {
      onChange({ ...section, style: { ...(section.style ?? {}), [key]: value } });
    },
    [onChange, section]
  );

  // ----- persons list ops -----
  const addPerson = useCallback(() => {
    const next = deepClone(section);
    const newItem: PersonItem = { name: 'New Person', title: '', description: '', avatarUrl: '', badges: [] };
    next.items = [...(next.items ?? []), newItem];
    onChange(next);
  }, [onChange, section]);

  const removePerson = useCallback(
    (idx: number) => {
      const next = deepClone(section);
      next.items = (next.items ?? []).filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, section]
  );

  const movePerson = useCallback(
    (from: number, to: number) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const updatePerson = useCallback(
    (idx: number, patch: Partial<PersonItem>) => {
      const next = deepClone(section);
      const arr = next.items ?? [];
      arr[idx] = { ...(arr[idx] as PersonItem), ...patch };
      next.items = arr;
      onChange(next);
    },
    [onChange, section]
  );

  // ----- per-person badge ops -----
  const addBadge = useCallback(
    (pIdx: number) => {
      const next = deepClone(section);
      const person = (next.items ?? [])[pIdx];
      const badges = person.badges ?? [];
      badges.push('');
      person.badges = badges;
      onChange(next);
    },
    [onChange, section]
  );

  const removeBadge = useCallback(
    (pIdx: number, bIdx: number) => {
      const next = deepClone(section);
      const person = (next.items ?? [])[pIdx];
      person.badges = (person.badges ?? []).filter((_, i) => i !== bIdx);
      onChange(next);
    },
    [onChange, section]
  );

  const updateBadge = useCallback(
    (pIdx: number, bIdx: number, value: string) => {
      const next = deepClone(section);
      const person = (next.items ?? [])[pIdx];
      const badges = person.badges ?? [];
      badges[bIdx] = value;
      person.badges = badges;
      onChange(next);
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
            placeholder="Our Team"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setField('subtitle', e.target.value)}
            placeholder="Meet the people behind our success"
          />
        </div>
      </div>

      {/* Style */}
      <div className="grid md:grid-cols-4 gap-3">
        <div>
          <label className="block text-sm font-medium">Card Variant</label>
          <select
            className="select w-full"
            value={style.cardVariant ?? 'default'}
            onChange={(e) => setStyle('cardVariant', e.target.value as NonNullable<PersonsStyle['cardVariant']>)}
          >
            <option value="default">default</option>
            <option value="ink">ink</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Columns</label>
          <select
            className="select w-full"
            value={style.columns ?? 3}
            onChange={(e) => setStyle('columns', Number(e.target.value) as NonNullable<PersonsStyle['columns']>)}
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Rounded</label>
          <select
            className="select w-full"
            value={style.rounded ?? 'xl'}
            onChange={(e) => setStyle('rounded', e.target.value as NonNullable<PersonsStyle['rounded']>)}
          >
            <option value="lg">lg</option>
            <option value="xl">xl</option>
            <option value="2xl">2xl</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Align</label>
          <select
            className="select w-full"
            value={style.align ?? 'center'}
            onChange={(e) => setStyle('align', e.target.value as NonNullable<PersonsStyle['align']>)}
          >
            <option value="left">left</option>
            <option value="center">center</option>
          </select>
        </div>
      </div>

      {/* Header for list */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Persons ({items.length})</div>
        <button className="btn btn-ghost" onClick={addPerson}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Person
        </button>
      </div>

      {/* Persons list */}
      <div className="space-y-4">
        {items.map((person, idx) => (
          <div key={`person-${idx}`} className="card admin-card card-solid p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{person.name || 'New Person'}</div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => movePerson(idx, idx - 1)}
                  disabled={idx === 0}
                  title="Move up"
                >
                  <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => movePerson(idx, idx + 1)}
                  disabled={idx === items.length - 1}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </button>
                <button className="btn btn-ghost" onClick={() => removePerson(idx)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="input w-full"
                  value={person.name}
                  onChange={(e) => updatePerson(idx, { name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Title</label>
                <input
                  className="input w-full"
                  value={person.title ?? ''}
                  onChange={(e) => updatePerson(idx, { title: e.target.value })}
                  placeholder="CEO, Developer, Mentor, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Avatar URL</label>
              <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                {person.avatarUrl ? (
                  <img
                    src={resolveAssetUrl(person.avatarUrl) ?? person.avatarUrl}
                    alt="Image preview"
                    className="admin-image-preview"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted">
                    No image selected
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={person.avatarUrl ?? ''}
                  onChange={(e) => updatePerson(idx, { avatarUrl: e.target.value })}
                  placeholder="https://… or configs/{siteId}/assets/avatar.jpg"
                />
                <button
                  type="button"
                  className="btn btn-inverted"
                  onClick={async () => {
                    const picked = await openMediaPicker(`configs/${siteId}/assets/`);
                    if (picked) updatePerson(idx, { avatarUrl: picked });
                  }}
                >
                  Pick…
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                className="textarea w-full"
                value={person.description ?? ''}
                onChange={(e) => updatePerson(idx, { description: e.target.value })}
                placeholder="Bio or description of the person"
                rows={3}
              />
            </div>

            {/* Badges */}
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Badges ({person.badges?.length ?? 0})</div>
              <button className="btn btn-ghost" onClick={() => addBadge(idx)}>
                <FontAwesomeIcon icon={faPlus} className="text-xs" />Add Badge
              </button>
            </div>

            {(person.badges ?? []).length > 0 ? (
              <div className="space-y-2">
                {(person.badges ?? []).map((badge, bIdx) => (
                  <div key={`person-${idx}-badge-${bIdx}`} className="flex gap-2 items-center">
                    <input
                      className="input flex-1"
                      value={badge}
                      onChange={(e) => updateBadge(idx, bIdx, e.target.value)}
                      placeholder="Certification, Qualification, Label, etc."
                    />
                    <button
                      className="btn btn-ghost"
                      onClick={() => removeBadge(idx, bIdx)}
                      title="Remove badge"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted">No badges yet. Click "Add Badge" to add qualifications or labels.</div>
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-muted">No persons yet. Click "Add Person" to get started.</div>
        )}
      </div>
    </div>
  );
}
