// components/PaymentForm.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import Script from 'next/script';
import Cards, { Focused } from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';

export default function PaymentForm({
  token,
  paymentType = 'converge',
  onPay,
  onCloverToken,
  disabled,
}: {
  token: string;
  paymentType?: 'converge' | 'clover';
  onPay?: () => void | Promise<void>;
  onCloverToken?: (token: string) => void | Promise<void>;
  disabled?: boolean;
}) {
  const convergeScriptUrl = process.env.NEXT_PUBLIC_CONVERGE_IFRAME_URL ?? '';
  const cloverScriptUrl = process.env.NEXT_PUBLIC_CLOVER_IFRAME_URL ?? '';
  const cloverMerchantId = process.env.NEXT_PUBLIC_CLOVER_MERCHANT_ID ?? '';
  const scriptUrl = paymentType === 'converge' ? convergeScriptUrl : cloverScriptUrl;
  const missingConfig = !scriptUrl || !token;
  console.log('PaymentForm config:', { paymentType, scriptUrl, token });
  const cloverRef = useRef<any>(null);
  const convergeRef = useRef<any>(null);
  const convergeInitTokenRef = useRef<string>('');
  const convergeSubmitRef = useRef<{ resolve: () => void; reject: (err: unknown) => void } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    setScriptLoaded(false);
    if (paymentType === 'converge') {
      convergeInitTokenRef.current = '';
      convergeRef.current = null;
    }
  }, [paymentType, scriptUrl]);

  useEffect(() => {
    console.log('[Clover] Render', { paymentType, scriptUrl, tokenPresent: Boolean(token) });
    if (paymentType !== 'clover') return;
    const timer = setTimeout(() => {
      const hasClover = typeof (window as any)?.Clover !== 'undefined';
      const scriptEl = document.querySelector(`script[src="${scriptUrl}"]`);
      console.log('[Clover] Post-render check', {
        hasClover,
        scriptTagPresent: Boolean(scriptEl),
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [paymentType, scriptUrl, token]);
  const [state, setState] = useState({
    number: '', // We use these for the visual card preview only
    expiry: '',
    cvc: '',
    name: '',
    focus: '' as Focused,
  });

  const handleInputFocus = (evt: React.FocusEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, focus: evt.target.name as Focused }));
  };

  const initConvergeHostedFields = () => {
    if (!token) return;
    if (!scriptLoaded) return;
    if (convergeInitTokenRef.current === token) return;
    if (typeof window !== 'undefined' && (window as any).ConvergeEmbedded) {
      const converge = (window as any).ConvergeEmbedded({
        token: token,
        callback: (response: any) => {
          console.log('[Converge] Payment Response:', response);
          const ok =
            response?.ssl_result === '0' ||
            response?.ssl_result === 0 ||
            response?.result === '0' ||
            response?.result === 0 ||
            response?.approved === true;
          if (ok) {
            convergeSubmitRef.current?.resolve();
          } else {
            convergeSubmitRef.current?.reject(
              new Error(response?.ssl_result_message || response?.message || 'Converge payment declined.')
            );
          }
          convergeSubmitRef.current = null;
        },
        error: (err: any) => {
          console.error('[Converge] Payment Error:', err);
          convergeSubmitRef.current?.reject(err);
          convergeSubmitRef.current = null;
        },
      });
      convergeRef.current = converge;
      convergeInitTokenRef.current = token;

      converge.mount('#card-number', 'cardNumber');
      converge.mount('#card-expiry', 'cardExpiration');
      converge.mount('#card-cvv', 'cardCvv');
    }
  };

  const initCloverHostedFields = () => {
    if (!token) {
      console.warn('[Clover] Missing token, skipping init.');
      return;
    }
    if (typeof window !== 'undefined' && (window as any).Clover) {
      console.log('[Clover] SDK loaded, initializing elements...', {
        merchantIdPresent: Boolean(cloverMerchantId),
      });
      console.log('[Clover] Mount targets', {
        cardNumber: Boolean(document.getElementById('card-number')),
        cardExpiry: Boolean(document.getElementById('card-expiry')),
        cardCvv: Boolean(document.getElementById('card-cvv')),
      });
      const clover = cloverMerchantId
        ? new (window as any).Clover(token, { merchantId: cloverMerchantId })
        : new (window as any).Clover(token);
      const elements = clover.elements();
      cloverRef.current = clover;

      const styles = {
        base: {
          fontFamily: 'inherit',
          fontSize: '16px',
          color: '#111827',
          '::placeholder': { color: '#9CA3AF' },
        },
      };

      const cardNumber = elements.create('CARD_NUMBER', styles);
      const cardName = elements.create('CARD_NAME', styles);
      const cardExpiry = elements.create('CARD_DATE', styles);
      const cardCvv = elements.create('CARD_CVV', styles);
      const cardPostal = elements.create('CARD_POSTAL_CODE', styles);
      const cardStreet = elements.create('CARD_STREET_ADDRESS', styles);

      cardNumber.mount('#card-number');
      cardName.mount('#card-name');
      cardExpiry.mount('#card-expiry');
      cardCvv.mount('#card-cvv');
      cardPostal.mount('#card-postal-code');
      cardStreet.mount('#card-street-address');
      console.log('[Clover] Elements mounted.');

      console.log('[Clover] Element instances', {
        cardNumberType: typeof cardNumber,
        cardNameType: typeof cardName,
        cardExpiryType: typeof cardExpiry,
        cardCvvType: typeof cardCvv,
        cardPostalType: typeof cardPostal,
        cardStreetType: typeof cardStreet,
      });
    }
  };

  const handleSubmit = async () => {
    if (disabled || missingConfig) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (paymentType === 'clover') {
        if (!cloverRef.current) {
          console.error('[Clover] SDK not initialized.');
          throw new Error('Clover SDK not initialized.');
        }

        if (onPay) {
          console.log('[Clover] Running onPay (Google Form submit)...');
          await onPay();
          console.log('[Clover] onPay finished.');
        }

        console.log('[Clover] Starting tokenization...', {
          hasCreateToken: typeof cloverRef.current.createToken === 'function',
        });
        let tokenPromise: Promise<any> | null = null;
        try {
          const returned = cloverRef.current.createToken();
          console.log('[Clover] createToken returned', returned);
          if (returned && typeof returned.then === 'function') {
            tokenPromise = returned;
            returned.then(
              (result: any) => console.log('[Clover] createToken resolved (log only)', result),
              (err: any) => console.log('[Clover] createToken rejected (log only)', err),
            );
          }
        } catch (err) {
          console.log('[Clover] createToken threw synchronously', err);
          throw err;
        }
        if (!tokenPromise) {
          throw new Error('Clover createToken did not return a promise.');
        }
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => {
            console.error('[Clover] Tokenization timed out.');
            reject(new Error('Clover tokenization timed out. Please try again.'));
          }, 15000),
        );
        const result = await Promise.race([tokenPromise, timeoutPromise]);
        console.log('[Clover] Tokenization result', result);
        if (result?.errors) {
          const message = Object.values(result.errors).join(' ');
          throw new Error(message || 'Card details are invalid.');
        }
        if (!result?.token) {
          throw new Error('No Clover token returned.');
        }
        if (onCloverToken) {
          console.log('[Clover] Calling onCloverToken...');
          await onCloverToken(result.token);
          console.log('[Clover] onCloverToken finished.');
        }
      } else {
        const converge = convergeRef.current;
        if (!converge) {
          throw new Error('Converge embedded fields are not initialized. Check token + script URL.');
        }

        const done = new Promise<void>((resolve, reject) => {
          convergeSubmitRef.current = { resolve, reject };
        });

        const submitFn =
          typeof converge.submit === 'function'
            ? converge.submit.bind(converge)
            : typeof converge.pay === 'function'
              ? converge.pay.bind(converge)
              : null;

        if (!submitFn) {
          throw new Error('Converge embedded fields library did not expose submit/pay. Check the Converge script URL.');
        }

        submitFn();
        await done;

        if (onPay) await onPay();
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Payment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (paymentType !== 'converge') return;
    initConvergeHostedFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentType, token, scriptLoaded]);

  return (
    <div className="max-w-lg mx-auto p-5 md:p-8 bg-white rounded-3xl shadow-xl border border-gray-100">
      {scriptUrl ? (
        paymentType === 'converge' ? (
          <Script
            src={scriptUrl}
            onLoad={() => {
              console.log('[Converge] Script loaded.');
              setScriptLoaded(true);
              initConvergeHostedFields();
            }}
            onError={(e) => console.error('[Converge] Script load error', e)}
          />
        ) : (
          <Script
            src={scriptUrl}
            onLoad={() => {
              console.log('[Clover] Script loaded.', { hasClover: typeof (window as any)?.Clover !== 'undefined' });
              setScriptLoaded(true);
              initCloverHostedFields();
            }}
            onError={(e) => console.error('[Clover] Script load error', e)}
          />
        )
      ) : null}

        {missingConfig && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Payment configuration is missing. Set the {paymentType === 'converge'
            ? 'CONVERGE_ACCOUNT_ID (or CONVERGE_MERCHANT_ID) / CONVERGE_USER_ID / CONVERGE_PIN (server) and NEXT_PUBLIC_CONVERGE_IFRAME_URL'
            : 'NEXT_PUBLIC_CLOVER_TOKEN and NEXT_PUBLIC_CLOVER_IFRAME_URL'} env vars.
          </div>
        )}
      {submitError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {submitError}
        </div>
      )}

      <div className="mb-8">
        <Cards
          number={state.number}
          expiry={state.expiry}
          cvc={state.cvc}
          name={state.name}
          focused={state.focus}
        />
      </div>

      <form className="space-y-4">
        {/* Cardholder Name (Clover element) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
          <div id="card-name" className="h-[50px] w-full p-3 border rounded-xl bg-white" />
        </div>

        {/* Card Number (Elavon Secure Iframe Container) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
          <div id="card-number" className="h-[50px] w-full p-3 border rounded-xl bg-white" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Expiry (Elavon Secure Iframe Container) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
            <div id="card-expiry" className="h-[50px] w-full p-3 border rounded-xl bg-white" />
          </div>

          {/* CVV (Elavon Secure Iframe Container) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <div id="card-cvv" className="h-[50px] w-full p-3 border rounded-xl bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <div id="card-postal-code" className="h-[50px] w-full p-3 border rounded-xl bg-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <div id="card-street-address" className="h-[50px] w-full p-3 border rounded-xl bg-white" />
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || missingConfig || isSubmitting}
          aria-disabled={disabled || missingConfig || isSubmitting}
          className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 transition-all"
        >
          {isSubmitting ? 'Processing…' : 'Place Your Order'}
        </button>
      </form>
    </div>
  );
}
// Key Integration Steps
// Styling the Iframe: You cannot use Tailwind on the content inside the iframe. You must pass a CSS object to the Elavon Hosted Fields initialization to match your site's fonts and colors.
// Card Preview Sync: Since the card number is inside an Elavon iframe, react-credit-cards-2 won't "see" the digits. To fix this, use Elavon's onChange event listeners to update your local state with "masked" digits (e.g., **** **** **** 1234).
// Endpoint: Ensure your Next.js Route Handlers are using the correct Converge Merchant Credentials.
