'use client';

import { useState } from 'react';

// Plain price inputs that derive their displayed string from `(cents/100).toFixed(2)`
// on every keystroke fight the user mid-type: after typing "3" the field immediately
// reformats to "3.00", so typing "30" produces "3.000"/garbage instead. This keeps the
// raw text the user is typing as local state and only reformats on blur.
export default function CurrencyInput({
  cents,
  onChange,
  placeholder = '0.00',
  className = 'input w-full',
}: {
  cents: number | undefined;
  onChange: (cents: number) => void;
  placeholder?: string;
  className?: string;
}) {
  const [text, setText] = useState(() => (cents && cents > 0 ? (cents / 100).toFixed(2) : ''));

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (!/^\d*\.?\d{0,2}$/.test(raw)) return; // ignore keystrokes that aren't a valid partial amount
        setText(raw);
        onChange(Math.round((Number(raw) || 0) * 100));
      }}
      onBlur={() => {
        const n = Number(text) || 0;
        setText(n > 0 ? n.toFixed(2) : '');
      }}
    />
  );
}
