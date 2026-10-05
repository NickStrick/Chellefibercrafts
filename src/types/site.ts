// src/types/site.ts
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
export type ThemePreset =
  | 'ocean'
  | 'sunset'
  | 'forest'
  | 'slate'
  | 'festival'
  | 'candy'
  | 'neon'
  | 'grove'
  | 'forest-earthy'
  | 'lavender'
  | 'irish'
  | 'splunk'
  | 'sue'
  | 'custom';  // user-defined

export const THEME_PRESETS: ThemePreset[] = [
  'ocean',
  'sunset',
  'forest',
  'slate',
  'festival',
  'candy',
  'neon',
  'grove',
  'forest-earthy',
  'lavender',
  'irish',
  'splunk',
  'sue',
  'custom',
];

export type Theme = {
  preset: ThemePreset;
  primary?: string;
  accent?: string;
  radius?: 'sm' | 'md' | 'lg' | 'xl';
};
export type ThemeColors = {
  primary?: string;
  accent?: string;
  bg?: string;
  bg2?: string;
  fg?: string;
  muted?: string;
  text1?: string;
  text2?: string;
};
export type FontPair =
  | 'inter'
  | 'editorial'
  | 'soft'
  | 'bold'
  | 'minimal'
  | 'classic';

export type SiteStyle = {
  preset: ThemePreset;
  primary?: string;
  accent?: string;
  bg?: string;
  bg2?: string;
  fg?: string;
  muted?: string;
  text1?: string;
  text2?: string;
  colors?: ThemeColors;
  radius?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  fontPair?: FontPair;
};

export const WAVE_TYPES = ['1-hill', '2-hill', '1-cave', '2-cave'] as const;
export type WaveType = (typeof WAVE_TYPES)[number];

export type SectionBase = {
  id: string;
  type:
    | 'header'
    | 'hero'
    | 'features'
    | 'cta'
    | 'newsletter'
    | 'contact'
    | 'scheduling'
    | 'footer'
    | 'testimonials'
    | 'stats'
    | 'about'
    | 'disclaimer'
    | 'sectional'
    | 'skills'
    | 'pricing'
    | 'share'
    | 'partners'
    | 'instagram'
    | 'gallery'
    | 'socials'
    | 'video'
    | 'productListings'
    | 'persons'
    | 'productShop'
    | 'sendAMessage'
    | 'pageLinks'
    | 'bannerCarousel'
    | 'classDetail'
    | 'classList'
    | 'siteDisabled'
    ;

  // visible/editable flags to support your builder UI
  visible?: boolean;
  editable?: boolean;
  backgroundClass?: string; // custom bg class (e.g. "bg-gradient-to-r from-blue-500 to-green-500")
  topWaveType?: WaveType;
  bottomWaveType?: WaveType;
};

export type AnySection =
  | HeaderSection
  | HeroSection
  | FeaturesSection
  | AboutSection       
  | DisclaimerSection 
  | CTASection
  | NewsletterSection
  | ContactSection
  | SchedulingSection
  | FooterSection
  | TestimonialsSection
  | StatsSection
  | SectionalSection
  | SkillsSection
  | PricingSection
  | ShareSection
  | PartnersSection
  | InstagramSection
  | GallerySection
  | SocialsSection
  | VideoSection
  | ProductListingsSection
  | PersonsSection
  | ProductShopSection
  | SendAMessageSection
  | PageLinksSection
  | BannerCarouselSection
  | ClassDetailSection
  | ClassListSection
  | SiteDisabledSection;
  ;
// add this near other shared types
export type HeaderStyle = {
  sticky?: boolean;                // default: true
  blur?: boolean;                  // default: true (backdrop blur)
  elevation?: 'none' | 'sm' | 'md';// shadow strength
  transparent?: boolean;           // if true, no solid bg (uses transparent/overlay)
};

export type HeaderNavLink = { label: string; href: string };

