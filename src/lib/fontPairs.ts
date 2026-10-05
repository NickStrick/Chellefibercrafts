import type { FontPair } from '@/types/site';

export type FontPairDef = {
  label: string;
  /** CSS font-family value applied to --font-heading */
  heading: string;
  /** CSS font-family value applied to --font-body */
  body: string;
  /** Optional heading font-weight override (e.g. Bebas Neue has no 800) */
  headingWeight?: string;
  /** Google Fonts stylesheet URL — null means no load needed */
  googleUrl: string | null;
};

export const FONT_PAIRS: Record<FontPair, FontPairDef> = {
  inter: {
    label: 'Default — Inter',
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
    googleUrl: null, // bundled / system fallback
  },
  editorial: {
    label: 'Editorial — Playfair + Lato',
    heading: "'Playfair Display', serif",
    body: "'Lato', sans-serif",
    googleUrl:
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&family=Lato:wght@300;400;700&display=swap',
  },
  soft: {
    label: 'Soft — DM Serif + DM Sans',
    heading: "'DM Serif Display', serif",
    body: "'DM Sans', sans-serif",
    googleUrl:
      'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap',
  },
  bold: {
    label: 'Bold — Bebas Neue + Inter',
    heading: "'Bebas Neue', sans-serif",
    headingWeight: '400', // Bebas only has regular weight
    body: "'Inter', sans-serif",
    googleUrl:
      'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap',
  },
  minimal: {
    label: 'Minimal — Space Grotesk',
    heading: "'Space Grotesk', sans-serif",
    body: "'Space Grotesk', sans-serif",
    googleUrl:
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap',
  },
  classic: {
    label: 'Classic — Merriweather + Source Sans',
    heading: "'Merriweather', serif",
    body: "'Source Sans 3', sans-serif",
    googleUrl:
      'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Source+Sans+3:wght@300;400;600;700&display=swap',
  },
};

export const FONT_PAIR_KEYS = Object.keys(FONT_PAIRS) as FontPair[];
