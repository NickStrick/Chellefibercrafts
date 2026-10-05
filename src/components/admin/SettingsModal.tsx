'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CheckoutInput, CheckoutInputOption, PaymentsSettings, PromoCode, SiteConfig, SiteDisabledSettings, SocialsSection } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import AdminAIChatPanel from './AdminAIChatPanel';
import SocialLinksEditor from './fields/SocialLinksEditor';
import MediaPicker from './MediaPicker';
import { applySiteConfigPatch } from '@/lib/siteConfigPatch';
import { isAdminAiUiEnabled } from '@/lib/adminAi';
import { getSiteDisabledSettings, SITE_DISABLED_DEFAULT_MESSAGE, SITE_DISABLED_DEFAULT_TITLE } from '@/lib/siteConfigSections';

// -----------------------------
// Utilities
// -----------------------------
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

function rid() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

type LocalCheckoutInput = CheckoutInput & {
  _id: string;
  optionsText?: string;
};

type LocalPromoCode = PromoCode & { _id: string };

function promoCodesToLocal(xs: PromoCode[]): LocalPromoCode[] {
  return (xs ?? []).map((p) => ({ ...p, _id: rid() }));
}

function promoCodesFromLocal(xs: LocalPromoCode[]): PromoCode[] {
  return xs.map(({ promoId, type, value }) => ({ promoId, type, value }));
}

function optionsToText(options?: CheckoutInputOption[]) {
  if (!options || options.length === 0) return '';
  return options
    .map((opt) => (opt.label === opt.value ? opt.value : `${opt.label}:${opt.value}`))
    .join(', ');
}

function textToOptions(text?: string): CheckoutInputOption[] {
  if (!text) return [];
  return text
    .split(',')
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((entry) => {
      const [label, value] = entry.includes(':')
        ? entry.split(':').map((s) => s.trim())
        : [entry, entry];
      return { label, value };
    })
    .filter((opt) => opt.label && opt.value);
}

function checkoutInputsToLocal(xs: CheckoutInput[]): LocalCheckoutInput[] {
  return (xs ?? []).map((f) => ({
    ...f,
    _id: rid(),
    optionsText: optionsToText(f.options),
  }));
}

function checkoutInputsFromLocal(xs: LocalCheckoutInput[]): CheckoutInput[] {
  return xs.map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    required: f.required,
    placeholder: f.placeholder,
    description: f.description,
    googleFormEntryId: f.googleFormEntryId,
    hidden: f.hidden,
    options: f.type === 'select' ? textToOptions(f.optionsText) : undefined,
  }));
}

// -----------------------------
// Props
// -----------------------------
export type SettingsModalProps = {
  onClose: () => void;
};