// A top-level nav item is either a plain link, or — when `children` is
// present — a dropdown group whose label just toggles the menu (its own
// `href` is unused) and whose children are the actual links.
export type HeaderNavItem = HeaderNavLink & {
  children?: HeaderNavLink[];
};

// update HeaderSection
export type HeaderSection = SectionBase & {
  type: 'header';
  logoText?: string;
  logoImage?: string;
  links?: HeaderNavItem[];
  cta?: { label: string; href: string };
  style?: HeaderStyle; // 👈 new
};


export type HeroSection = SectionBase & {
  type: 'hero';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageUrl?: string;
};

export type PageLinkItem = {
  label: string;
  href: string;
  variant?: 'primary' | 'inverted';
};

export type PageLinksStyle = {
  align?: 'left' | 'center' | 'right';
};

export type PageLinksSection = SectionBase & {
  type: 'pageLinks';
  title?: string;
  subtitle?: string;
  items: PageLinkItem[];
  style?: PageLinksStyle;
};

// Rotating banner strip (same height as the header), one or many ad/link slides
export type BannerCarouselItem = {
  backgroundUrl?: string;  // optional background image (S3 key or full URL)
  overlay?: boolean;       // dark tint over the background image for contrast; default true
  imageUrl?: string;       // optional flyer/logo image shown to the left of the title/text
  title?: string;
  body?: string;
  href?: string;           // clicking the slide navigates here (internal, sub-page, or external)
};

export type BannerCarouselSection = SectionBase & {
  type: 'bannerCarousel';
  items: BannerCarouselItem[];
  intervalMs?: number; // auto-rotate interval in ms; default 5000
};

// ✅ NEW: About
export type AboutSection = SectionBase & {
  type: 'about';
  title?: string;
  subtitle?: string;
  body: string;           // markdown or plain text
  imageUrl?: string;      // headshot or supporting image
  bullets?: string[];     // optional quick facts
  align?: 'left' | 'right' | 'center'; // image/text alignment
};

// ✅ NEW: Disclaimer (used in your config)
export type DisclaimerSection = SectionBase & {
  type: 'disclaimer';
  title?: string;
  body: string;
  enabled?: boolean;
};
export type FeatureMeta = { label: string; value: string };

export type FeaturesSection = SectionBase & {
  type: 'features';
  title?: string;
  items: {
    icon?: string;
    title: string;
    body?: string;
    link?: string;
    imageUrl?: string;
    imageSize?: 'sm' | 'md' | 'lg'; // image size presets
    meta?: FeatureMeta[];   // ← was `{}`; now structured array
  }[];
};

export type CTASection = SectionBase & {
  type: 'cta';
  title: string;
  body?: string;
  cta: { label: string; href: string };
};

export type NewsletterSection = SectionBase & {
  type: 'newsletter';
  title?: string;
  body?: string;
  googleFormEmbedUrl: string; // prefill URL
};

export type ContactSection = SectionBase & {
  type: 'contact';
  title?: string;
  email?: string;
  phone?: { label: string; href: string };
  address?: string;
  mapEmbedUrl?: string;
  backgroundUrl?: string; // optional background image
  socials?: { label: string; href: string; customIcon?: IconDefinition }[];
};

export type SchedulingSection = SectionBase & {
  type: 'scheduling';
  title?: string;
  body?: string;
  calendlyUrl: string; // https://calendly.com/username
};

export type FooterSection = SectionBase & {
  type: 'footer';
  columns?: { title?: string; links: { label: string; href: string }[] }[];
  legal?: string;
};

export type SectionalSection = SectionBase & {
  id: string;
  type: 'sectional';
  title: string;
  body?: string;
  backgroundUrl?: string;   // accepts /public path or external URL
  overlay?: boolean;        // tint overlay for contrast
  align?: 'left' | 'center' | 'right';
  subtitleAlign?: 'left' | 'center' | 'right'; // default 'center'; independent of title's `align`
  height?: 'xs' | 'sm' | 'md' | 'lg' | 'full'; // hero height presets
  motion?: {
    direction?: 'x' | 'y';
    offset?: number;      // px
    duration?: number;    // seconds
  };
};



