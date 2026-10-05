// src/lib/siteSchema.ts
import { z } from 'zod';

// Minimal safety: ensure top-level structure looks like SiteConfig without using `any`.
export const SiteConfigSchema = z.object({
  theme: z.unknown(),
  showHeader: z.boolean().optional(),
  header: z.unknown().optional(),
  sections: z.array(z.unknown()),
  showFooter: z.boolean().optional(),
  footer: z.unknown().optional(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      favicon: z.string().optional(),
    })
    .optional(),
  settings: z.unknown().optional(),
}).passthrough();

export type SiteConfigJson = z.infer<typeof SiteConfigSchema>;
