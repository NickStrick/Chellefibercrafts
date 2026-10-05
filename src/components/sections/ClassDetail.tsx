'use client';

import { useMemo } from 'react';
import type { ClassDetailSection } from '@/types/site';
import { useSite } from '@/context/SiteContext';
import ClassDetailBody from './ClassDetailBody';
import { SeperatorWave } from '@/components/SeperatorWave';

export default function ClassDetail({
  id,
  classItemId,
  buyCtaFallback = 'Book Now',
  topWaveType,
  bottomWaveType,
}: ClassDetailSection) {
  const { config } = useSite();

  const classItem = useMemo(
    () => (config?.classes?.classItems ?? []).find((c) => c.id === classItemId) ?? null,
    [config?.classes?.classItems, classItemId]
  );

  if (!classItem) return null;

  return (
    <>
    <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
    <section id={id} className="section">
      <div className="mx-auto max-w-5xl px-4">
        <ClassDetailBody key={classItem.id} classItem={classItem} buyCtaFallback={buyCtaFallback} />
      </div>
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </>
  );
}