/** Settings → General → "Toggle Site Unavailable". When enabled, every page renders only the siteDisabled section. */
export type SiteDisabledSettings = {
  enabled?: boolean;
  title?: string;
  message?: string;
  logoImage?: string; // S3 key or URL, shown above the title
  logoRounded?: boolean; // crop the logo to a square and show it as a circle
  logoSize?: 'sm' | 'md' | 'lg'; // default 'md'
  socials?: SocialItem[];
};

export type SiteSettings = {
  /** Free-form; known keys include businessDisplayName, businessNotificationEmail, siteDisabled (SiteDisabledSettings). */
  general?: Record<string, unknown>;
  payments?: PaymentsSettings;
};

export type SitePage = {
  /** URL slug — e.g. "about" renders at /about */
  slug: string;
  /** Display name used in nav and admin */
  title: string;
  /** Sections for this page (header/footer are inherited from the root config) */
  sections: AnySection[];
  meta?: { title?: string; description?: string };
  visible?: boolean;
};

export type SiteConfig = {
  theme: SiteStyle;
  /**
   * Header/footer are stored outside the reorderable `sections` list so they
   * cannot be moved by users or AI patching.
   *
   * Legacy configs may still include header/footer inside `sections`; normalize
   * at runtime (see `src/lib/siteConfigSections.ts`).
   */
  header?: HeaderSection;
  showHeader?: boolean;
  sections: AnySection[];
  footer?: FooterSection;
  showFooter?: boolean;
  meta?: { title?: string; description?: string; favicon?: string };
  settings?: SiteSettings;
  products?: SiteProductsConfig;
  classes?: SiteClassesConfig;
  /** Custom pages — each gets a dynamic route at /[slug] */
  pages?: SitePage[];
};

/** Metadata for a named, saved snapshot of a SiteConfig (see /api/admin/config/[siteId]/versions). */
export type SiteConfigVersionMeta = {
  id: string;
  name: string;
  savedAt: string; // ISO timestamp
};


export type TestimonialItem = {
  quote: string;
  name: string;
  role?: string;
  avatarUrl?: string; // optional
};

export type TestimonialsStyle = {
  variant?: 'card' | 'ink' | 'carousel';   // ink = deep, primary-colored cards
  columns?: 2 | 3;            // default responsive cols
  showQuoteIcon?: boolean;    // default true
  rounded?: 'lg' | 'xl' | '2xl';
  background?: 'default' | 'band'; // band -> subtle tinted section bg
};

export type TestimonialsSection = SectionBase & {
  type: 'testimonials';
  title?: string;
  subtitle?: string;
  items: TestimonialItem[];
  style?: TestimonialsStyle;
};
export type StatItem = {
  value: number;        // 10_000_000
  label: string;        // "Users"
  prefix?: string;      // "$", "~"
  suffix?: string;      // "+", "%", "k"
  decimals?: number;    // how many decimals to show when animating
};

export type StatsStyle = {
  align?: 'left' | 'center';     // text alignment
  columns?: 2 | 3 | 4;           // grid columns (responsive adjusts)
  compact?: boolean;             // smaller spacing/typography
  divider?: 'none' | 'dot' | 'line';
  color?: 'default' | 'accent' | 'primary'; // number color
};

export type StatsSection = SectionBase & {
  type: 'stats';
  title?: string;
  subtitle?: string;
  items: StatItem[];
  style?: StatsStyle;
};
export type SkillItem = {
  title: string;
  body?: string;
  imageUrl?: string;   // optional icon/logo/photo
};

export type SkillsSection = SectionBase & {
  id: string;
  type: 'skills';
  title?: string;
  subtitle?: string;
  items: SkillItem[];
  columns?: 2 | 3 | 4; // grid columns (default 3)
};
export type PricingPlan = {
    name: string;
    price?: string;
    period?: string;
    description?: string;
    features?: string[];
    cta?: { label?: string; href?: string };
    featured?: boolean;
    badge?: string;
};

