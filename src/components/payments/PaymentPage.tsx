// src/components/payments/PaymentPage.tsx
'use client';

import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import PaymentForm from './PaymentForm';
import DriverTipStep from './DriverTipStep';
import { X, Plus, Trash2, CheckCircle, Check, ArrowBigLeft } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { CheckoutInput, GoogleFormOptions, PromoCode } from '@/types/site';
import { useSite } from '@/context/SiteContext';

function formatPrice(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

export default function PaymentPage({
  token,
  checkoutInputs: checkoutInputsProp,
  googleFormUrl: googleFormUrlProp,
  googleFormOptions: googleFormOptionsProp,
  paymentType: paymentTypeProp,
  externalPaymentUrl: externalPaymentUrlProp,
  supportEmail: supportEmailProp,
  supportPhone: supportPhoneProp,
  taxes: taxesProp,
  delivery: deliveryProp,
}: {
  token?: string;
  checkoutInputs?: CheckoutInput[];
  googleFormUrl?: string;
  googleFormOptions?: GoogleFormOptions;
  paymentType?: 'converge' | 'clover' | 'externalLink';
  externalPaymentUrl?: string;
  supportEmail?: string;
  supportPhone?: { label: string; href: string };
  taxes?: {
    enabled?: boolean;
    ratePercent?: number;
    taxShipping?: boolean;
    defaultProductTaxable?: boolean;
  };
  delivery?: {
    enabled?: boolean;
    appsScriptUrl?: string;
    type?: 'flat' | 'uber' | 'doordash';
    flatFeeCents?: number;
    mode?: 'pickup' | 'delivery' | 'both';
    driverTipEnabled?: boolean;
    addressCapture?: {
      enabled?: boolean;
      required?: boolean;
      method?: 'googleForm' | 's3';
      googleFormEntryId?: string;
      s3Prefix?: string;
    };
  };
}) {
  const { config } = useSite();
  const settingsPayments = config?.settings?.payments;
  const settingsGeneral = (config?.settings?.general ?? {}) as Record<string, unknown>;
  const businessDisplayName =
    (typeof settingsGeneral.businessDisplayName === 'string' ? settingsGeneral.businessDisplayName : '').trim() ||
    (config?.meta?.title ?? '').trim() ||
    (process.env.NEXT_PUBLIC_SITE_ID ?? '').trim();
  const businessNotificationEmail =
    (typeof settingsGeneral.businessNotificationEmail === 'string'
      ? settingsGeneral.businessNotificationEmail
      : '').trim() ||
    (settingsPayments?.supportEmail ?? '').trim();
  const checkoutInputs = checkoutInputsProp ?? settingsPayments?.checkoutInputs;
  const googleFormUrl = googleFormUrlProp ?? settingsPayments?.googleFormUrl;
  const googleFormOptions = googleFormOptionsProp ?? settingsPayments?.googleFormOptions;
  const googleFormSubmitBeforePayment =
    settingsPayments?.googleFormSubmitBeforePayment === true;
  const paymentType = paymentTypeProp ?? settingsPayments?.paymentType ?? 'converge';
  const externalPaymentUrl = externalPaymentUrlProp ?? settingsPayments?.externalPaymentUrl;
  const supportEmail = supportEmailProp ?? settingsPayments?.supportEmail;
  const supportPhone = supportPhoneProp ?? settingsPayments?.supportPhone;
  const taxes = taxesProp ?? settingsPayments?.taxes;
  const delivery = deliveryProp ?? settingsPayments?.delivery;
  const { items, totalCents, currency, isCheckoutOpen, closeCheckout, addItem, removeItem } = useCart();
  const [convergeToken, setConvergeToken] = useState('');
  const [convergeTokenStatus, setConvergeTokenStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const cloverToken = process.env.NEXT_PUBLIC_CLOVER_TOKEN ?? '';
  const convergeScriptUrl = process.env.NEXT_PUBLIC_CONVERGE_IFRAME_URL ?? '';
  const cloverScriptUrl = process.env.NEXT_PUBLIC_CLOVER_IFRAME_URL ?? '';
  const paymentToken = paymentType === 'clover' ? cloverToken : convergeToken;
  const paymentScriptUrl = paymentType === 'clover' ? cloverScriptUrl : convergeScriptUrl;
  const missingPaymentConfig =
    paymentType !== 'externalLink' && (!paymentScriptUrl || (paymentType === 'clover' && !paymentToken));
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(true);
  const [googleFormSubmitted, setGoogleFormSubmitted] = useState(false);
  const [orderSaved, setOrderSaved] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const orderIdRef = useRef<string>(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const emailField: CheckoutInput = {
    id: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    placeholder: 'you@example.com',
  };
  const effectiveCheckoutInputs = [
    emailField,
    ...(checkoutInputs ?? []).filter((field) => field.id !== 'email' && !field.hidden),
  ];
  const hasDetailsStep = effectiveCheckoutInputs.length > 0;
  const [stepIndex, setStepIndex] = useState(0);
  const [tipInput, setTipInput] = useState('');

  const taxableSubtotalCents = items.reduce((sum, item) => {
    const taxable = typeof item.taxable === 'boolean' ? item.taxable : taxes?.defaultProductTaxable === true;
    return taxable ? sum + item.price * item.quantity : sum;
  }, 0);
  const taxRate = Math.max(0, Number(taxes?.ratePercent ?? 0));
  const deliveryMode = delivery?.mode ?? 'both';
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>(
    deliveryMode === 'delivery' ? 'delivery' : 'pickup'
  );
  useEffect(() => {
    if (deliveryMode === 'pickup') setFulfillment('pickup');
    if (deliveryMode === 'delivery') setFulfillment('delivery');
  }, [deliveryMode]);

  const showTipStep = delivery?.driverTipEnabled === true && fulfillment === 'delivery';
  const steps = ([
    hasDetailsStep ? { key: 'details', label: 'Details' } : null,
    showTipStep ? { key: 'tip', label: 'Tip' } : null,
    { key: 'payment', label: 'Payment' },
  ].filter(Boolean) as Array<{ key: 'details' | 'tip' | 'payment'; label: string }>);

  useEffect(() => {
    if (stepIndex >= steps.length) {
      setStepIndex(Math.max(0, steps.length - 1));
    }
  }, [stepIndex, steps.length]);

  const addressCaptureEnabled = delivery?.addressCapture?.enabled === true;
  const addressRequired = delivery?.addressCapture?.required !== false;
  const needsDeliveryAddress =
    delivery?.enabled && addressCaptureEnabled && fulfillment === 'delivery';
  const missingDeliveryAddress =
    needsDeliveryAddress &&
    (deliveryAddress.trim().length === 0 || !deliveryConfirmed) &&
    addressRequired;
  const requiredFields = effectiveCheckoutInputs.filter((f) => f.required);
  if (addressRequired && needsDeliveryAddress) {
    requiredFields.push({ id: 'deliveryAddress', required: true } as CheckoutInput);
  }
  const missingRequired = requiredFields.some((f) => {
    if (f.id === 'deliveryAddress') {
      return deliveryAddress.trim().length === 0 || !deliveryConfirmed;
    }
    const value = (customValues[f.id] ?? '').trim();
    return value.length === 0;
  });
  const deliveryFeeCents =
    delivery?.enabled &&
    deliveryMode !== 'pickup' &&
    fulfillment === 'delivery' &&
    delivery?.type === 'flat'
      ? Math.max(0, Number(delivery.flatFeeCents ?? 0))
      : 0;
  const tipCents = showTipStep ? Math.max(0, Math.round((parseFloat(tipInput) || 0) * 100)) : 0;
  const taxBaseCents = taxableSubtotalCents + (taxes?.taxShipping ? deliveryFeeCents : 0);
  const taxCents = taxes?.enabled ? Math.round(taxBaseCents * (taxRate / 100)) : 0;
  const promoCodes = settingsPayments?.promoCodes ?? [];
  const discountCents = appliedPromo
    ? appliedPromo.type === 'percentage'
      ? Math.round(totalCents * (appliedPromo.value / 100))
      : Math.min(Math.round(appliedPromo.value * 100), totalCents)
    : 0;
  const totalWithFeesCents = totalCents + taxCents + deliveryFeeCents + tipCents - discountCents;

  useEffect(() => {
    if (paymentType !== 'converge') return;
    if (!isCheckoutOpen) return;

    // If the parent supplied a token explicitly, trust it (e.g. server-rendered checkout).
    if (token) {
      setConvergeToken(token);
      setConvergeTokenStatus('ready');
      return;
    }

    // Dev fallback (older behavior) if you manually set a token.
    const envToken = process.env.NEXT_PUBLIC_CONVERGE_TOKEN ?? '';
    if (envToken) {
      setConvergeToken(envToken);
      setConvergeTokenStatus('ready');
      return;
    }

    let cancelled = false;
    (async () => {
      setConvergeTokenStatus('loading');
      try {
        const res = await fetch('/api/payments/converge/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountCents: totalWithFeesCents, currency }),
        });
        if (!res.ok) {
          if (!cancelled) setConvergeTokenStatus('error');
          return;
        }
        const data = (await res.json()) as { token?: string };
        if (!cancelled && data?.token) {
          setConvergeToken(data.token);
          setConvergeTokenStatus('ready');
        } else if (!cancelled) {
          setConvergeTokenStatus('error');
        }
      } catch {
        if (!cancelled) setConvergeTokenStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currency, isCheckoutOpen, paymentType, token, totalWithFeesCents]);

  const submitDeliveryAddress = async () => {
    if (!needsDeliveryAddress) return;
    const method = delivery?.addressCapture?.method ?? 'googleForm';
    if (method !== 's3') return;

    const payload = {
      address: deliveryAddress.trim(),
      confirmed: deliveryConfirmed,
      fulfillment,
      siteId: process.env.NEXT_PUBLIC_SITE_ID ?? '',
      s3Prefix: delivery?.addressCapture?.s3Prefix ?? '',
    };

    await fetch('/api/orders/delivery-address', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  const submitCloverPayment = async (sourceToken: string) => {
    const payload = {
      amount: totalWithFeesCents,
      currency,
      source: sourceToken,
      items,
      customer: customValues,
    };

    const res = await fetch('/api/payments/clover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let message = 'Clover payment failed.';
      try {
        const data = await res.json();
        if (data?.error) message = data.error;
      } catch {
        // ignore json parsing failures
      }
      throw new Error(message);
    }

    setPurchaseComplete(true);
  };

  const submitToGoogleForm = async () => {
    if (!googleFormUrl) return;

    const formData = new FormData();
  const fields = effectiveCheckoutInputs.filter((f) => f.googleFormEntryId) ?? [];
    fields.forEach((f) => {
      const value = customValues[f.id];
      if (typeof value === 'string' && value.length > 0) {
        formData.append(f.googleFormEntryId as string, value);
      }
    });

    if (needsDeliveryAddress && delivery?.addressCapture?.method === 'googleForm') {
      const entryId = delivery?.addressCapture?.googleFormEntryId;
      if (entryId) {
        formData.append(entryId, deliveryAddress.trim());
      }
    }

    if (googleFormOptions?.addItemToGForm) {
      if (googleFormOptions.itemsEntryId) {
        const itemsPayload = items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          currency: item.currency ?? currency,
          quantity: item.quantity,
        }));
        formData.append(googleFormOptions.itemsEntryId, JSON.stringify(itemsPayload));
      }
      if (googleFormOptions.totalEntryId) {
        formData.append(googleFormOptions.totalEntryId, (totalWithFeesCents / 100).toFixed(2));
      }
    }

    try {
      await fetch(googleFormUrl, { method: 'POST', mode: 'no-cors', body: formData });
    } catch {
      // no-op: form submission is best-effort in no-cors mode
    }
    console.log('save order')
    await saveOrderToS3();
    setGoogleFormSubmitted(true);
  };

  const saveOrderToS3 = async () => {
    if (orderSaved) return;
    const customerEmail =
      (customValues.email as string) ||
      (customValues.customerEmail as string) ||
      '';
    if (!customerEmail.trim()) {
      console.warn('[orders] missing customer email; skipping order save');
      return;
    }

    const customerName =
      (customValues['customer-name'] as string) ||
      (customValues.name as string) ||
      (customValues.fullName as string) ||
      (customValues.customerName as string) ||
      '';

    const payload = {
      businessId: process.env.NEXT_PUBLIC_SITE_ID ?? '',
      customerEmail,
      customerName: customerName || undefined,
      businessDisplayName: businessDisplayName || undefined,
      businessNotificationEmail: businessNotificationEmail || undefined,
      items: items.map((item) => ({
        ...item,
        price: Number((item.price / 100).toFixed(2)),
        total: Number(((item.price * item.quantity) / 100).toFixed(2)),
      })),
      total: Number((totalWithFeesCents / 100).toFixed(2)),
      currency,
      orderId: orderIdRef.current,
      fulfillment,
      deliveryAddress: deliveryAddress.trim() || undefined,
      taxes: {
        ...(taxes ?? {}),
        subtotalCents: totalCents,
        taxCents,
        totalCents: totalWithFeesCents,
      },
      delivery: {
        enabled: delivery?.enabled ?? false,
        type: delivery?.type ?? 'flat',
        mode: deliveryMode,
        fulfillment,
        address: deliveryAddress.trim(),
        addressConfirmed: deliveryConfirmed === true,
        flatFeeCents: deliveryFeeCents,
      },
      tip: {
        enabled: showTipStep,
        amountCents: tipCents,
      },
      customer: customValues,
      checkoutInputs: effectiveCheckoutInputs ?? [],
      payment: {
        type: paymentType,
        externalPaymentUrl: externalPaymentUrl ?? '',
      },
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setOrderSaved(true);
      }
    } catch {
      // best-effort fallback; avoid blocking checkout
    }
  };

  const submitCheckoutSideEffects = async () => {
    // await saveOrderToS3();
    if (!googleFormSubmitBeforePayment || !googleFormSubmitted) {
      await submitToGoogleForm();
    }
    await submitDeliveryAddress();
  };

  const applyPromo = () => {
    const code = promoInput.trim().toLowerCase();
    const match = promoCodes.find((p) => p.promoId.toLowerCase() === code);
    if (match) {
      setAppliedPromo(match);
      setPromoError(null);
    } else {
      setPromoError('Invalid promo code.');
      setAppliedPromo(null);
    }
  };

  if (!isCheckoutOpen) return null;
  console.log('PaymentPage config:', { paymentType, paymentToken, paymentScriptUrl });
  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {purchaseComplete && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 rounded-3xl bg-white p-8 shadow-2xl text-center">
            <button
              onClick={() => {
                setPurchaseComplete(false);
                closeCheckout();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
              aria-label="Close purchase complete"
            >
              <X size={20} />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle size={28} className="text-emerald-600" />
            </div>
            <h3 className="mt-4 text-2xl font-bold">Purchase complete</h3>
            <p className="mt-2 text-sm text-gray-600">
              Thanks for your order! If you need help with your purchase, reach us below.
            </p>
            <div className="mt-5 space-y-2 text-sm">
              {supportEmail && (
                <div>
                  Email:{' '}
                  <a className="text-emerald-700 hover:text-emerald-800 underline" href={`mailto:${supportEmail}`}>
                    {supportEmail}
                  </a>
                </div>
              )}
              {supportPhone?.label && supportPhone?.href && (
                <div>
                  Phone:{' '}
                  <a className="text-emerald-700 hover:text-emerald-800 underline" href={supportPhone.href}>
                    {supportPhone.label}
                  </a>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setPurchaseComplete(false);
                closeCheckout();
              }}
              className="mt-6 w-full rounded-[999px] bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      <div className="relative w-full max-w-5xl mx-4 bg-white rounded-3xl shadow-2xl p-1 md:p-10 max-h-[100vh] overflow-y-auto checkout-container">
        <button
          onClick={closeCheckout}
          className="absolute top-4 right-4 text-gray-400 hover:text-black"
          aria-label="Close checkout"
        >
          <X size={24} />
        </button>

        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-gray-100 p-5 md:p-6 max-w-[100%]">
            <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
            {items.length === 0 ? (
              <p className="text-gray-600">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-[100px] w-[100px] rounded-md object-cover border border-gray-100"
                        />
                      )}
                      <span className="">
                        {item.name} {item.quantity > 1 && <span className="opacity-70">x{item.quantity}</span>}
                      </span>
                    </div>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity, item.currency ?? currency)}
                    </span>
                    <button
                      onClick={() => addItem({ id: item.id, name: item.name, price: item.price, currency: item.currency, imageUrl: item.imageUrl, taxable: item.taxable })}
                      className="text-gray-400 hover:text-emerald-600 transition-colors"
                      aria-label={`Add one more ${item.name}`}
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {promoCodes.length > 0 && (
                  <div className="pt-2">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between text-sm bg-emerald-50 rounded-xl px-3 py-2">
                        <span className="text-emerald-700 font-medium">&ldquo;{appliedPromo.promoId}&rdquo; applied</span>
                        <button
                          onClick={() => { setAppliedPromo(null); setPromoInput(''); setPromoError(null); }}
                          className="text-gray-400 hover:text-red-500 text-xs ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoInput}
                            onChange={(e) => { setPromoInput(e.target.value); setPromoError(null); }}
                            placeholder="Promo code"
                            className="flex-1 p-2 text-sm border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            onKeyDown={(e) => e.key === 'Enter' && applyPromo()}
                          />
                          <button
                            onClick={applyPromo}
                            className="px-3 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && <p className="text-xs text-red-500 mt-1">{promoError}</p>}
                      </>
                    )}
                  </div>
                )}
                <div className="border-t pt-3 space-y-2 text-sm">
                  {taxes?.enabled || delivery?.enabled ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(totalCents, currency)}</span>
                    </div>
                  ) : null}
                  {taxes?.enabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">{formatPrice(taxCents, currency)}</span>
                    </div>
                  )}
                  {delivery?.enabled && delivery?.type === 'flat' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span className="font-medium">{formatPrice(deliveryFeeCents, currency)}</span>
                    </div>
                  )}
                  {showTipStep && tipCents > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Driver Tip</span>
                      <span className="font-medium">{formatPrice(tipCents, currency)}</span>
                    </div>
                  )}
                  {appliedPromo && discountCents > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Discount ({appliedPromo.type === 'percentage'
                          ? `${appliedPromo.value}%`
                          : formatPrice(appliedPromo.value * 100, currency)})
                      </span>
                      <span>-{formatPrice(discountCents, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold pt-2">
                    <span>Total</span>
                    <span>{formatPrice(totalWithFeesCents, currency)}</span>
                  </div>
                </div>
              </div>
            )}
            
          </section>

          <section className="max-w-[100%]" id="checkout-right-section">
            {steps[stepIndex]?.key === 'details' && hasDetailsStep && (
              <div className="mb-8 rounded-2xl border border-gray-100 p-6" id="checkout-details-form">
                <h2 className="text-2xl font-bold mb-4">Order Details</h2>
                {delivery?.enabled && deliveryMode === 'both' && (
                  <div className="mb-4 rounded-xl border border-gray-100 p-4">
                    <div className="text-sm font-semibold mb-2">Fulfillment</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillment('pickup')}
                        className={`relative flex-1 border px-4 py-2 text-sm font-medium ${
                          fulfillment === 'pickup'
                            ? 'border-emerald-700 text-emerald-900 bg-emerald-100 rounded-[999px]'
                            : 'btn-small text-nowrap btn-gradient'
                        }`}
                      >
                        
                        Pickup
                        {fulfillment === 'pickup' && <Check size={22} className="text-emerald-600 payment-check" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillment('delivery')}
                        className={`relative flex-1  border px-4 py-2 text-sm font-medium ${
                          fulfillment === 'delivery'
                            ? 'border-emerald-700 text-emerald-900 bg-emerald-100 rounded-[999px]' 
                            : 'btn-small text-nowrap btn-gradient'
                        }`}
                      >
                        
                        Delivery
                        {fulfillment === 'delivery' && <Check size={22} className="text-emerald-600 payment-check" />}
                      </button>
                    </div>
                  </div>
                )}
                {delivery?.enabled && fulfillment === 'delivery' && addressCaptureEnabled && (
                  <div className="mb-4 rounded-xl border border-gray-100 p-4">
                    <div className="text-sm font-semibold mb-2">Delivery Address{addressRequired?<span className="text-red-500"> *</span>:null}</div>
                    <input
                      type="text"
                      className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Enter delivery address"
                      autoComplete="street-address"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                )}
                <div className="grid gap-4">
                  {effectiveCheckoutInputs.map((field) => {
                    const commonProps = {
                      id: field.id,
                      name: field.id,
                      required: field.required,
                      placeholder: field.placeholder,
                      className: "w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all",
                      value: customValues[field.id] ?? '',
                      onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
                        setCustomValues((prev) => ({ ...prev, [field.id]: e.target.value })),
                    };

                    return (
                      <label key={field.id} className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}{field.required && <span className="text-red-500"> *</span>}
                        </span>
                        {field.description && (
                          <span className="block text-xs text-gray-500 mb-2">{field.description}</span>
                        )}
                        {field.type === 'textarea' ? (
                          <textarea {...commonProps} rows={4} />
                        ) : field.type === 'select' ? (
                          <select {...commonProps}>
                            <option value="">Select an option</option>
                            {field.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input {...commonProps} type={field.type} />
                        )}
                      </label>
                    );
                  })}
                </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (googleFormSubmitBeforePayment && !googleFormSubmitted) {
                        await submitToGoogleForm();
                      }
                      setStepIndex(Math.min(stepIndex + 1, steps.length - 1));
                    }}
                    disabled={missingRequired || missingDeliveryAddress}
                    aria-disabled={missingRequired || missingDeliveryAddress}
                    className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 font-bold shadow-lg shadow-emerald-200 transition-all rounded-[999px]"
                  >
                    {steps[stepIndex + 1]?.key === 'payment' ? 'Continue to Payment' : 'Continue'}
                  </button>
              </div>
            )}
            {steps[stepIndex]?.key === 'tip' && (
              <DriverTipStep
                value={tipInput}
                currencySymbol={currency === 'USD' ? '$' : ''}
                onChange={setTipInput}
                onBack={() => setStepIndex(Math.max(0, stepIndex - 1))}
                onContinue={() => setStepIndex(Math.min(stepIndex + 1, steps.length - 1))}
              />
            )}
            {steps[stepIndex]?.key === 'payment' && (
              <div id="checkout-payment-section">
            <h2 className="text-2xl font-bold mb-4 ml-4 md:ml-1">Payment</h2>
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                className="flex justify-center items-center mb-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
              >
                <ArrowBigLeft size={28} className="text-emerald-700" />
                <span className="ml-1 flex justify-center items-center">Back to {steps[stepIndex - 1]?.label.toLowerCase()}</span>
              </button>
            )}
            {paymentType === 'converge' && convergeTokenStatus === 'loading' && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Loading payment form...
              </div>
            )}
            {paymentType === 'converge' && convergeTokenStatus === 'error' && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                Could not initialize Converge checkout. Check `CONVERGE_ACCOUNT_ID` (or `CONVERGE_MERCHANT_ID`), `CONVERGE_USER_ID`, `CONVERGE_PIN`, and `NEXT_PUBLIC_CONVERGE_IFRAME_URL`.
              </div>
            )}
            {missingPaymentConfig && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Payment configuration is missing. Set the {paymentType === 'clover'
                  ? 'NEXT_PUBLIC_CLOVER_TOKEN and NEXT_PUBLIC_CLOVER_IFRAME_URL'
                  : 'CONVERGE_ACCOUNT_ID (or CONVERGE_MERCHANT_ID) / CONVERGE_USER_ID / CONVERGE_PIN (server) and NEXT_PUBLIC_CONVERGE_IFRAME_URL'} env vars.
              </div>
            )}
            {paymentType === 'externalLink' ? (
              <button
                type="button"
                onClick={async () => {
                  await submitCheckoutSideEffects();
                  if (externalPaymentUrl) {
                    window.open(externalPaymentUrl, '_blank', 'noopener,noreferrer');
                  }
                }}
                disabled={missingRequired || missingDeliveryAddress}
                aria-disabled={missingRequired || missingDeliveryAddress}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-4 font-bold shadow-lg shadow-emerald-200 transition-all rounded-[999px]"
              >
                Continue to Payment
              </button>
            ) : !missingPaymentConfig && (paymentType !== 'converge' || convergeTokenStatus === 'ready') ? (
              <PaymentForm
                token={paymentToken}
                paymentType={paymentType}
                onPay={
                  paymentType === 'converge'
                    ? async () => {
                        await submitCheckoutSideEffects();
                        setPurchaseComplete(true);
                      }
                    : submitCheckoutSideEffects
                }
                onCloverToken={paymentType === 'clover' ? submitCloverPayment : undefined}
                disabled={missingRequired || missingDeliveryAddress}
              />
            ) : null}
              </div>
            )}
          </section>
        </div>  
      </div>
    </div>
  );
}
