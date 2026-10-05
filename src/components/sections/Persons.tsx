'use client';

import type { PersonsSection } from '@/types/site';
import AnimatedSection from '@/components/AnimatedSection';
import Image from 'next/image';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { SeperatorWave } from '@/components/SeperatorWave';

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default function Persons({ 
  id, 
  title, 
  subtitle, 
  items, 
  style,
  backgroundClass,
  topWaveType,
  bottomWaveType 
}: PersonsSection) {
  const {
    columns = 3,
    cardVariant = 'default',
    rounded = 'xl',
    align = 'center',
  } = style || {};

  const radius = rounded === '2xl' ? 'rounded-3xl' : rounded === 'lg' ? 'rounded-xl' : 'rounded-2xl';
  const gridCols =
    columns === 2 
      ? 'grid-cols-1 md:grid-cols-2' 
      : columns === 4 
      ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' 
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  const textAlign = align === 'left' ? 'text-left' : 'text-center';

  return (
    <div className="relative">
      <SeperatorWave type={topWaveType} flip={false} color={'var(--bg)'} />
      <section id={id} className={`section ${backgroundClass || 'bg-[var(--bg)]'}`}>
        <div className="mx-auto max-w-6xl">
          {(title || subtitle) && (
            <AnimatedSection className={`${textAlign} max-w-3xl ${align === 'center' ? 'mx-auto' : ''} mb-12`}>
              {title && <h2 className="text-4xl md:text-5xl font-extrabold mb-3">{title}</h2>}
              {subtitle && <p className="text-muted text-lg">{subtitle}</p>}
            </AnimatedSection>
          )}

          <div className={`grid gap-6 md:gap-8 ${gridCols}`}>
            {items.map((person, i) => {
              const avatarUrl = resolveAssetUrl(person.avatarUrl);
              const cardClass = cardVariant === 'ink' ? 'card-ink' : 'card';
              
              return (
                <AnimatedSection key={`${person.name}-${i}`} delay={i * 0.08}>
                  <div className={`${cardClass} ${radius} p-6 ${textAlign}`}>
                    {/* Avatar */}
                    <div className={`mb-4 ${align === 'center' ? 'mx-auto' : ''}`}>
                      {avatarUrl ? (
                        <div className={`relative ${align === 'center' ? 'mx-auto' : ''} w-[150px] h-[150px] rounded-full overflow-hidden ${radius}`}>
                          <Image
                            src={avatarUrl}
                            alt={person.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`${align === 'center' ? 'mx-auto' : ''} w-[150px] h-[150px] rounded-full flex items-center justify-center bg-[color-mix(in_srgb,var(--primary)_20%,transparent)] text-2xl font-bold text-[var(--primary)]`}>
                          {initials(person.name)}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold mb-1 text-[var(--text-1)]">{person.name}</h3>

                    {/* Title */}
                    {person.title && (
                      <p className={`text-sm font-medium mb-3 ${cardVariant === 'ink' ? 'text-[var(--text-1)]/80' : 'text-muted'}`}>
                        {person.title}
                      </p>
                    )}

                    {/* Description */}
                    {person.description && (
                      <p className={`text-sm mb-3 ${cardVariant === 'ink' ? 'text-[var(--text-1)]/90' : 'text-muted'}`}>
                        {person.description}
                      </p>
                    )}

                    {/* Badges */}
                    {person.badges && person.badges.length > 0 && (
                      <div className={`flex flex-wrap gap-2 mt-4 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
                        {person.badges.map((badge, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              cardVariant === 'ink' 
                                ? 'bg-[color-mix(in_srgb,var(--text-1)_20%,transparent)] text-[var(--text-1)]' 
                                : 'bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] text-[var(--primary)]'
                            }`}
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
      <SeperatorWave type={bottomWaveType} flip={true} color={'var(--bg)'} />
    </div>
  );
}