export type PricingSection = SectionBase & {
  id: string;
  type: 'pricing';
  title?: string;
  subtitle?: string;
  plans: PricingPlan[];
};
export type ShareItem = {
  /** URL to encode in QR. If omitted, use current site URL */
  value?: string;
  /** Optional label under the QR code */
  label?: string;
  /** Optional size in px (default 220) */
  size?: number;
};

export type ShareStyle = {
  /** layout variant */
  variant?: 'default' | 'band'; // band = tinted bg
  /** alignment of text & QR code */
  align?: 'left' | 'center';
  /** whether to show action buttons (copy/share/download) */
  actions?: boolean;
};

export type ShareSection = SectionBase & {
  id: string;
  type: 'share';
  title?: string;
  subtitle?: string;
  /** one or more QR codes */
  items: ShareItem[];
  style?: ShareStyle;
  value?: string;
  /** QR code size in pixels */
  size?: number; // default 220
  /** Add a CTA button to open the link (useful on desktop for preview) */
  showOpen?: boolean;
};

export type PartnerLink = {
  type: 'instagram' | 'facebook' | 'linkedin' | 'website' | 'youtube' | 'tiktok' | 'linktree';
  href: string;
  customLabel?: string;
};

export type PartnerItem = {
  name: string;
  description?: string;
  logoUrl?: string;
  links?: PartnerLink[];
};

export type PartnersStyle = {
  variant?: 'cards' | 'grid';
  columns?: 2 | 3 | 4;
  rounded?: 'lg' | 'xl' | '2xl';
  background?: 'default' | 'band';
};

export type PartnersSection = SectionBase & {
  id: string;
  type: 'partners';
  title?: string;
  subtitle?: string;
  items: PartnerItem[];
  style?: PartnersStyle;
};

export type InstagramItem = {
  url: string; // permalink to a post or reel
};

// Section config for Instagram embeds
export type InstagramSection = SectionBase & {
  id: string;
  type: 'instagram';
  title?: string;
  subtitle?: string;
  items: InstagramItem[];           // pass one or more items
  align?: 'left' | 'center';        // heading alignment
  maxWidth?: number;                // px; default 640
  rounded?: 'lg' | 'xl' | '2xl';    // rounded corners for embeds
  columns?: 1 | 2 | 3;              // grid columns when multiple
  orientation?: 'profile' | 'landscape'; // NEW
};
export type GalleryItem = {
  imageUrl: string;
  alt?: string;
  caption?: string;
};

export type GalleryStyle = {
  rounded?: 'lg' | 'xl' | '2xl';
  columns?: 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
};

export type GallerySource =
  | { type: 'static'; items: GalleryItem[] }
  | {
      type: 's3';
      bucket?: string;       // defaults from env
      prefix?: string;       // e.g. "carole/gallery/"
      region?: string;       // defaults from env
      cdnBase?: string;      // e.g. CloudFront domain (optional)
      limit?: number;        // optional cap
      recursive?: boolean;   // default true
    };

export type GallerySection = SectionBase & {
  id: string;
  type: 'gallery';
  title?: string;
  subtitle?: string;
  style?: GalleryStyle;
  backgroundClass?: string;
  /** choose either source or items for backwards-compat */
  source?: GallerySource;
  items?: GalleryItem[];
};
export type SocialItem = {
  type:
    | 'instagram'
    | 'facebook'
    | 'linkedin'
    | 'x'
    | 'youtube'
    | 'tiktok'
    | 'email'
    | 'website';
  href: string; // mailto: allowed for email
  label?: string; // optional label under icon
};

