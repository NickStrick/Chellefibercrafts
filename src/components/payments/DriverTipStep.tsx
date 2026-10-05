// src/components/payments/DriverTipStep.tsx
'use client';

import { ArrowBigLeft } from 'lucide-react';

export default function DriverTipStep({
  value,
  currencySymbol = '$',
  onChange,
  onBack,
  onContinue,
}: {
  value: string;
  currencySymbol?: string;
  onChange: (value: string) => void;
  onBack?: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-gray-100 p-6" id="checkout-tip-form">
      <h2 className="text-2xl font-bold mb-4">Add a Tip</h2>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center mb-4 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <ArrowBigLeft size={28} className="text-emerald-700" />
          <span className="ml-1">Back</span>
        </button>
      )}
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">
          Tip for your delivery driver (optional)
        </span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {currencySymbol}
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 pl-7 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </label>
      <button
        type="button"
        onClick={onContinue}
        className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-4 font-bold shadow-lg shadow-emerald-200 transition-all rounded-[999px]"
      >
        Continue to Payment
      </button>
    </div>
  );
}
