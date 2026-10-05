'use client';

import AnimatedSection from '@/components/AnimatedSection';
import { motion } from 'framer-motion';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram,
  faFacebook,
  faLinkedin,
  faXTwitter,
  faYoutube,
  faTiktok,
} from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';
import type { SocialsSection, SocialItem } from '@/types/site';

import {SeperatorWave} from '@/components/SeperatorWave';

export const SOCIAL_ICONS: Record<SocialItem['type'], IconDefinition> = {
  instagram: faInstagram,
  facebook: faFacebook,
  linkedin: faLinkedin,
  x: faXTwitter,
  youtube: faYoutube,
  tiktok: faTiktok,
  email: faEnvelope,
  website: faGlobe,
};

const sizeMap = {
  sm: 'w-10 h-10 text-[18px]',
  md: 'w-14 h-14 text-[22px]',
  lg: 'w-16 h-16 text-4xl',
} as const;

const gapMap = {
  sm: 'gap-3',
  md: 'gap-5',
  lg: 'gap-6',
} as const;

export default function Socials({
  id = 'socials',
  title = 'Connect With Us',
  subtitle,
  items,
  style,
  topWaveType,
  bottomWaveType
}: SocialsSection) {
  const rounded =
    style?.rounded === '2xl' ? '!rounded-full' : style?.rounded === 'lg' ? '!rounded-full' : '!rounded-full';
  const iconSizeCls = sizeMap[style?.size ?? 'lg'];
  const gapCls = gapMap[style?.gap ?? 'md'];
  const align = style?.align ?? 'center';

  return (
    <div className='relative'>
      <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
    <section
      id={id}
      className={[
        'section',
        'bg-[var(--bg)]',
      ].join(' ')}
    >
      <AnimatedSection className="mx-auto max-w-5xl">
        <div className={[align === 'center' ? 'text-center' : 'text-left', 'max-w-3xl mx-auto mb-6'].join(' ')}>
          {title && <h2 className="text-4xl md:text-5xl font-extrabold">{title}</h2>}
          {subtitle && <p className="text-muted mt-3">{subtitle}</p>}
        </div>

        <motion.ul
          className={`flex flex-wrap justify-center ${gapCls}`}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.08, ease: 'easeOut', duration: 0.5 },
            },
          }}
        >
          {items.map((s, i) => (
            <motion.li
              key={`${s.type}-${i}`}
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            >
              <a
                href={s.href}
                target={s.type === 'email' ? undefined : '_blank'}
                rel={s.type === 'email' ? undefined : 'noreferrer'}
                className={`group inline-flex flex-col items-center ${gapCls}`}
              >
                <span
                  className={`btn-gradient btn-gradient-icon ${rounded} ${iconSizeCls} text-4xl inline-flex items-center justify-center !shadow-[var(--elev-2)] bg-[length:150%] transition-border duration-200 border-[2px] border-transparent hover:border-white`}
                  aria-label={s.label ?? s.type}
                >
                  <FontAwesomeIcon icon={SOCIAL_ICONS[s.type]} />
                </span>
                {s.label && (
                  <span className="text-sm text-muted mt-2 capitalize">{s.label}</span>
                )}
              </a>
            </motion.li>
          ))}
        </motion.ul>
        
      </AnimatedSection>
      
    </section>
    <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'}/>
    </div>
  );
}
