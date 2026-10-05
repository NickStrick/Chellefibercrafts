// Server Component by default — no 'use client'
import { Suspense } from 'react';
import ClientPage from './ClientPage';

export default function Page() {
  return (
    <Suspense fallback={<main className="bg-app w-[100vw]"><div className="section w-[100vw]"><span className='loading-span w-[100vw]'>Loading…</span></div></main>}>
      <ClientPage />
    </Suspense>
  );
}
