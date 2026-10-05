// src/lib/configSchema.ts
import { z } from 'zod';

export const ThemeSchema = z.object({
  preset: z.string(),
  primary: z.string().optional(),
  accent: z.string().optional(),
  bg: z.string().optional(),
  bg2: z.string().optional(),
  fg: z.string().optional(),
  muted: z.string().optional(),
  text1: z.string().optional(),
  text2: z.string().optional(),
  colors: z
    .object({
      primary: z.string().optional(),
      accent: z.string().optional(),
      bg: z.string().optional(),
      bg2: z.string().optional(),
      fg: z.string().optional(),
      muted: z.string().optional(),
      text1: z.string().optional(),
      text2: z.string().optional(),
    })
    .optional(),
  radius: z.enum(['sm', 'md', 'lg', 'xl', '2xl', 'full']).optional(),
});

export const MetaSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  favicon: z.string().optional(),
}).optional();

/**
 * Keep sections permissive (z.any()) so you can evolve quickly.
 * You can refine with unions later as your UI becomes field-based.
 */
export const SiteConfigSchema = z.object({
  theme: ThemeSchema,
  meta: MetaSchema,
  sections: z.array(z.any()),
  settings: z
    .object({
      general: z.any().optional(),
      payments: z.any().optional(),
    })
    .optional(),
});

export type SiteConfigParsed = z.infer<typeof SiteConfigSchema>;
