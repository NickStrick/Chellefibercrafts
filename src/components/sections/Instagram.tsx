'use client';

import { useEffect, useRef, useState } from 'react';
import AnimatedSection from '@/components/AnimatedSection';
import type { InstagramSection } from '@/types/site';

/**
 * Instagram component
 * - Animates in using <AnimatedSection />
 * - Supports single post or a small grid of posts
 * - Responsive width with configurable max sizes
 * - Re-uses the existing Instagram embed.js (loaded once)
 * - Typed via InstagramSection in src/types/site.ts
 * - NEW: orientation option ('profile' | 'landscape') to adjust sizing/shadows
 */
type InstagramEmbedAPI = {
  Embeds?: {
    process?: () => void;
  };
};

declare global {
  interface Window {
    instgrm?: InstagramEmbedAPI;
  }
}

// Load or re-process the Instagram embed script
const ensureEmbedScript = (): void => {
  if (typeof window === 'undefined') return;

  const existing = document.querySelector<HTMLScriptElement>(
    "script[src='https://www.instagram.com/embed.js']"
  );
  if (!existing) {
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    document.body.appendChild(script);
  } else {
    window.instgrm?.Embeds?.process?.();
  }
};

// Force injected iframe to fill our aspect-ratio wrapper
function fitInstagramIframes(root?: HTMLElement | null): void {
  if (!root) return;
  const frames = root.querySelectorAll<HTMLIFrameElement>(
    "blockquote.instagram-media iframe"
  );
  frames.forEach((f) => {
    f.removeAttribute('width');
    f.removeAttribute('height');
    Object.assign(f.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
    } as Partial<CSSStyleDeclaration>);
  });
}
// Helper: compute aspect string
function getAspect(orientation: 'profile' | 'landscape') {
  return orientation === 'landscape' ? '16 / 9' : '4 / 5';
}

export default function Instagram({
  id = 'instagram',
  title,
  subtitle,
  items,
  align = 'center',
  maxWidth = 640,
  rounded = 'xl',
  columns = 2,
  orientation = 'profile',
}: InstagramSection) {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  ensureEmbedScript();

  const iv = window.setInterval(() => {
    if (window.instgrm?.Embeds?.process) {
      window.clearInterval(iv);
      setReady(true);
      window.instgrm.Embeds.process();
    }
  }, 200);

  return () => {
    window.clearInterval(iv);
  };
}, []);


useEffect(() => {
  if (!ready) return;

  window.instgrm?.Embeds?.process?.();
  fitInstagramIframes(containerRef.current);

  const obs = new MutationObserver(() => fitInstagramIframes(containerRef.current));
  if (containerRef.current) {
    obs.observe(containerRef.current, { childList: true, subtree: true });
  }

  const t1 = window.setTimeout(() => fitInstagramIframes(containerRef.current), 250);
  const t2 = window.setTimeout(() => fitInstagramIframes(containerRef.current), 1000);

  // cleanup
  return () => {
    obs.disconnect();
    window.clearTimeout(t1);
    window.clearTimeout(t2);
  };
}, [ready, items]);

  const roundedCls = rounded === '2xl' ? 'rounded-3xl' : rounded === 'lg' ? 'rounded-xl' : 'rounded-2xl';

  // Orientation-aware defaults
  const isLandscape = orientation === 'landscape';
  const effectiveMax = maxWidth ?? (isLandscape ? 800 : 640);
  const aspect = getAspect(orientation);

  const gridCols =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2';

  return (
    <section id={id} className="section bg-gradient-2-top ">
      <AnimatedSection className="mx-auto max-w-6xl">
        {(title || subtitle) && (
          <div className={[align === 'center' ? 'text-center' : 'text-left', 'max-w-3xl mx-auto mb-8'].join(' ')}>
            {title && <h2 className="text-3xl md:text-4xl font-extrabold">{title}</h2>}
            {subtitle && <p className="text-muted mt-2">{subtitle}</p>}
          </div>
        )}

        <div ref={containerRef} className={items.length > 1 ? `grid gap-6 ${gridCols}` : 'flex justify-center'}>
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`mx-auto w-full ${roundedCls} shadow-[0_10px_30px_rgba(0,0,0,.15)] relative overflow-hidden border-2 border-solid border-[var(--bg-2)]`}
              style={{ maxWidth: effectiveMax, aspectRatio: aspect, minHeight: 400 }}
            >
              <blockquote
                className={`instagram-media absolute inset-0`}
                data-instgrm-permalink={item.url}
                data-instgrm-version="14"
                style={{
                  background: '#FFF',
                  border: 0,
                  padding: 0,
                  width: 'calc(100% + 2px)',
                  height: 'calc(100% + 2px)',
                  boxShadow: isLandscape ? '0 12px 36px rgba(0,0,0,.22)' : '0 10px 30px rgba(0,0,0,.15)',
                }}
              />
            </div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
