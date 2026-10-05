'use client';
export function SeparatorWave({ flip=false }: { flip?: boolean }) {
  return (
    <div className={`${flip ? 'rotate-180' : ''}`} aria-hidden>
      <svg viewBox="0 0 1440 140" className="w-full h-[64px]" preserveAspectRatio="none">
        <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z" fill="currentColor" />
      </svg>
    </div>
  );
}
