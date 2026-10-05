// src/app/api/site/route.ts  (mock data for now)
import { NextResponse } from 'next/server';
import type { SiteConfig } from '@/types/site';

export async function GET(): Promise<NextResponse<SiteConfig>> {
  const data: SiteConfig = {
    theme: { preset: 'ocean', radius: 'xl' },
    meta: { title: 'Site-Crafter Demo', description: 'Composable pages' },
    settings: { general: {}, payments: {} },
    sections: [
      { id: 'hdr', type: 'header', logoText: 'Site-Crafter', links: [{ label:'Features', href:'#' }], cta: { label:'Get Started', href:'#cta' } },
      { id: 'hero', type: 'hero', eyebrow: 'Freelancer-ready', title: 'Build client sites in minutes', subtitle: 'Productize 80–90% of the work.', primaryCta: { label:'See pricing', href:'#' }, secondaryCta: { label:'Book a call', href:'#sched' } },
      { id: 'feat', type: 'features', title: 'What you get', items: [
        { title:'Composable Sections', body:'Header, hero, features, CTA, contact, etc.' },
        { title:'Live Theming', body:'4 presets + any color override via API.' },
        { title:'Integrations', body:'Calendly, Google Forms, and more.' },
      ] },
      { id: 'cta1', type: 'cta', title: 'Ready to ship faster?', body: 'Use presets, tweak colors, publish.', cta: { label:'Start now', href:'#' } },
      { id: 'nl', type: 'newsletter', title:'Join updates', googleFormEmbedUrl:'https://docs.google.com/forms/d/e/1FAIpQLSd-EXAMPLE/viewform?embedded=true' },
      { id: 'contact', type:'contact', email:'hello@example.com', address:'123 Main St, City' },
      { id: 'sched', type:'scheduling', title:'Book a demo', calendlyUrl:'https://calendly.com/acme/demo' },
      { id: 'ftr', type:'footer', columns:[{ links:[{ label:'Privacy', href:'#' }, { label:'Terms', href:'#' }] }], legal:'© 2025 Site-Crafter' },
    ],
  };
  return NextResponse.json(data);
}
