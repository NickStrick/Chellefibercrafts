// src/sections/Sectional.tsx
'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { resolveAssetUrl } from '@/lib/assetUrl';

// If you want to use a static import from /public, you can pass that .src into backgroundUrl.
// Example: import bg from '../../../public/colorsky.jpg';
// ...then use <Sectional backgroundUrl={bg.src} ... />

export type SectionalProps = {
  title: string;
  body?: string;
  backgroundUrl?: string;       // e.g. "/colorsky.jpg" in /public
  overlay?: boolean;            // default true
  align?: 'left' | 'center' | 'right'; // default 'center'
  subtitleAlign?: 'left' | 'center' | 'right'; // default 'center'; independent of `align`
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'full'; // default 'lg'
  motionOffset?: number;        // default 70
  motionDuration?: number;      // default 0.8
  direction?: 'x' | 'y';        // default 'x'
};

export default function Sectional({
  title,
  body,
  backgroundUrl,
  overlay = true,
  align = 'center',
  subtitleAlign = 'center',
  height = 'lg',
  motionOffset = 70,
  motionDuration = 0.8,
  direction = 'x',
}: SectionalProps) {

  useEffect(() => {
    return () => {};
  }, []);
   const bgUrl = resolveAssetUrl(backgroundUrl);

  // height classes (simple mapping, no clsx)
  const heightClass =
    height === 'full' ? 'min-h-screen'
    : height === 'md' ? 'min-h-[45vh]'
    : height === 'sm' ? 'min-h-[30vh]'
    : height === 'xs' ? 'min-h-[14vh]'
    : 'min-h-[60vh]'; // lg default

  const textAlignClass =
    align === 'left' ? 'text-left'
    : align === 'right' ? 'text-right'
    : 'text-center';

  const subtitleAlignClass =
    subtitleAlign === 'left' ? 'text-left'
    : subtitleAlign === 'right' ? 'text-right'
    : 'text-center';

  const variants = {
    hidden: {
      opacity: 0,
      x: direction === 'x' ? motionOffset : 0,
      y: direction === 'y' ? motionOffset : 0,
    },
    visible: { opacity: 1, x: 0, y: 0 },
  };

  return (
    <section
      className={`hero-section bg-fixed bg-cover bg-center relative flex items-center ${heightClass}`}
      style={
        bgUrl
          ? { backgroundImage: `url(${bgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    >
      {overlay && <div className="hero-overlay absolute inset-0 z-0 bg-black/45" />}

      <motion.div
        className={`relative z-10 px-4 max-w-3xl mx-auto ${textAlignClass}`}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: motionDuration, ease: 'easeOut' }}
        variants={variants}
      >
        <h1 className="hero-title pt-[20px] text-white text-3xl md:text-5xl font-semibold leading-tight">
          {title}
        </h1>
        {body && (
          // pb-20 reserves room for an adjacent section's top wave, which
          // overlaps upward ~64px into whatever comes before it (see
          // .top-wave in globals.css) and would otherwise clip this text.
          // Only rendered when there's a subtitle at all, and only ever
          // grows the section past its height preset when the subtitle is
          // long enough to need it — short subtitles just get a bit more
          // breathing room inside their already-tall min-height box.
          <p className={`hero-subtitle mt-6 pb-20 text-base md:text-lg text-white/90 whitespace-pre-wrap ${subtitleAlignClass}`}>
            {body}
          </p>
        )}
      </motion.div>
    </section>
  );
}
