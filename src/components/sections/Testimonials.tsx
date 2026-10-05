'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import type { TestimonialsSection } from '@/types/site';
import { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStar } from '@fortawesome/free-solid-svg-icons';
import { resolveAssetUrl } from '@/lib/assetUrl';
import {SeperatorWave} from '@/components/SeperatorWave';


// Small helper to render a fixed 5‑star rating
function Stars() {
return (
<div className="flex items-center gap-1 text-yellow-300" aria-label="5 out of 5 stars">
{Array.from({ length: 5 }).map((_, i) => (
<FontAwesomeIcon key={i} icon={faStar} className="w-4 h-4" aria-hidden="true" />
))}
</div>
);
}

export function Testimonials({
  title = 'Our students love us.',
  subtitle,
  items,
  style,
  id,
  topWaveType,
  bottomWaveType
}: TestimonialsSection) {
  const {
    variant = 'carousel',
    showQuoteIcon = true,
    rounded = 'xl',
    background = 'default',
  } = style || {};

  const cardBase =
    'p-6 md:p-7 card-2 card-outline-2 shadow-md';
  const cardInk =
    'p-6 md:p-7  card-2 card-outline-2 shadow-lg';
  const radius =
    rounded === '2xl' ? 'rounded-3xl' : rounded === 'lg' ? 'rounded-xl' : 'rounded-2xl';

  const columns = items.length === 2 || items.length === 4 ? '2' : '3';
  const gridCols =
    columns === '2'
      ? 'grid-cols-1 md:grid-cols-2'
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  // ---------- Mobile carousel state (only used when variant === 'carousel') ----------
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!trackRef.current || variant !== 'carousel') return;
    const el = trackRef.current;

    const onScroll = () => {
      const w = el.clientWidth;
      const i = Math.round(el.scrollLeft / (w * 0.86)); // 86% slide width (see below)
      setActive(Math.max(0, Math.min(items.length - 1, i)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [variant, items.length]);
  console.log('topWaveType', topWaveType)

  return (<>
  <SeperatorWave type={topWaveType} flip={false} color={'var(--bg-2)'} />
    <section
    id={id}
      className={[
        'section !pb-[6rem]',
        background === 'band'
          ? 'bg-[var(--bg-2)]'
          : '',
      ].join(' ')}
    >
      <AnimatedSection className="mx-auto max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-10">
          {title && <h2 className="text-4xl md:text-5xl font-extrabold">{title}</h2>}
          {subtitle && <p className="mt-3">{subtitle}</p>}
        </div>

        {/* ---------- MOBILE: swipeable carousel when variant === 'carousel' ---------- */}
        {variant === 'carousel' ? (
          <>
            <div
              ref={trackRef}
              className="
                md:hidden                     /* mobile only */
                hide-scrollbar
                -mx-4 px-4
                flex gap-4
                overflow-x-auto
                snap-x snap-mandatory
                scroll-smooth
              "
            >
              {items.map((t, i) => {
                const aviUrl = resolveAssetUrl(t.avatarUrl);
                return (
                <motion.figure
                  key={`${t.name}-${i}`}
                  initial={{ opacity: 1, y: 0, x: 0 }}
                  whileInView={{ opacity: 1, y: 0,x: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.04 }}
                  className={`${
                    cardBase
                  } ${radius} snap-center shrink-0 w-[86%] relative flex flex-col `}
                >
                  {showQuoteIcon && <div className="text-2xl mb-3 opacity-70">“</div>}
                  <blockquote className="text-[1.05rem] leading-relaxed">{t.quote}</blockquote>
                  <figcaption className="flex items-center gap-3 mt-auto pt-6 mb-4">
                    {aviUrl ? (
                      <Image
                        src={aviUrl}
                        alt={t.name}
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                      />
                    ) : (
                       <FontAwesomeIcon icon={faUser} className="w-11 h-11 overflow-hidden rounded-full bg-[var(--bg)] text-[var(--bg-2)]" />
                    )}
                    <div>
                      <div className="font-semibold">{t.name}</div>
                      {t.role && <div className="text-sm">{t.role}</div>}
                    </div>
                  </figcaption>
                  <div className="absolute bottom-4 right-4 stars-box"><Stars /></div>
                </motion.figure>
              )})}
            </div>

            {/* mobile dots */}
            <div className="md:hidden mt-4 flex justify-center gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === active
                      ? 'bg-[var(--primary)]'
                      : 'bg-[var(--bg-2)]'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => {
                    const el = trackRef.current;
                    if (!el) return;
                    const slideW = el.clientWidth * 0.86 + 16; // width + gap (approx)
                    el.scrollTo({ left: i * slideW, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </>
        ) : null}

        {/* ---------- DESKTOP/TABLET: grid (always) ---------- */}
        <div className={`hidden md:grid gap-6 md:gap-8 ${gridCols}`}>
          {items.map((t, i) => {
            const aviUrl = resolveAssetUrl(t.avatarUrl);
            return (
            <motion.figure
              key={`${t.name}-${i}`}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.05 }}
              className={`relative  flex flex-col ${variant === 'ink' ? cardInk : cardBase} ${radius}`}
            >
              {showQuoteIcon && <div className="text-4xl mb-3 opacity-70">“</div>}

              <blockquote className="text-[1.05rem] leading-relaxed">{t.quote}</blockquote>

              <figcaption className="flex items-center gap-3 mt-auto pt-6 mb-4">
                {aviUrl ? (
                  <Image
                    src={aviUrl}
                    alt={t.name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="w-11 h-11 overflow-hidden rounded-full bg-[var(--bg)] text-[var(--bg-2)]" />
                )} 
                {/* w-11 h-11 rounded-full bg-[color-mix(in_srgb,var(--fg)_20%,transparent)] */}
                <div>
                  <div className="font-semibold">{t.name}</div>
                  {t.role && (
                    <div
                      className={`text-sm ${
                        variant === 'ink' ? 'text-[var(--text)]/85' : 'opacity-75'
                      }`}
                    >
                      {t.role}
                    </div>
                  )}
                </div>
              </figcaption>
              <div className="absolute bottom-4 right-4 stars-box"><Stars /></div>
            </motion.figure>
          )})}
        </div>
      </AnimatedSection>
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg-2)'} />
    </>
  );
}
