import { Suspense } from 'react';
import SlugClientPage from './ClientPage';

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
        <main className="bg-app w-[100vw]">
          <div className="section w-[100vw]">
            <span className="loading-span w-[100vw]">Loading…</span>
          </div>
        </main>
      }
    >
      <SlugClientPage slug={slug} />
    </Suspense>
  );
}
