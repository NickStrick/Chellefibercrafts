// src/components/ThemeSwitcher.tsx
'use client';
import { useSite } from '@/context/SiteContext';

export function ThemeSwitcher() {
  const { setStyle } = useSite();
  const presets = ['ocean','sunset','forest','slate','festival','candy','neon', 'grove'] as const;

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 bg-[var(--bg)] p-2 rounded-full z-50">
      {(presets).map(p => (
        <button
          key={p}
          className="btn btn-ghost"
          onClick={() => setStyle({ preset: p })}
        >
          {p}
        </button>
      ))}
      {/* <button
        className="btn btn-primary"
        onClick={() => setStyle({ primary: '#7c3aed' })}
      >
        Purple
      </button> */}
    </div>
  );
}
