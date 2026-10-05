'use client';
import type { SchedulingSection } from '@/types/site';
import AnimatedSection from '@/components/AnimatedSection';

export function Scheduling({ title = 'Book a call', body, calendlyUrl }: SchedulingSection) {
  const embed = `${calendlyUrl}?hide_landing_page_details=1&hide_gdpr_banner=1`;
  return (
    <AnimatedSection className="section">
      <div className="mx-auto max-w-3xl text-center">
        <h3 className="text-3xl font-semibold mb-3">{title}</h3>
        {body && <p className="text-muted mb-6">{body}</p>}
        <div className="overflow-hidden rounded-[24px] shadow-xl">
          <iframe className="w-full min-h-[32rem]" src={embed} />
        </div>
      </div>

    </AnimatedSection>
  );
}
