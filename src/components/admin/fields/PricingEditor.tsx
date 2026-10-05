'use client';

import { useCallback } from 'react';
import type { PricingSection, PricingPlan } from '@/types/site';
import type { EditorProps } from './types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
// tiny immutable helper (matches your other editors)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export default function EditPricing({
  section,
  onChange,
}: EditorProps<PricingSection>) {
  const plans = section.plans ?? [];

  // ---- section setters ----
  const setSectionField = useCallback(
    <K extends keyof PricingSection>(key: K, value: PricingSection[K]) => {
      onChange({ ...section, [key]: value });
    },
    [onChange, section]
  );

  // ---- plan operations ----
  const addPlan = useCallback(() => {
    const next = deepClone(section);
    const newPlan: PricingPlan = {
      name: 'New Plan',
      price: '',
      period: '',
      description: '',
      features: [],
      cta: { label: '', href: '' },
      featured: false,
      badge: '',
    };
    next.plans = [...(next.plans ?? []), newPlan];
    onChange(next);
  }, [onChange, section]);

  const removePlan = useCallback(
    (idx: number) => {
      const next = deepClone(section);
      next.plans = (next.plans ?? []).filter((_, i) => i !== idx);
      onChange(next);
    },
    [onChange, section]
  );

  const movePlan = useCallback(
    (from: number, to: number) => {
      const next = deepClone(section);
      const arr = next.plans ?? [];
      if (to < 0 || to >= arr.length) return;
      const [spliced] = arr.splice(from, 1);
      arr.splice(to, 0, spliced);
      next.plans = arr;
      onChange(next);
    },
    [onChange, section]
  );

  const updatePlan = useCallback(
    (idx: number, patch: Partial<PricingPlan>) => {
      const next = deepClone(section);
      const arr = next.plans ?? [];
      arr[idx] = { ...(arr[idx] as PricingPlan), ...patch };
      next.plans = arr;
      onChange(next);
    },
    [onChange, section]
  );

  // ---- feature operations (per plan) ----
  const addFeature = useCallback(
    (planIdx: number) => {
      const next = deepClone(section);
      const plan = next.plans?.[planIdx];
      if (!plan) return;
      plan.features = [...(plan.features ?? []), 'New feature'];
      onChange(next);
    },
    [onChange, section]
  );

  const updateFeature = useCallback(
    (planIdx: number, featureIdx: number, value: string) => {
      const next = deepClone(section);
      const plan = next.plans?.[planIdx];
      if (!plan) return;
      const list = plan.features ?? [];
      list[featureIdx] = value;
      plan.features = list;
      onChange(next);
    },
    [onChange, section]
  );

  const removeFeature = useCallback(
    (planIdx: number, featureIdx: number) => {
      const next = deepClone(section);
      const plan = next.plans?.[planIdx];
      if (!plan) return;
      plan.features = (plan.features ?? []).filter((_, i) => i !== featureIdx);
      onChange(next);
    },
    [onChange, section]
  );

  const moveFeature = useCallback(
    (planIdx: number, from: number, to: number) => {
      const next = deepClone(section);
      const plan = next.plans?.[planIdx];
      if (!plan) return;
      const list = plan.features ?? [];
      if (to < 0 || to >= list.length) return;
      const [spliced] = list.splice(from, 1);
      list.splice(to, 0, spliced);
      plan.features = list;
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
            onChange={(e) => setSectionField('title', e.target.value)}
            placeholder="e.g., Pricing"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => setSectionField('subtitle', e.target.value)}
            placeholder="Optional supporting text"
          />
        </div>
      </div>

      {/* Plans header */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Plans ({plans.length})</div>
        <button className="btn btn-ghost" onClick={addPlan}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />Add plan
        </button>
      </div>

      {/* Plans list */}
      <div className="space-y-4">
        {plans.map((p, i) => (
          <div key={`plan-${i}`} className="card admin-card card-solid p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.name || 'Untitled plan'}</div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => movePlan(i, i - 1)}
                  disabled={i === 0}
                  title="Move up"
                >
                   <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => movePlan(i, i + 1)}
                  disabled={i === plans.length - 1}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </button>
                <button className="btn btn-ghost" onClick={() => removePlan(i)} title="Remove">
                  <FontAwesomeIcon icon={faTrash} className="text-sm" />
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="input w-full"
                  value={p.name}
                  onChange={(e) => updatePlan(i, { name: e.target.value })}
                  placeholder="e.g., Pro"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Price</label>
                <input
                  className="input w-full"
                  value={p.price ?? ''}
                  onChange={(e) => updatePlan(i, { price: e.target.value })}
                  placeholder="$29"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Period</label>
                <input
                  className="input w-full"
                  value={p.period ?? ''}
                  onChange={(e) => updatePlan(i, { period: e.target.value })}
                  placeholder="per month"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                className="textarea w-full"
                value={p.description ?? ''}
                onChange={(e) => updatePlan(i, { description: e.target.value })}
                placeholder="Short summary of what's included"
              />
            </div>

            {/* CTA */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">CTA Label</label>
                <input
                  className="input w-full"
                  value={p.cta?.label ?? ''}
                  onChange={(e) =>
                    updatePlan(i, { cta: { ...(p.cta ?? { href: '' }), label: e.target.value } })
                  }
                  placeholder="e.g., Get started"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">CTA Href</label>
                <input
                  className="input w-full"
                  value={p.cta?.href ?? ''}
                  onChange={(e) =>
                    updatePlan(i, { cta: { ...(p.cta ?? { label: '' }), href: e.target.value } })
                  }
                  placeholder="/signup or https://…"
                />
              </div>
            </div>

            {/* Flags */}
            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!p.featured}
                  onChange={(e) => updatePlan(i, { featured: e.target.checked })}
                />
                <span>Featured</span>
              </label>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Badge (optional)</label>
                <input
                  className="input w-full"
                  value={p.badge ?? ''}
                  onChange={(e) => updatePlan(i, { badge: e.target.value })}
                  placeholder="e.g., Popular"
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Features ({p.features?.length ?? 0})</div>
                <button className="btn btn-ghost" onClick={() => addFeature(i)}>
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />Add feature
                </button>
              </div>

              <div className="space-y-2">
                {(p.features ?? []).map((f, fi) => (
                  <div key={`feature-${i}-${fi}`} className="grid md:grid-cols-[1fr_auto_auto_auto] gap-2">
                    <input
                      className="input"
                      value={f}
                      onChange={(e) => updateFeature(i, fi, e.target.value)}
                      placeholder="e.g., Unlimited projects"
                    />
                    <button
                      className="btn btn-ghost"
                      onClick={() => moveFeature(i, fi, fi - 1)}
                      disabled={fi === 0}
                      title="Move up"
                    >
                       <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => moveFeature(i, fi, fi + 1)}
                      disabled={fi === (p.features?.length ?? 0) - 1}
                      title="Move down"
                    >
                       <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => removeFeature(i, fi)}
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                ))}
                {(p.features?.length ?? 0) === 0 && (
                  <div className="text-sm text-muted">No features yet. Click “Add feature”.</div>
                )}
              </div>
            </div>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="text-sm text-muted">No plans yet. Click “Add plan”.</div>
        )}
      </div>
    </div>
  );
}