export type SocialsSection = SectionBase & {
  id?: string;
  type?: 'socials';
  title?: string;
  subtitle?: string;
  items: SocialItem[];
  style?: {
    background?: 'default' | 'band';
    rounded?: 'lg' | 'xl' | '2xl';
    size?: 'sm' | 'md' | 'lg'; // icon button size
    gap?: 'sm' | 'md' | 'lg';
    align?: 'left' | 'center';
  };
};
// ---- Video section types ----
export type VideoSourceUrl = {
  type: 'url';
  href: string;                 // YouTube/Vimeo page or direct mp4
};

export type VideoSourceLocal = {
  type: 'local';
  path: string;                 // e.g., "/videos/intro.mp4" or imported asset src
};

export type VideoSourceS3 = {
  type: 's3';
  key: string;                  // e.g., "configs/carole/videos/intro.mp4"
  bucket?: string;              // optional override; defaults to S3_DEFAULT_BUCKET
  cdnBase?: string;             // optional override; defaults to NEXT_PUBLIC_S3_CDN_BASE
};

export type VideoSource = VideoSourceUrl | VideoSourceLocal | VideoSourceS3;

export type VideoStyle = {
  aspect?: '16/9' | '9/16' | '4/3' | '1/1';
  rounded?: 'lg' | 'xl' | '2xl';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  background?: 'default' | 'band';
};

export type VideoSection = SectionBase & {
  id: string;
  type: 'video';
  title?: string;
  subtitle?: string;
  source: VideoSource;
  posterUrl?: string;           // optional poster image (can be S3 key or full URL)
  controls?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  style?: VideoStyle;
};

export type Money = {
  amount: number;        // 1999 (cents) or 19.99 as number — choose one style; below we assume cents
  currency?: string;     // 'USD' default
};

export type ProductImage = {
  url: string;           // full URL or S3 key resolved at render
  alt?: string;
};

export type ProductSpec = {
  label: string;
  value: string;
};

export type ProductColor = { name: string; hex?: string; imageUrl?: string };
export type ProductOptionItem = {
  label: string;
  value?: string;
  order?: number;
  default?: boolean;
  price?: number;
};
export type ProductOptions = { label: string; optionItems?: ProductOptionItem[] };


export type Product = {
  id: string;            // stable id/slug
  name: string;
  subtitle?: string;
  sku?: string;

  // pricing (use cents to avoid float issues)
  price: number;         // e.g. 2999 == $29.99
  compareAtPrice?: number;
  currency?: string;     // default 'USD'

  thumbnailUrl?: string;
  images?: ProductImage[];

  summary?: string;      // short blurb
  description?: string;  // long description (markdown/plain)

  features?: string[];   // bullet points
  // specs?: ProductSpec[]; // table // remove

  badges?: string[];     // e.g. "New", "Bestseller"
  // tags?: string[];// remove

  stock?: 'in_stock' | 'low_stock' | 'out_of_stock';
  quantityAvailable?: number;

  // digital?: boolean;     // remove
  // weightKg?: number;// remove
  // widthCm?: number;// remove
  // heightCm?: number;// remove
  // depthCm?: number;// remove
  // shippingClass?: string;// remove

  // where Buy Now leads (until payments are integrated)
  purchaseUrl?: string;  // external checkout or link
  ctaLabel?: string;     // default "Buy Now"
  
  colors?: ProductColor[];
  options?: ProductOptions[];           // e.g. ['S','M','L','XL']
  maxQuantity?: number;          // default 10
  taxable?: boolean;             // optional override if taxes enabled
};

export type ProductListingsStyle = {
  columns?: 1 | 2 | 3 | 4 | 5;           // default responsive columns
  cardVariant?: 'default' | 'ink';
  showBadges?: boolean;
  sectionType?: 'default' | 'short' | 'long';
};

export type CheckoutInputType =
  | 'text'
  | 'tel'
  | 'email'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'textarea'
  | 'select';

export type CheckoutInputOption = { label: string; value: string };

export type CheckoutInput = {
  id: string;
  label: string;
  type: CheckoutInputType;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: CheckoutInputOption[];
  googleFormEntryId?: string;
  hidden?: boolean;
};

