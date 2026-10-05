'use client';

import type { PageLinksSection } from '@/types/site';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';

const ALIGN_CLASS = {
  left: 'justify-start text-left',
  center: 'justify-center text-center',
  right: 'justify-end text-right',
} as const;

export default function PageLinks({ id, title, subtitle, items, style }: PageLinksSection) {
  const align = style?.align ?? 'center';

  return (
    <section id={id} className="section bg-app">
      <div className="container mx-auto px-4">
        {title && (
          <AnimatedSection>
            <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 ${ALIGN_CLASS[align]}`}>
              {title}
            </h2>
          </AnimatedSection>
        )}
        {subtitle && (
          <AnimatedSection>
            <p className={`text-muted mb-8 ${ALIGN_CLASS[align]}`}>{subtitle}</p>
          </AnimatedSection>
        )}

        <AnimatedSection delay={0.1}>
          <div className={`flex flex-wrap gap-4 ${ALIGN_CLASS[align]}`}>
            {items.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className={item.variant === 'inverted' ? 'btn-gradient-inverted' : 'btn-gradient'}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
