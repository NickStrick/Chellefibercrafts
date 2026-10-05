'use client';
import type { ContactSection } from '@/types/site';
import AnimatedSection from '@/components/AnimatedSection';
import { motion } from 'framer-motion';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faMapMarkerAlt, faPhone, faGlobe, faLink } from '@fortawesome/free-solid-svg-icons';
import { faLinkedin, faInstagram, faFacebook, faYoutube, faTiktok } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { resolveAssetUrl } from '@/lib/assetUrl';

// ---- typed social keys + icon map ----
type SocialType = 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'tiktok' | 'website' | 'linktree';

const SOCIAL_ICONS: Record<SocialType, IconDefinition> = {
  linkedin:  faLinkedin,
  instagram: faInstagram,
  facebook:  faFacebook,
  youtube:   faYoutube,
  tiktok:    faTiktok,
  website:   faGlobe,
  linktree:  faLink, // FA has no official Linktree icon
};

function toSocialType(label: string): SocialType | null {
  const k = label.trim().toLowerCase() as SocialType;
  return (k in SOCIAL_ICONS) ? k : null;
}

export function Contact({
  id,
  title = 'Contact',
  email,
  phone,
  address,
  mapEmbedUrl,
  socials,
  backgroundUrl,
}: ContactSection) {
  const resolvedBackgroundUrl = resolveAssetUrl(backgroundUrl);

  return (
    <section
      id={id}
      className="relative bg-fixed bg-cover bg-center py-[10rem]"
      style={resolvedBackgroundUrl ? { backgroundImage: `url(${resolvedBackgroundUrl})` } : undefined}
    >
      {/* optional overlay for contrast */}
      <div className="absolute inset-0 bg-black/50" aria-hidden />

      <AnimatedSection
        className={`relative z-10 max-w-6xl mx-auto grid ${mapEmbedUrl ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8 px-4`}
      >
        <div>
          <h3 className="text-4xl font-bold mb-4 text-white w-fit m-auto">{title}</h3>
          <ul className="space-y-3 text-xl text-white/90 w-fit m-auto">
            {address && (
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5" />
                <span>{address}</span>
              </li>
            )}
            {email && (
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
                <a href={`mailto:${email}`} className="underline">{email}</a>
              </li>
            )}
            {phone && (
              <li className="flex items-center gap-3">
                <FontAwesomeIcon icon={faPhone} className="w-5 h-5" />
                <a href={phone.href} target="_blank" rel="noopener noreferrer" className="underline">
                  {phone.label}
                </a>
              </li>
            )}

            {socials?.map((s, i) => {
              const key = toSocialType(s.label);
              const icon = s.customIcon ? s.customIcon : key ? SOCIAL_ICONS[key] : faLink;
              console.log('Rendering social link:', s.label, 'with icon:', icon);
              return icon ? (
                <li key={i} className="flex items-center gap-3">
                  <FontAwesomeIcon icon={icon} className="w-5 h-5" />
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline">
                    {s.label}
                  </a>
                </li>
              ) : (
                <li key={i} className="flex items-center gap-3 pl-[32px]">
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="underline">
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {mapEmbedUrl ? (
          <motion.div
            className="theme-card overflow-hidden shadow-lg relative z-10"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <iframe className="w-full h-full min-h-72" src={mapEmbedUrl} loading="lazy" />
          </motion.div>
        ) : null}
      </AnimatedSection>
    </section>
  );
}
