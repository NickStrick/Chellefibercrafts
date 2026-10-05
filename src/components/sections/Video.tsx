// src/components/sections/Video.tsx
'use client';

import AnimatedSection from '@/components/AnimatedSection';
import type { VideoSection } from '@/types/site';
import { resolveCdnUrl, toYouTubeEmbed } from '@/lib/resolveUrl';

const aspectMap = {
  '16/9': 'aspect-video',
  '9/16': 'aspect-[9/16]',
  '4/3' : 'aspect-[4/3]',
  '1/1' : 'aspect-square',
} as const;
type AspectKey = keyof typeof aspectMap;

const roundMap = {
  lg : 'rounded-xl',
  xl : 'rounded-2xl',
  '2xl': 'rounded-3xl',
} as const;
type RoundKey = keyof typeof roundMap;

const shadowMap = {
  none: '',
  sm  : 'shadow-sm',
  md  : 'shadow-md',
  lg  : 'shadow-lg',
} as const;
type ShadowKey = keyof typeof shadowMap;
export default function Video({
  id,
  title,
  subtitle,
  source,
  posterUrl,
  controls = true,
  autoplay = false,
  muted = false,
  loop = false,
  style,
}: VideoSection) {
  const aspect  = aspectMap[(style?.aspect as AspectKey) ?? '16/9'];
const rounded = roundMap[(style?.rounded as RoundKey) ?? 'xl'];
const shadow  = shadowMap[(style?.shadow  as ShadowKey) ?? 'md'];


  // resolve poster
  const poster = posterUrl ? resolveCdnUrl(posterUrl) : undefined;

  // decide renderer
  const renderVideo = () => {
    if (source.type === 'url') {
      const href = source.href;
      const isYouTube = /youtu(\.be|be\.com)/i.test(href);
      const isVimeo = /vimeo\.com/i.test(href);
      if (isYouTube) {
        const embed = toYouTubeEmbed(href);
        return (
          <iframe
            src={embed}
            className={`w-full h-full ${rounded}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        );
      }
      if (isVimeo) {
        // naive transform; many variants exist, but this works for normal links
        const id = href.split('/').pop();
        const embed = `https://player.vimeo.com/video/${id}`;
        return (
          <iframe
            src={embed}
            className={`w-full h-full ${rounded}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        );
      }
      // Direct video URL (mp4, webm, etc.)
      return (
        <video
          className={`w-full h-full object-cover ${rounded}`}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline
          poster={poster}
        >
          <source src={href} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (source.type === 'local') {
      return (
        <video
          className={`w-full h-full object-cover ${rounded}`}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline
          poster={poster}
        >
          <source src={source.path} />
          Your browser does not support the video tag.
        </video>
      );
    }

    // s3
    if (source.type === 's3') {
      const url = resolveCdnUrl(source.key); // key -> CDN url
      return (
        <video
          className={`w-full h-full object-cover ${rounded}`}
          controls={controls}
          autoPlay={autoplay}
          muted={muted}
          loop={loop}
          playsInline
          poster={poster}
        >
          <source src={url} />
          Your browser does not support the video tag.
        </video>
      );
    }

    return null;
  };

  return (
    <section id={id} className="relative">
      {/* top wave */}
      <div className="text-[var(--bg-2)] top-wave" aria-hidden>
        <svg viewBox="0 0 1440 140" className="w-full h-[70px]" preserveAspectRatio="none">
          <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="section section-ink">
      <AnimatedSection className="mx-auto max-w-5xl">
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-8 text-[var(--text-1)]">
            {title && <h2 className="text-4xl md:text-5xl font-extrabold">{title}</h2>}
            {subtitle && <p className="text-muted mt-3">{subtitle}</p>}
          </div>
        )}

        <div className={`relative ${aspect} overflow-hidden ${rounded} ${shadow}`}>
          {/* Using a wrapper with aspect ratio to ensure perfect sizing for iframe/video */}
          <div className="absolute inset-0">{renderVideo()}</div>
        </div>
      </AnimatedSection>
      </div>
        {/* bottom wave (back to page bg) */}
      <div className="text-[var(--bg-2)] rotate-180 bottom-wave" aria-hidden>
        <svg viewBox="0 0 1440 140" className="w-full h-[70px]" preserveAspectRatio="none">
          <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