export type GoogleFormOptions = {
  addItemToGForm?: boolean;
  itemsEntryId?: string;
  totalEntryId?: string;
};

export type PromoCode = {
  promoId: string;
  type: 'percentage' | 'amount';
  value: number; // percent (e.g. 10 = 10%) for percentage, dollars (e.g. 5 = $5.00) for amount
};

export type PaymentsSettings = {
  cartActive?: boolean;        // default false
  checkoutInputs?: CheckoutInput[];
  promoCodes?: PromoCode[];
  googleFormUrl?: string;
  googleFormSubmitBeforePayment?: boolean;
  paymentType?: 'converge' | 'clover' | 'externalLink';
  externalPaymentUrl?: string;
  googleFormOptions?: GoogleFormOptions;
  supportEmail?: string;
  supportPhone?: { label: string; href: string };
  taxes?: {
    enabled?: boolean;
    ratePercent?: number; // e.g. 8.25
    taxShipping?: boolean;
    defaultProductTaxable?: boolean;
  };
  delivery?: {
    enabled?: boolean;
    appsScriptUrl?: string;
    type?: 'flat' | 'uber' | 'doordash';
    flatFeeCents?: number;
    mode?: 'pickup' | 'delivery' | 'both';
    driverTipEnabled?: boolean; // shows an optional driver tip step during delivery checkout
    addressCapture?: {
      enabled?: boolean;
      required?: boolean;
      method?: 'googleForm' | 's3';
      googleFormEntryId?: string;
      s3Prefix?: string;
    };
  };
};

export type SiteProduct = {
  id: string;
  name: string;
  subtitle?: string;
  sku?: string;
  category?: string;          // used for tab grouping in ProductShop
  price: number;              // cents
  compareAtPrice?: number;
  currency?: string;
  thumbnailUrl?: string;
  images?: ProductImage[];
  summary?: string;
  description?: string;
  features?: string[];
  badges?: string[];
  stock?: 'in_stock' | 'low_stock' | 'out_of_stock';
  quantityAvailable?: number;
  options?: ProductOptions[];
  colors?: ProductColor[];
  maxQuantity?: number;
  taxable?: boolean;
  featured?: boolean;         // shows in Best Sellers strip on All tab
  hideFromShop?: boolean;     // excluded from ProductShop, still listable via ProductListings
  ctaLabel?: string;
  purchaseUrl?: string;
};

export type SiteProductsConfig = {
  showFilters?: boolean;
  /** Optional UI ordering for category tabs (first → last). */
  categoryOrder?: string[];
  items: SiteProduct[];
};

export type ProductShopSection = SectionBase & {
  type: 'productShop';
  title?: string;
  subtitle?: string;
};

export type SendAMessageFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select';

export type SendAMessageField = {
  id: string;
  label: string;
  type: SendAMessageFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for 'select' type
};

export type SendAMessageSubmission =
  | { type: 'resend'; recipientEmail?: string }
  | {
      type: 'googleForm';
      /** Base form URL — viewform or formResponse, both work */
      formUrl: string;
      /** Maps your field `id` → Google Form entry ID (e.g. "entry.547818426") */
      fieldMap: Record<string, string>;
    };

export type SendAMessageSection = SectionBase & {
  type: 'sendAMessage';
  title?: string;
  subtitle?: string;
  description?: string;
  fields: SendAMessageField[];
  submitLabel?: string;
  successTitle?: string;
  successMessage?: string;
  /** @deprecated use submission: { type: 'resend', recipientEmail } instead */
  recipientEmail?: string;
  submission?: SendAMessageSubmission; // defaults to resend if omitted
  backgroundUrl?: string;  // optional hero-style background image
  overlayOpacity?: number; // 0–100, default 50
};

