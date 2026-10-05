// src/sections/About.tsx
'use client';
import type { AboutSection } from '@/types/site';
import AnimatedSection from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import Image from "next/image";
import { resolveAssetUrl } from '@/lib/assetUrl';
import {SeperatorWave} from '@/components/SeperatorWave';

export function About({ id, title = 'About', subtitle, body, imageUrl, bullets, align = 'left', backgroundClass = 'bg-[var(--bg)', topWaveType, bottomWaveType }: AboutSection) {
  const imageFirst = align === 'left';
  const imgUrl = resolveAssetUrl(imageUrl);
  const hasWaves = backgroundClass.includes('bg-solid-primary');
  return (<>
    <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
    <section id={id} className={`relative  !py-6 !pt-12 ${backgroundClass} !pb-8`}>
      
      <div className={`section container !max-w-[1700px] mx-auto px-4 grid gap-10 ${imgUrl?'mlg:grid-cols-2':'mlg:grid-cols-1'} items-center ${hasWaves?'!text-[var(--text-2)]':''}`}>
        {imgUrl && imageFirst && (
          <motion.div
              initial={{ opacity: 0, scale: .94, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: .6, ease: 'easeOut', delay: .1 }}
              className="relative w-fit mx-auto"
            >
            {/* <div className="absolute -inset-6 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] blur-2xl z-0" /> */}
            <div className="overflow-hidden rounded-full max-h-[800px] max-w-[800px] z-2 relative aspect-square">
              <Image width={800} height={800} src={imgUrl} alt={title} className="w-full rounded-xl object-cover" />
            </div>
          </motion.div>
        )}
        <AnimatedSection className="mx-auto max-w-6xl p-4">
          {title && <h2 className="mb-8 text-3xl md:text-4xl font-extrabold text-center ">{title}</h2>}
          {subtitle ? <p className="h-hero-p text-muted text-lg max-w-xl mb-8 text-center font-bold mx-auto">{subtitle}</p> : null}
          <p className="text-lg leading-relaxed indent-[50px]">{body}</p>
          {bullets && bullets.length > 0 && (
            <ul className="mt-6 space-y-2 list-disc pl-5">
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </AnimatedSection>
        {imgUrl && !imageFirst && (
          // <Image src={imgUrl} alt={title} className="w-full rounded-xl object-cover py-[15px]" />
          <motion.div
              initial={{ opacity: 0, scale: .94, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: .6, ease: 'easeOut', delay: .1 }}
              className="relative"
            >
              {/* soft blob shadow */}
              {/* <div className="absolute -inset-6 rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] blur-2xl -z-10" /> */}
              <div className="overflow-hidden rounded-sm max-h-[800px] max-w-[800px] mx-auto">
                <Image src={imgUrl} alt="" width={1080} height={840} className="w-full h-auto" />
              </div>
            </motion.div>
        )}
      </div>
      {hasWaves && <div className="text-[var(--bg-2)] rotate-180 bottom-wave" aria-hidden>
        <svg viewBox="0 0 1440 140" className="w-full h-[70px]" preserveAspectRatio="none">
          <path d="M0,80 C240,140 480,0 720,60 C960,120 1200,20 1440,80 L1440,140 L0,140 Z" fill="var(--primary)" />
        </svg>
      </div>}
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </>
  );
}
