'use client';
import type { CTASection } from '@/types/site';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';

export function CTA({ id, title, body, cta }: CTASection) {
  return (
    <section id={id} className="relative">
      {/* top wave */}
      <div className="text-[var(--bg-2)] top-wave" aria-hidden>
        <svg viewBox="0 0 1440 140" className="w-full h-[70px]" preserveAspectRatio="none">
          <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="section section-ink">
        <AnimatedSection className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-1)]">{title}</h2>
          {body ? <p className="text-muted mb-7 mt-3">{body}</p> : null}
          <Link href={cta.href} className="btn-gradient">
            {cta.label}
          </Link>
        </AnimatedSection>
      </div>

      {/* bottom wave (back to page bg) */}
      <div className="text-[var(--bg-2)] rotate-180 bottom-wave" aria-hidden>
        <svg viewBox="0 0 1440 140" className="w-full h-[70px]" preserveAspectRatio="none">
          <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
