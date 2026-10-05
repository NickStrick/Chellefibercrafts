'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import type { BannerCarouselSection } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';

export default function BannerCarousel({ id, items, intervalMs = 5000 }: BannerCarouselSection) {
  const slides = items ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, Math.max(intervalMs, 1000));
    return () => clearInterval(timer);
  }, [slides.length, intervalMs]);

  if (slides.length === 0) return null;

  const item = slides[Math.min(index, slides.length - 1)];
  const bgUrl = resolveAssetUrl(item.backgroundUrl);
  const flyerUrl = resolveAssetUrl(item.imageUrl);
  const overlay = item.overlay ?? true;

  const inner = (
    <div
      className={`group relative w-full h-[4rem] flex items-center justify-center bg-cover bg-center ${
        bgUrl ? '' : 'banner-gradient-bg'
      }`}
      style={bgUrl ? { backgroundImage: `url(${bgUrl})` } : undefined}
    >
      {bgUrl && overlay && (
        <div className="absolute inset-0 bg-black/45 transition-colors duration-300 group-hover:bg-black/65" />
      )}
      {(item.title || item.body || flyerUrl) && (
        <div className="relative z-10 px-4 flex items-center gap-3 text-sm md:text-base text-white">
          {flyerUrl && (
            <Image
              src={flyerUrl}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
          {(item.title || item.body) && (
            <div className="flex items-center gap-2 text-center">
              {item.title && <span className="font-semibold group-hover:underline">{item.title}</span>}
              {item.body && <span className="text-white/90">{item.body}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section id={id} className="relative w-full h-[4rem] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          {item.href ? (
            <Link href={item.href} className="block w-full h-full">
              {inner}
            </Link>
          ) : (
            inner
          )}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <div className="absolute bottom-1 inset-x-0 z-20 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 w-1.5 rounded-full transition-opacity ${
                i === index ? 'bg-white opacity-100' : 'bg-white/50 opacity-70'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
