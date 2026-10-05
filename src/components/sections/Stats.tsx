'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';
import AnimatedSection from '@/components/AnimatedSection';
import type { StatsSection, StatItem } from '@/types/site';

// function useCountUp(target: number, start = 0) {
//   const nodeRef = useRef<HTMLSpanElement>(null);
//   const mv = useMotionValue(start);

//   useEffect(() => {
//     const controls = animate(mv, target, { duration: 1.2, ease: 'easeOut' });
//     const unsub = mv.on('change', v => {
//       if (nodeRef.current) nodeRef.current.textContent = Math.floor(v).toString();
//     });
//     return () => { controls.stop(); unsub(); };
//   }, [target]);

//   return nodeRef;
// }

function StatNumber({ item, inView }: { item: StatItem; inView: boolean }) {
  const { value, prefix = '', suffix = '', decimals = 0 } = item;
  const nodeRef = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;

    const controls = animate(mv, value, { duration: 1.2, ease: 'easeOut' });
    const unsub = mv.on('change', (v) => {
      const el = nodeRef.current;
      if (!el) return;
      const num =
        decimals > 0 ? Number(v).toFixed(decimals) : Math.round(v).toString();
      el.textContent = `${prefix}${num}${suffix ?? ''}`;
    });

    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, value, prefix, suffix, decimals, mv]); // 👈 add mv

  return <span ref={nodeRef} />;
}

export function Stats({
  title,
  subtitle,
  items,
  style,
  id
}: StatsSection) {
  const {
    align = 'center',
    columns = 4,
    compact = false,
    divider = 'none',
    color = 'default',
  } = style ?? {};

  const gridCols =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-2 lg:grid-cols-4';

  const numberColor =
    color === 'primary'
      ? 'text-[var(--primary)]'
      : color === 'accent'
      ? 'text-[var(--accent)]'
      : 'text-fg';

  const alignCls = align === 'left' ? 'text-left' : 'text-center';

  // watch in-view once for the grid
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, amount: 0.2 });

  return (
    <section id={id} className="section">
      <AnimatedSection className="mx-auto max-w-6xl">
        {(title || subtitle) && (
          <div className={`mb-10 ${alignCls}`}>
            {title && (
              <h2 className="text-4xl md:text-5xl font-extrabold">{title}</h2>
            )}
            {subtitle && <p className="text-muted mt-3">{subtitle}</p>}
          </div>
        )}

        <div ref={gridRef} className={`grid ${gridCols} gap-y-8`}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className={`${alignCls} px-2`}
            >
              <div
                className={`${numberColor} ${
                  compact ? 'text-4xl' : 'text-5xl md:text-6xl'
                } font-extrabold tracking-tight`}
              >
                <StatNumber item={item} inView={inView} />
              </div>

              <div
                className={`${
                  compact ? 'mt-1 text-sm' : 'mt-2 text-base'
                } text-muted`}
              >
                {item.label}
              </div>

              {divider !== 'none' && (
                <div
                  className={`${
                    align === 'left' ? 'ml-0' : 'mx-auto'
                  } mt-4 ${divider === 'line' ? 'h-px w-14 bg-[color-mix(in_srgb,var(--fg)_15%,transparent)]' : 'w-2 h-2 rounded-full bg-[color-mix(in_srgb,var(--fg)_30%,transparent)]'}`}
                />
              )}
            </motion.div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
