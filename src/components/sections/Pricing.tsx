'use client';
import React from "react";
import type { PricingSection } from "@/types/site";
import AnimatedSection from "@/components/AnimatedSection";
import { motion } from 'framer-motion';
import { Check } from "lucide-react";

/**
 * Pricing component (typed via PricingSection)\n
 * - Mirrors the API style of the Skills component: default export with a typed section prop
 * - Uses globals.css variables & utility classes (no shadcn ui imports)
 */

function cls(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function Pricing({ id, title, subtitle, plans }: PricingSection) {
  return (
    <section id={id} className="section sectionAboveWavePad">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: .6, ease: 'easeOut', delay: .1 }}
              className="relative w-fit mx-auto"
            >
        <div className="mb-10 text-center">
          {/* <span className="h-eyebrow inline-block">Pricing</span> */}
          {title && <h2 className="h-display mt-2">{title}</h2>}
          {subtitle && (
            <p className="mt-4 h-hero-p opacity-80 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>
        </motion.div>

        <div className={`grid gap-6 sm:grid-cols-${plans.length>1?2:plans.length} lg:grid-cols-${plans.length>2?3:plans.length}`}>
          {plans.map((plan, i) => (
            <AnimatedSection key={plan.name + i}>
              <div className={cls("relative pt-[40px] sm:pt-[40px] md:pt-[40px] h-full p-6 sm:p-7 md:p-8 card card-interactive flex flex-col", plan.featured && "card-ink")}>                
                {plan.badge && (
                  <div className="absolute top-3 left-4">
                    <span className="rounded-full border px-3 py-1 text-xs font-medium opacity-90">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <header>
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  {(plan.price || plan.period) && (
                    <div className="mt-3 flex items-end gap-2">
                      {plan.price && (
                        <div className="text-4xl font-extrabold leading-none">{plan.price}</div>
                      )}
                      {plan.period && (
                        <div className="pb-1 text-sm opacity-80">{plan.period}</div>
                      )}
                    </div>
                  )}
                  {plan.description && (
                    <p className="mt-3 text-sm opacity-90">{plan.description}</p>
                  )}
                </header>

                {plan.features && plan.features.length > 0 && (
                  <ul className="my-6 space-y-2">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 flex-none" />
                        <span className="text-sm leading-6 opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {plan.cta?.href && (
                  <a
                    href={plan.cta.href}
                    className={cls(
                      "btn w-full justify-center self-end mt-auto",
                      plan.featured ? "btn-gradient btn-white-outline" : "btn-gradient-inverted"
                    )}
                  >
                    {plan.cta?.label ?? "Select"}
                  </a>
                )}

                {/* {plan.footnote && (
                  <p className="mt-3 text-xs opacity-70">{plan.footnote}</p>
                )} */}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
