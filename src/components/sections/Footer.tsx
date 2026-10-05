'use client';
import type { FooterSection } from '@/types/site';
import Link from 'next/link';
import AnimatedSection from '@/components/AnimatedSection';

function normalizeNavHref(href: string) {
  if (!href || href === '' || href === '/') {
    return { linkHref: '/', hashHref: '#top' };
  }
  if (href.startsWith('#')) {
    return { linkHref: `/${href}`, hashHref: href };
  }
  if (href.startsWith('/#')) {
    return { linkHref: href, hashHref: href.slice(1) };
  }
  return { linkHref: href, hashHref: href };
}


export function Footer({ columns = [], legal }: FooterSection) {
  return (
    <AnimatedSection className="section bg-gradient-2">
      <div className="mx-auto max-w-6xl grid md:grid-cols-4 gap-8">
        {columns.map((c, i) => (
          <div key={i}>
            {c.title ? <div className="font-semibold mb-3">{c.title}</div> : null}
            <ul className="space-y-2 text-muted">
              {c.links.map((l,i) => (
                <li key={l.label+i}>
                  <Link className="hover:text-fg transition-colors" href={normalizeNavHref(l.href).linkHref}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {legal ? <p className="text-center text-sm text-muted mt-8">{legal}</p> : null}
    </AnimatedSection>
  );
}