// -----------------------------
// Component
// -----------------------------
export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { config, setConfig } = useSite();
  const adminAiEnabled = isAdminAiUiEnabled();
  const siteId = getSiteId();

  const [draft, setDraft] = useState<SiteConfig | null>(null);
  const originalRef = useRef<SiteConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payments'>('payments');
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (config) {
      const copy = deepClone(config);
      setDraft(copy);
      originalRef.current = copy;
      const paymentsFromConfig = copy.settings?.payments ?? {};
      setLocalCheckoutInputs(checkoutInputsToLocal(paymentsFromConfig.checkoutInputs ?? []));
      setLocalPromoCodes(promoCodesToLocal(paymentsFromConfig.promoCodes ?? []));
    }
  }, [config]);

  const payments = useMemo<PaymentsSettings>(
    () => draft?.settings?.payments ?? {},
    [draft?.settings?.payments]
  );

  const general = useMemo<Record<string, unknown>>(
    () => draft?.settings?.general ?? {},
    [draft?.settings?.general]
  );

  const businessDisplayName = useMemo(
    () => (typeof general.businessDisplayName === 'string' ? general.businessDisplayName : ''),
    [general.businessDisplayName]
  );

  const businessNotificationEmail = useMemo(
    () => (typeof general.businessNotificationEmail === 'string' ? general.businessNotificationEmail : ''),
    [general.businessNotificationEmail]
  );

  const updateGeneral = useCallback((patch: Record<string, unknown>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextGeneral = { ...(prev.settings?.general ?? {}), ...patch };
      return { ...prev, settings: { ...(prev.settings ?? {}), general: nextGeneral } };
    });
  }, []);

  // ── Media picker (same promise pattern as ClassesModal) ──
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerResolveRef = useRef<((key: string | null) => void) | null>(null);

  const openMediaPicker = useCallback((): Promise<string | null> => {
    setPickerOpen(true);
    return new Promise<string | null>((resolve) => {
      pickerResolveRef.current = resolve;
    });
  }, []);

  const handlePick = useCallback((key: string) => {
    pickerResolveRef.current?.(key);
    pickerResolveRef.current = null;
    setPickerOpen(false);
  }, []);

  const handleCancelPick = useCallback(() => {
    pickerResolveRef.current?.(null);
    pickerResolveRef.current = null;
    setPickerOpen(false);
  }, []);

  const siteDisabled = useMemo(() => getSiteDisabledSettings(draft), [draft]);

  // Existing Socials sections (home + custom pages) whose links can be copied in.
  const socialsSources = useMemo(() => {
    if (!draft) return [];
    const locations = [
      { where: 'Home', sections: draft.sections ?? [] },
      ...(draft.pages ?? []).map((p) => ({ where: p.title || `/${p.slug}`, sections: p.sections ?? [] })),
    ];
    return locations.flatMap(({ where, sections }) =>
      sections
        .filter((s): s is SocialsSection => s.type === 'socials' && (s as SocialsSection).items?.length > 0)
        .map((s) => ({
          label: `${where} — ${s.title || 'Socials'} (${s.items.length} link${s.items.length === 1 ? '' : 's'})`,
          items: s.items,
        }))
    );
  }, [draft]);

  const updateSiteDisabled = useCallback(
    (patch: Partial<SiteDisabledSettings>) => {
      updateGeneral({ siteDisabled: { ...siteDisabled, ...patch } });
    },
    [siteDisabled, updateGeneral]
  );

  // Seeded once above whenever `config` itself changes (initial load,
  // Restore). NOT re-synced from `payments.checkoutInputs`/`promoCodes` on
  // every edit — those change on every keystroke (commit writes back into
  // `draft.settings.payments`), and re-deriving from them would regenerate
  // every row's `_id` via `rid()` each time, which changes each row's React
  // `key` and remounts every input — losing focus after a single keystroke.
  const [localCheckoutInputs, setLocalCheckoutInputs] = useState<LocalCheckoutInput[]>([]);
  const [localPromoCodes, setLocalPromoCodes] = useState<LocalPromoCode[]>([]);

  const updatePayments = useCallback(
    <K extends keyof PaymentsSettings>(key: K, value: PaymentsSettings[K]) => {
      setDraft((prev) => {
        if (!prev) return prev;
        const nextPayments = { ...(prev.settings?.payments ?? {}), [key]: value };
        return { ...prev, settings: { ...(prev.settings ?? {}), payments: nextPayments } };
      });
    },
    []
  );

  const commitCheckoutInputs = useCallback(
    (next: LocalCheckoutInput[]) => {
      setLocalCheckoutInputs(next);
      updatePayments('checkoutInputs', checkoutInputsFromLocal(next));
    },
    [updatePayments]
  );

  const addCheckoutInput = useCallback(() => {
    const next: LocalCheckoutInput = {
      _id: rid(),
      id: `field-${rid().slice(0, 6)}`,
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
      description: '',
      googleFormEntryId: '',
      optionsText: '',
    };
    commitCheckoutInputs([...localCheckoutInputs, next]);
  }, [commitCheckoutInputs, localCheckoutInputs]);

  const updateCheckoutInput = useCallback(
    (id: string, patch: Partial<LocalCheckoutInput>) => {
      commitCheckoutInputs(localCheckoutInputs.map((f) => (f._id === id ? { ...f, ...patch } : f)));
    },
    [commitCheckoutInputs, localCheckoutInputs]
  );

  const removeCheckoutInput = useCallback(
    (id: string) => {
      commitCheckoutInputs(localCheckoutInputs.filter((f) => f._id !== id));
    },
    [commitCheckoutInputs, localCheckoutInputs]
  );

  const commitPromoCodes = useCallback(
    (next: LocalPromoCode[]) => {
      setLocalPromoCodes(next);
      updatePayments('promoCodes', promoCodesFromLocal(next));
    },
    [updatePayments]
  );

  const addPromoCode = useCallback(() => {
    commitPromoCodes([...localPromoCodes, { _id: rid(), promoId: '', type: 'percentage', value: 10 }]);
  }, [commitPromoCodes, localPromoCodes]);

  const updatePromoCode = useCallback(
    (id: string, patch: Partial<LocalPromoCode>) => {
      commitPromoCodes(localPromoCodes.map((p) => (p._id === id ? { ...p, ...patch } : p)));
    },
    [commitPromoCodes, localPromoCodes]
  );

  const removePromoCode = useCallback(
    (id: string) => {
      commitPromoCodes(localPromoCodes.filter((p) => p._id !== id));
    },
    [commitPromoCodes, localPromoCodes]
  );

  const isDirty = useMemo(() => {
    if (!draft || !originalRef.current) return false;
    return JSON.stringify(draft) !== JSON.stringify(originalRef.current);
  }, [draft]);

  const canSave = useMemo(() => !!draft, [draft]);

  const onSave = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);

    try {
      const variant = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? 'draft') as 'draft' | 'published';
      const url = `/api/admin/config/${encodeURIComponent(siteId)}?variant=${variant}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-local-admin': '1',
        },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Save failed with HTTP ${res.status}`);
      }

      const saved: SiteConfig = await res.json();
      setConfig(saved);
      originalRef.current = deepClone(saved);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [draft, onClose, setConfig, siteId]);

  const onRestore = useCallback(() => {
    if (!originalRef.current) return;
    const restored = deepClone(originalRef.current);
    setDraft(restored);
    const restoredPayments = restored.settings?.payments ?? {};
    setLocalCheckoutInputs(checkoutInputsToLocal(restoredPayments.checkoutInputs ?? []));
    setLocalPromoCodes(promoCodesToLocal(restoredPayments.promoCodes ?? []));
  }, []);

  const sendTestOrderEmail = useCallback(async () => {
    setTestEmailSending(true);
    setTestEmailResult(null);
    try {
      const res = await fetch('/api/admin/orders/email-test', {
        method: 'POST',
        headers: { 'x-local-admin': '1', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDisplayName,
          businessNotificationEmail,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || `HTTP ${res.status}`);

      let orderId = '';
      try {
        const json = JSON.parse(text) as { order?: { orderId?: string } };
        orderId = json?.order?.orderId ?? '';
      } catch {
        // ignore
      }

      setTestEmailResult({
        ok: true,
        message: orderId ? `Created test order: ${orderId}` : 'Created test order.',
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to create test order.';
      setTestEmailResult({ ok: false, message: msg });
    } finally {
      setTestEmailSending(false);
    }
  }, [businessDisplayName, businessNotificationEmail]);

  if (!draft) {
    return (
      <div className="fixed inset-0 z-[1200] bg-black/50 flex items-center justify-center p-4">
        <div className="card admin-card p-6">
          <div className="text-sm text-muted">Loading settings...</div>
          <div className="mt-4 text-right">
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed edit-modal inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
      <div className="card admin-card card-solid p-4 relative w-full max-w-5xl !max-w-full overflow-hidden card-screen-height">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-lg">Edit Site Settings</div>
          <div className="flex items-center gap-2 save-config-btns">
            {error && <div className="text-red-600 text-sm mr-3">{error}</div>}
            {isDirty && (
              <button className="btn btn-ghost" onClick={onRestore}>
                Restore
              </button>
            )}
            <button className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onSave} disabled={!canSave || saving || !isDirty}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {adminAiEnabled && (
          <div className="p-4 border-b">
            <AdminAIChatPanel
              mode="inline"
              title="AI (Settings)"
              placeholder="Ask AI to update payments, checkout fields, or other settings..."
              config={draft}
              onApplyPatch={(patch) => {
                setDraft((prev) => (prev ? applySiteConfigPatch(prev, patch) : prev));
              }}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 pt-4">
          <div className="flex justify-center gap-6 border-b">
            <button
              className={[
                'px-4 py-2 -mb-px text-sm font-semibold transition-colors border-b-4 admin-tab',
                activeTab === 'general'
                  ? 'border-transparent text-white active'
                  : 'border-transparent text-gray-200  hover:text-[var(--admin-primary)]',
              ].join(' ')}
              onClick={() => setActiveTab('general')}
            >
              General
            </button>
            <button
              className={[
                'px-4 py-2 -mb-px text-sm font-semibold transition-colors border-b-4 admin-tab',
                activeTab === 'payments'
                  ? ' border-transparent text-white active'
                  : 'border-transparent text-gray-200  hover:text-[var(--admin-primary)]',
              ].join(' ')}
              onClick={() => setActiveTab('payments')}
            >
              Payments
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-auto">
          {activeTab === 'general' && (
            <div className="card admin-card card-solid card-full p-4 space-y-3 w-full">
              <div className="font-semibold">General</div>

              <div className="card admin-card card-solid card-full p-4 space-y-3">
                <div className="font-semibold">Site Availability</div>
                <div className="text-sm text-muted">
                  While enabled, every page shows only this notice and the social links below — no header, footer, or other sections.
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={siteDisabled.enabled === true}
                    onChange={(e) => updateSiteDisabled({ enabled: e.target.checked })}
                  />
                  <span>Toggle Site Unavailable</span>
                </label>

                <div className="grid gap-3">
                  <div>
                    <label className="block text-sm font-medium">Logo Image</label>
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        value={siteDisabled.logoImage ?? ''}
                        onChange={(e) => updateSiteDisabled({ logoImage: e.target.value })}
                        placeholder={`configs/${siteId}/assets/… or https://…`}
                      />
                      <button
                        type="button"
                        className="btn btn-inverted flex-shrink-0"
                        onClick={async () => {
                          const picked = await openMediaPicker();
                          if (picked) updateSiteDisabled({ logoImage: picked });
                        }}
                      >
                        Pick…
                      </button>
                    </div>
                    <div className="text-xs text-muted mt-1">Optional — shown above the title.</div>

                    <label className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={siteDisabled.logoRounded === true}
                        onChange={(e) => updateSiteDisabled({ logoRounded: e.target.checked })}
                      />
                      <span>Rounded logo (circle, cropped to a square)</span>
                    </label>

                    <div className="mt-2">
                      <label className="block text-sm font-medium">Logo Size</label>
                      <select
                        className="select"
                        value={siteDisabled.logoSize ?? 'md'}
                        onChange={(e) => updateSiteDisabled({ logoSize: e.target.value as SiteDisabledSettings['logoSize'] })}
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input
                      className="input w-full"
                      value={siteDisabled.title ?? ''}
                      onChange={(e) => updateSiteDisabled({ title: e.target.value })}
                      placeholder={SITE_DISABLED_DEFAULT_TITLE}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Message</label>
                    <textarea
                      className="input w-full min-h-[96px]"
                      value={siteDisabled.message ?? ''}
                      onChange={(e) => updateSiteDisabled({ message: e.target.value })}
                      placeholder={SITE_DISABLED_DEFAULT_MESSAGE}
                    />
                    <div className="text-xs text-muted mt-1">
                      Tell visitors why the site is down. Leave blank to use the placeholder text.
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-medium">Social Links</div>
                      {socialsSources.length > 0 && (
                        <select
                          className="select"
                          value=""
                          onChange={(e) => {
                            const source = socialsSources[Number(e.target.value)];
                            if (source) updateSiteDisabled({ socials: source.items.map((it) => ({ ...it })) });
                          }}
                          title="Replace these links with a copy of an existing Socials section's links"
                        >
                          <option value="" disabled>
                            Copy links from…
                          </option>
                          {socialsSources.map((src, i) => (
                            <option key={i} value={i}>
                              {src.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <SocialLinksEditor
                      items={siteDisabled.socials ?? []}
                      onChange={(socials) => updateSiteDisabled({ socials })}
                    />
                  </div>
                </div>
              </div>

              <div className="card admin-card card-solid card-full p-4 space-y-3">
                <div className="font-semibold">Emailing</div>
                <div className="text-sm text-muted">
                  Used for order confirmation + notification emails (DynamoDB Streams → Lambda → Resend).
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium">Business Display Name</label>
                    <input
                      className="input w-full"
                      value={businessDisplayName}
                      onChange={(e) => updateGeneral({ businessDisplayName: e.target.value })}
                      placeholder="Sapling Sites"
                    />
                    <div className="text-xs text-muted mt-1">
                      Shows in the customer email “From” name.
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Business Notification Email</label>
                    <input
                      className="input w-full"
                      value={businessNotificationEmail}
                      onChange={(e) => updateGeneral({ businessNotificationEmail: e.target.value })}
                      placeholder="orders@yourbusiness.com"
                    />
                    <div className="text-xs text-muted mt-1">
                      Receives new order notifications and becomes Reply-To.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="btn btn-primary"
                    onClick={sendTestOrderEmail}
                    disabled={testEmailSending}
                    aria-disabled={testEmailSending}
                    title="Creates a 1¢ test order using Business Notification Email as both customer + business email."
                  >
                    {testEmailSending ? 'Sending...' : 'Send Test Email'}
                  </button>
                  <div className="text-xs text-muted">
                    Creates a 1¢ test order with the business email as both To addresses.
                  </div>
                </div>

                {testEmailResult && (
                  <div
                    className={[
                      'text-sm rounded-lg px-3 py-2 border',
                      testEmailResult.ok
                        ? 'border-emerald-700/40 bg-emerald-900/20 text-emerald-200'
                        : 'border-red-700/40 bg-red-900/20 text-red-200',
                    ].join(' ')}
                  >
                    {testEmailResult.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="card admin-card card-solid card-full p-4 space-y-4 w-full">
              <div className="font-semibold">Payments</div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={payments.cartActive === true}
                onChange={(e) => updatePayments('cartActive', e.target.checked)}
              />
              <span>Enable cart + checkout</span>
            </label>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Payment Type</label>
                <select
                  className="select w-full"
                  value={payments.paymentType ?? 'converge'}
                  onChange={(e) => updatePayments('paymentType', e.target.value as PaymentsSettings['paymentType'])}
                >
                  <option value="converge">converge</option>
                  <option value="clover">clover</option>
                  <option value="externalLink">externalLink</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">External Payment URL</label>
                <input
                  className="input w-full"
                  value={payments.externalPaymentUrl ?? ''}
                  onChange={(e) => updatePayments('externalPaymentUrl', e.target.value)}
                  placeholder="https://venmo.com/..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Support Email</label>
                <input
                  className="input w-full"
                  value={payments.supportEmail ?? ''}
                  onChange={(e) => updatePayments('supportEmail', e.target.value)}
                  placeholder="help@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Support Phone Label</label>
                <input
                  className="input w-full"
                  value={payments.supportPhone?.label ?? ''}
                  onChange={(e) =>
                    updatePayments('supportPhone', {
                      label: e.target.value,
                      href: payments.supportPhone?.href ?? '',
                    })
                  }
                  placeholder="Call us at 555-555-5555"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Support Phone Href</label>
                <input
                  className="input w-full"
                  value={payments.supportPhone?.href ?? ''}
                  onChange={(e) =>
                    updatePayments('supportPhone', {
                      label: payments.supportPhone?.label ?? '',
                      href: e.target.value,
                    })
                  }
                  placeholder="tel:+15555555555"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium">Google Form URL</label>
              <input
                className="input w-full"
                value={payments.googleFormUrl ?? ''}
                onChange={(e) => updatePayments('googleFormUrl', e.target.value)}
                placeholder="https://docs.google.com/forms/d/e/.../formResponse"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={payments.googleFormSubmitBeforePayment === true}
                onChange={(e) => updatePayments('googleFormSubmitBeforePayment', e.target.checked)}
              />
              <span>Submit Google Form before payment step</span>
            </label>

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="text-sm font-semibold">Taxes</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payments.taxes?.enabled === true}
                  onChange={(e) =>
                    updatePayments('taxes', {
                      ...payments.taxes,
                      enabled: e.target.checked,
                    })
                  }
                />
                <span>Enable taxes</span>
              </label>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium">Tax rate %</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={payments.taxes?.ratePercent ?? 0}
                    onChange={(e) =>
                      updatePayments('taxes', {
                        ...payments.taxes,
                        ratePercent: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <label className="flex items-end gap-2">
                  <input
                    type="checkbox"
                    checked={payments.taxes?.taxShipping === true}
                    onChange={(e) =>
                      updatePayments('taxes', {
                        ...payments.taxes,
                        taxShipping: e.target.checked,
                      })
                    }
                  />
                  <span>Tax shipping/delivery fee</span>
                </label>
                <label className="flex items-end gap-2">
                  <input
                    type="checkbox"
                    checked={payments.taxes?.defaultProductTaxable === true}
                    onChange={(e) =>
                      updatePayments('taxes', {
                        ...payments.taxes,
                        defaultProductTaxable: e.target.checked,
                      })
                    }
                  />
                  <span>Default product taxable</span>
                </label>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="text-sm font-semibold">Delivery</div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payments.delivery?.enabled === true}
                  onChange={(e) =>
                    updatePayments('delivery', {
                      ...payments.delivery,
                      enabled: e.target.checked,
                    })
                  }
                />
                <span>Enable merchant delivery</span>
              </label>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium">Delivery Type</label>
                  <select
                    className="select w-full"
                    value={payments.delivery?.type ?? 'flat'}
                    onChange={(e) =>
                      updatePayments('delivery', {
                        ...payments.delivery,
                        type: e.target.value as NonNullable<PaymentsSettings['delivery']>['type'],
                      })
                    }
                  >
                    <option value="flat">Flat</option>
                    <option value="uber">Uber</option>
                    <option value="doordash">DoorDash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Delivery Mode</label>
                  <select
                    className="select w-full"
                    value={payments.delivery?.mode ?? 'both'}
                    onChange={(e) =>
                      updatePayments('delivery', {
                        ...payments.delivery,
                        mode: e.target.value as NonNullable<PaymentsSettings['delivery']>['mode'],
                      })
                    }
                  >
                    <option value="both">Pickup + Delivery</option>
                    <option value="pickup">Pickup only</option>
                    <option value="delivery">Delivery only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Apps Script Web App URL</label>
                  <input
                    className="input w-full"
                    value={payments.delivery?.appsScriptUrl ?? ''}
                    onChange={(e) =>
                      updatePayments('delivery', {
                        ...payments.delivery,
                        appsScriptUrl: e.target.value,
                      })
                    }
                    placeholder="https://script.google.com/macros/s/..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Delivery fee (cents)</label>
                <input
                  type="number"
                  className="input w-full"
                  value={payments.delivery?.flatFeeCents ?? 0}
                  onChange={(e) =>
                    updatePayments('delivery', {
                      ...payments.delivery,
                      flatFeeCents: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payments.delivery?.driverTipEnabled === true}
                  onChange={(e) =>
                    updatePayments('delivery', {
                      ...payments.delivery,
                      driverTipEnabled: e.target.checked,
                    })
                  }
                />
                <span>Enable Delivery Driver Tip</span>
              </label>

              <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="text-sm font-semibold">Delivery Address</div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={payments.delivery?.addressCapture?.enabled === true}
                    onChange={(e) =>
                      updatePayments('delivery', {
                        ...payments.delivery,
                        addressCapture: {
                          ...payments.delivery?.addressCapture,
                          enabled: e.target.checked,
                        },
                      })
                    }
                  />
                  <span>Enable delivery address</span>
                </label>
                <div className="grid md:grid-cols-3 gap-3">
                  <label className="flex items-end gap-2">
                    <input
                      type="checkbox"
                      checked={payments.delivery?.addressCapture?.required === true}
                      onChange={(e) =>
                        updatePayments('delivery', {
                          ...payments.delivery,
                          addressCapture: {
                            ...payments.delivery?.addressCapture,
                            required: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Required</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium">Save Method</label>
                    <select
                      className="select w-full"
                      value={payments.delivery?.addressCapture?.method ?? 'googleForm'}
                      onChange={(e) =>
                        updatePayments('delivery', {
                          ...payments.delivery,
                          addressCapture: {
                            ...payments.delivery?.addressCapture,
                            method: e.target.value as NonNullable<
                              NonNullable<PaymentsSettings['delivery']>['addressCapture']
                            >['method'],
                          },
                        })
                      }
                    >
                      <option value="googleForm">Google Form</option>
                      <option value="s3">S3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Google Form Entry ID</label>
                    <input
                      className="input w-full"
                      value={payments.delivery?.addressCapture?.googleFormEntryId ?? ''}
                      onChange={(e) =>
                        updatePayments('delivery', {
                          ...payments.delivery,
                          addressCapture: {
                            ...payments.delivery?.addressCapture,
                            googleFormEntryId: e.target.value,
                          },
                        })
                      }
                      placeholder="entry.123456"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium">S3 Prefix (optional)</label>
                  <input
                    className="input w-full"
                    value={payments.delivery?.addressCapture?.s3Prefix ?? ''}
                    onChange={(e) =>
                      updatePayments('delivery', {
                        ...payments.delivery,
                        addressCapture: {
                          ...payments.delivery?.addressCapture,
                          s3Prefix: e.target.value,
                        },
                      })
                    }
                    placeholder="orders/{siteId}/delivery/"
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={payments.googleFormOptions?.addItemToGForm === true}
                  onChange={(e) =>
                    updatePayments('googleFormOptions', {
                      ...payments.googleFormOptions,
                      addItemToGForm: e.target.checked,
                    })
                  }
                />
                <span>Send cart items + total</span>
              </label>
              <div>
                <label className="block text-sm font-medium">Items Entry ID</label>
                <input
                  className="input w-full"
                  value={payments.googleFormOptions?.itemsEntryId ?? ''}
                  onChange={(e) =>
                    updatePayments('googleFormOptions', {
                      ...payments.googleFormOptions,
                      itemsEntryId: e.target.value,
                    })
                  }
                  placeholder="entry.123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Total Entry ID</label>
                <input
                  className="input w-full"
                  value={payments.googleFormOptions?.totalEntryId ?? ''}
                  onChange={(e) =>
                    updatePayments('googleFormOptions', {
                      ...payments.googleFormOptions,
                      totalEntryId: e.target.value,
                    })
                  }
                  placeholder="entry.654321"
                />
              </div>
            </div>

            {/* ---- Promo Codes ---- */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Promo Codes</div>
                <button className="btn btn-ghost" onClick={addPromoCode}>
                  Add promo
                </button>
              </div>

              {localPromoCodes.length === 0 && (
                <div className="text-sm text-muted">No promo codes configured.</div>
              )}

              <div className="space-y-3">
                {localPromoCodes.map((promo) => (
                  <div key={promo._id} className="rounded-lg border border-gray-200 p-3 space-y-3">
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium">Promo Code</label>
                        <input
                          className="input w-full"
                          value={promo.promoId}
                          onChange={(e) => updatePromoCode(promo._id, { promoId: e.target.value })}
                          placeholder="SUMMER20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Type</label>
                        <select
                          className="select w-full"
                          value={promo.type}
                          onChange={(e) => updatePromoCode(promo._id, { type: e.target.value as PromoCode['type'] })}
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="amount">Fixed Amount ($)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium">
                          Value ({promo.type === 'percentage' ? '%' : '$'})
                        </label>
                        <input
                          type="number"
                          className="input w-full"
                          min={0}
                          value={promo.value}
                          onChange={(e) => updatePromoCode(promo._id, { value: Number(e.target.value) || 0 })}
                          placeholder={promo.type === 'percentage' ? '10' : '5.00'}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button className="btn btn-ghost text-red-600" onClick={() => removePromoCode(promo._id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---- Checkout Inputs ---- */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Checkout Inputs</div>
                <button className="btn btn-ghost" onClick={addCheckoutInput}>
                  Add input
                </button>
              </div>

              {localCheckoutInputs.length === 0 && (
                <div className="text-sm text-muted">No checkout inputs configured.</div>
              )}

              <div className="space-y-4">
                {localCheckoutInputs.map((field) => (
                  <div key={field._id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium">Label</label>
                        <input
                          className="input w-full"
                          value={field.label ?? ''}
                          onChange={(e) => updateCheckoutInput(field._id, { label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Field ID</label>
                        <input
                          className="input w-full"
                          value={field.id ?? ''}
                          onChange={(e) => updateCheckoutInput(field._id, { id: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Type</label>
                        <select
                          className="select w-full"
                          value={field.type}
                          onChange={(e) =>
                            updateCheckoutInput(field._id, { type: e.target.value as CheckoutInput['type'] })
                          }
                        >
                          <option value="text">text</option>
                          <option value="tel">tel</option>
                          <option value="email">email</option>
                          <option value="date">date</option>
                          <option value="time">time</option>
                          <option value="datetime-local">datetime-local</option>
                          <option value="textarea">textarea</option>
                          <option value="select">select</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium">Placeholder</label>
                        <input
                          className="input w-full"
                          value={field.placeholder ?? ''}
                          onChange={(e) => updateCheckoutInput(field._id, { placeholder: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium">Description</label>
                        <input
                          className="input w-full"
                          value={field.description ?? ''}
                          onChange={(e) => updateCheckoutInput(field._id, { description: e.target.value })}
                        />
                      </div>
                    </div>

                    {field.type === 'select' && (
                      <div>
                        <label className="block text-sm font-medium">Options</label>
                        <input
                          className="input w-full"
                          value={field.optionsText ?? ''}
                          onChange={(e) => updateCheckoutInput(field._id, { optionsText: e.target.value })}
                          placeholder="Value1, Value2 or Label:Value"
                        />
                        <p className="text-xs text-muted mt-1">
                          Use comma-separated values. For custom labels, use Label:Value.
                        </p>
                      </div>
                    )}

                    <div className="grid md:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required === true}
                          onChange={(e) => updateCheckoutInput(field._id, { required: e.target.checked })}
                        />
                        <span>Required</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.hidden === true}
                          onChange={(e) => updateCheckoutInput(field._id, { hidden: e.target.checked })}
                        />
                        <span>Hidden</span>
                      </label>

                      <div>
                        <label className="block text-sm font-medium">Google Form Entry ID</label>
                        <input
                          className="input w-full"
                          value={field.googleFormEntryId ?? ''}
                          onChange={(e) => updateCheckoutInput(field._id, { googleFormEntryId: e.target.value })}
                          placeholder="entry.123456"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="btn btn-ghost text-red-600" onClick={() => removeCheckoutInput(field._id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Media picker overlay */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[13000] bg-black/60 flex items-center justify-center p-4">
          <div className="card admin-card card-solid p-4 w-full max-w-2xl max-h-[80vh] overflow-auto relative">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Pick an image</span>
              <button className="btn btn-ghost" onClick={handleCancelPick}>Cancel</button>
            </div>
            <MediaPicker prefix={`configs/${siteId}/assets/`} onPick={handlePick} />
          </div>
        </div>
      )}
    </>
  );
}
