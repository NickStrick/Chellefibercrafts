'use client';
import type { HeroSection } from '@/types/site';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import { resolveAssetUrl } from '@/lib/assetUrl';

export function Hero({ id, eyebrow, title, subtitle, primaryCta, secondaryCta, imageUrl }: HeroSection) {
  console.log('Hero imageUrl:', imageUrl);
  const imgUrl = resolveAssetUrl(imageUrl);
  return (
    <section id={id} className="section curve bg-app  !pt-[0] !pr-0">
      <AnimatedSection>
        <div className="mx-auto  grid mlg:grid-cols-2  items-center">
          <div className="p-4 max-w-[600px] mx-auto">
            {eyebrow ? <p className="h-eyebrow mb-3">{eyebrow}</p> : null}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: .6, ease: 'easeOut', delay: .05 }}
              className="h-display mb-4"
            >
              {title}
            </motion.h1>
            {subtitle ? (
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: .15 }}
                className="h-hero-p text-muted text-lg max-w-xl mb-8"
              >
                {subtitle}
              </motion.p>
            ) : null}
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: .25 }} className="flex flex-wrap gap-4">
              {primaryCta && <Link href={primaryCta.href} className="btn-gradient">{primaryCta.label}</Link>}
              {secondaryCta && <Link href={secondaryCta.href} className="btn-gradient-inverted">{secondaryCta.label}</Link>}
            </motion.div>
          </div>

          {imgUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: .94, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: .6, ease: 'easeOut', delay: .1 }}
              className="relative w-fit ml-auto"
            >
              
              <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
                  {/* Image */}
                <Image src={imgUrl} alt="" width={980} height={740} className="w-full h-auto" />

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 gradient-fade"></div>

                  {/* Optional content */}
                  <div className="absolute inset-0 flex items-center px-8">
                    <h1 className="text-white text-4xl font-bold">
                    </h1>
                  </div>
                </div>
            </motion.div>
          ) : null}
        </div>
      </AnimatedSection>
    </section>
  );
}
