'use client';

import AnimatedSection from '@/components/AnimatedSection';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Image from 'next/image';
import { resolveAssetUrl } from '@/lib/assetUrl';
import type { SiteDisabledSection } from '@/types/site';
import { SOCIAL_ICONS } from './Socials';

// Rounded = square crop shown as a circle; plain = fit within the box, never cropped.
const roundedSizeMap = {
  sm: 'w-40 md:w-48',
  md: 'w-56 md:w-64',
  lg: 'w-64 md:w-80',
} as const;

const plainSizeMap = {
  sm: 'max-h-40 max-w-[240px] md:max-w-[320px]',
  md: 'max-h-56 max-w-[300px] md:max-w-[420px]',
  lg: 'max-h-72 max-w-[340px] md:max-w-[520px]',
} as const;

// Rendered on its own (no header/footer) when Settings → General →
// "Toggle Site Unavailable" is on. See getSiteDisabledSection.
export default function SiteDisabled({ id, title, message, logoImage, logoRounded, logoSize = 'md', socials = [] }: SiteDisabledSection) {
  const logoUrl = resolveAssetUrl(logoImage);

  return (
    <section
      id={id}
      aria-label="Site unavailable"
      className="section bg-[var(--bg)] min-h-screen flex items-center justify-center"
    >
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        {logoUrl &&
          (logoRounded ? (
            // Square crop (object-cover keeps the aspect ratio, no stretching) shown as a circle.
            <Image
              src={logoUrl}
              alt={title ? `${title} logo` : 'logo'}
              width={640}
              height={640}
              priority
              className={`mx-auto mb-8 aspect-square ${roundedSizeMap[logoSize]} h-auto rounded-full object-cover shadow-[var(--elev-2)]`}
            />
          ) : (
            <Image
              src={logoUrl}
              alt={title ? `${title} logo` : 'logo'}
              width={640}
              height={320}
              priority
              className={`mx-auto mb-8 h-auto w-auto ${plainSizeMap[logoSize]} object-contain`}
            />
          ))}
        {title && <h1 className="text-4xl md:text-5xl font-extrabold text-[var(--text-1)]">{title}</h1>}
        {message && <p className="text-muted mt-4 text-lg whitespace-pre-line">{message}</p>}

        {socials.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-5 mt-8">
            {socials.map((s, i) => (
              <li key={`${s.type}-${i}`}>
                <a
                  href={s.href}
                  target={s.type === 'email' ? undefined : '_blank'}
                  rel={s.type === 'email' ? undefined : 'noreferrer'}
                  className="group inline-flex flex-col items-center gap-5"
                >
                  <span
                    className="btn-gradient btn-gradient-icon !rounded-full w-14 h-14 text-[22px] inline-flex items-center justify-center !shadow-[var(--elev-2)] bg-[length:150%] transition-border duration-200 border-[2px] border-transparent hover:border-white"
                    aria-label={s.label ?? s.type}
                  >
                    <FontAwesomeIcon icon={SOCIAL_ICONS[s.type]} />
                  </span>
                  {s.label && <span className="text-sm text-muted mt-2 capitalize">{s.label}</span>}
                </a>
              </li>
            ))}
          </ul>
        )}
      </AnimatedSection>
    </section>
  );
}
