'use client';

import { useEffect, useState } from 'react';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const hasAKey = e.code === 'KeyA' || `${e.key}`?.toLowerCase() === 'a';
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      const ctrlAndMeta = e.ctrlKey && e.metaKey;
      const altOrShift = e.altKey || e.shiftKey;
      const isToggle = hasAKey && (ctrlAndMeta || (ctrlOrMeta && altOrShift));
      if (isToggle) setEnabled(v => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!enabled) return null;
  return <>{children}</>;
}
