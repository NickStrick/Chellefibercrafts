// src/sections/Disclaimer.tsx
import type { DisclaimerSection } from '@/types/site';

export function Disclaimer({ id, title, body, enabled = true }: DisclaimerSection) {
  if (!enabled) return null;
  return (
    <section id={id} aria-label="Disclaimer" className="py-6 bg-gradient-1">
      <div className="container mx-auto text-sm text-[var(--fg)]/80">
        {title && <h3 className="font-semibold mb-2">{title}</h3>}
        <p>{body}</p>
      </div>
    </section>
  );
}
