'use client';

import { useSite } from '@/context/SiteContext';
import { SectionRenderer } from '@/components/SectionRenderer';
import { getRenderablePageSections } from '@/lib/siteConfigSections';

export default function SlugClientPage({ slug }: { slug: string }) {
  const { config, isLoading } = useSite();

  if (isLoading || !config) {
    return (
      <main className="bg-app">
        <div className="section">Loading…</div>
      </main>
    );
  }

  const sections = getRenderablePageSections(config, slug);

  if (!sections) {
    return (
      <main className="bg-app">
        <div className="section">Page not found.</div>
      </main>
    );
  }

  return (
    <main className="bg-main">
      {sections.length ? (
        sections.map((s) => <SectionRenderer key={s.id ?? Math.random()} section={s} />)
      ) : (
        <div className="section">No sections configured.</div>
      )}
    </main>
  );
}
