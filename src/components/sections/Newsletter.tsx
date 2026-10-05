'use client';
import type { NewsletterSection } from '@/types/site';
import AnimatedSection from '@/components/AnimatedSection';

export function Newsletter({ title = 'Join the newsletter', body, googleFormEmbedUrl, id }: NewsletterSection) {
  return (
    <AnimatedSection  className="section">
      <div id={id} className="mx-auto max-w-3xl text-center">
        <h3 className="text-3xl font-bold mb-3">{title}</h3>
        {body && <p className="text-muted mb-6">{body}</p>}
        <div className="overflow-hidden rounded-[24px] shadow-xl">
          <iframe className="w-full h-[60vh] min-h-80" src={googleFormEmbedUrl} />
        </div>
      </div>

    </AnimatedSection>
  );
}