export type ProductListingsSection = SectionBase & {
  id: string;
  type: 'productListings';
  title?: string;
  subtitle?: string;
  /** Ordered list of product IDs resolved from config.products.items */
  productIds: string[];
  viewType?: 'list' | 'featured'; // default 'featured'
  style?: ProductListingsStyle;
  showAllThreshold?: number;     // default 3 — show "Show all" if > threshold
  buyCtaFallback?: string;       // default "Buy Now"
};

// ---- Classes (separate from Products: time-slot bookings, not one-off purchases) ----

export type ClassTime = {
  id: string;
  date: string;         // ISO date, e.g. "2026-03-04"
  startTime: string;    // "18:00"
  endTime?: string;     // "19:30"
  capacity?: number;    // max bookings for this slot; undefined = unlimited
  location?: string;    // e.g. "123 Main St, Studio B"
  label?: string;       // optional note, e.g. "Beginners"
};

export type ClassItem = {
  id: string;
  name: string;
  category?: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  images?: ProductImage[];
  price: number;                // base price, cents
  compareAtPrice?: number;
  currency?: string;
  options?: ProductOptions[];   // e.g. Size: 4x4 / 5x5 / 6x6, each with its own price
  /**
   * Bookable times owned by this class. Canonical field — every reader
   * should use this. Populated automatically (even for old-shape stored
   * configs) by `normalizeSiteConfig`, which resolves it from the legacy
   * `classTimeIds` + shared `classTimes` pool below if not already present.
   * Empty = not scheduled yet.
   */
  times?: ClassTime[];
  /** @deprecated legacy FK list into `config.classes.classTimes`; superseded by `times`. Kept only so old stored configs keep normalizing correctly. */
  classTimeIds?: string[];
  badges?: string[];
  ctaLabel?: string;            // button label; defaults to the section's buyCtaFallback
};

export type SiteClassesConfig = {
  classItems: ClassItem[];
  /** @deprecated legacy shared pool that `classItem.classTimeIds` used to reference; superseded by `ClassItem.times`. Kept only so old stored configs keep normalizing correctly. */
  classTimes?: ClassTime[];
  locations?: string[];         // reusable location names, offered as a dropdown when scheduling a class time
};

// Single class, shown directly on the page (image, description, options,
// calendar time picker, book button) — not a browsable grid or a modal.
export type ClassDetailSection = SectionBase & {
  id: string;
  type: 'classDetail';
  /** Which class to display, resolved from config.classes.classItems */
  classItemId?: string;
  buyCtaFallback?: string;      // default "Book Now"
};

// All scheduled classes (config.classes.classItems with >= 1 assigned time),
// shown as tabs with the selected class's detail below. Tabs are hidden when
// only one class qualifies.
export type ClassListSection = SectionBase & {
  id: string;
  type: 'classList';
  title?: string;
  subtitle?: string;
  buyCtaFallback?: string;      // default "Book Now"
};

export type PersonItem = {
  name: string;
  title?: string;              // e.g., "CEO", "Senior Developer", "Mentor"
  description?: string;        // bio or description
  avatarUrl?: string;          // image URL
  badges?: string[];           // qualifications, labels, certifications
};

export type PersonsStyle = {
  columns?: 2 | 3 | 4;        // grid columns (default responsive)
  cardVariant?: 'default' | 'ink'; // card style
  rounded?: 'lg' | 'xl' | '2xl';   // rounded corners
  align?: 'left' | 'center';       // text alignment
};

export type PersonsSection = SectionBase & {
  id: string;
  type: 'persons';
  title?: string;              // header
  subtitle?: string;           // description
  items: PersonItem[];
  style?: PersonsStyle;
};

// Not user-addable — built at render time from settings.general.siteDisabled
// (see getSiteDisabledSection in src/lib/siteConfigSections.ts).
export type SiteDisabledSection = SectionBase & {
  id: string;
  type: 'siteDisabled';
  title?: string;
  message?: string;
  logoImage?: string;
  logoRounded?: boolean;
  logoSize?: 'sm' | 'md' | 'lg';
  socials?: SocialItem[];
};
