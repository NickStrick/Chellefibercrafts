// src/components/admin/configRegistry.ts
import type {
  AnySection,
  HeaderSection,
  HeroSection,
  FeaturesSection,
  CTASection,
  NewsletterSection,
  ContactSection,
  SchedulingSection,
  FooterSection,
  TestimonialsSection,
  StatsSection,
  AboutSection,
  DisclaimerSection,
  SectionalSection,
  SkillsSection,
  PricingSection,
  ShareSection,
  PartnersSection,
  InstagramSection,
  GallerySection,
  SocialsSection,
  VideoSection,
  ProductListingsSection,
  PersonsSection,
  ProductShopSection,
  SendAMessageSection,
  PageLinksSection,
  BannerCarouselSection,
  ClassDetailSection,
  ClassListSection,
  SiteDisabledSection,
} from '@/types/site';

const newId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 7)}`;

export type SectionRegistryItem<T extends AnySection> = {
  label: string;
  allowed: boolean;
  create: () => T;
};

export type SectionRegistry = Record<AnySection['type'], SectionRegistryItem<AnySection>>;

// ✅ All existing section types included & allowed: true
export const SECTION_REGISTRY: SectionRegistry = {
  header: {
    label: 'Header',
    allowed: false,
    create: (): HeaderSection => ({
      id: newId('header'),
      type: 'header',
      visible: true,
      logoText: 'Site',
      links: [],
      cta: { label: '', href: '' }, 
      style: { sticky: true, blur: true, elevation: 'sm', transparent: false },
    }),
  },

  hero: {
    label: 'Hero',
    allowed: true,
    create: (): HeroSection => ({
      id: newId('hero'),
      type: 'hero',
      visible: true,
      eyebrow: '',
      title: 'New Hero',
      subtitle: '',
      primaryCta: undefined,
      secondaryCta: undefined,
      imageUrl: '',
    }),
  },

  features: {
    label: 'Features',
    allowed: true,
    create: (): FeaturesSection => ({
      id: newId('features'),
      type: 'features',
      visible: true,
      title: 'Features',
      items: [],
    }),
  },

  cta: {
    label: 'Call To Action',
    allowed: true,
    create: (): CTASection => ({
      id: newId('cta'),
      type: 'cta',
      visible: true,
      title: 'Ready?',
      body: '',
      cta: { label: 'Get Started', href: '#' },
    }),
  },

  newsletter: {
    label: 'Newsletter',
    allowed: true,
    create: (): NewsletterSection => ({
      id: newId('newsletter'),
      type: 'newsletter',
      visible: true,
      title: 'Join our newsletter',
      body: '',
      googleFormEmbedUrl: '',
    }),
  },

  contact: {
    label: 'Contact',
    allowed: true,
    create: (): ContactSection => ({
      id: newId('contact'),
      type: 'contact',
      visible: true,
      title: 'Contact Us',
      email: '',
      phone: undefined,
      address: '',
      mapEmbedUrl: '',
      backgroundUrl: '',
      socials: [],
    }),
  },

  scheduling: {
    label: 'Scheduling',
    allowed: true,
    create: (): SchedulingSection => ({
      id: newId('scheduling'),
      type: 'scheduling',
      visible: true,
      title: 'Book a time',
      body: '',
      calendlyUrl: 'https://calendly.com/your-handle',
    }),
  },

  footer: {
    label: 'Footer',
    allowed: false,
    create: (): FooterSection => ({
      id: newId('footer'),
      type: 'footer',
      visible: true,
      columns: [],
      legal: '',
    }),
  },

  testimonials: {
    label: 'Testimonials',
    allowed: true,
    create: (): TestimonialsSection => ({
      id: newId('testimonials'),
      type: 'testimonials',
      visible: true,
      title: 'What people say',
      subtitle: '',
      items: [],
      style: { variant: 'card', columns: 3, showQuoteIcon: true, rounded: 'xl', background: 'default' },
    }),
  },

  stats: {
    label: 'Stats',
    allowed: true,
    create: (): StatsSection => ({
      id: newId('stats'),
      type: 'stats',
      visible: true,
      title: 'By the numbers',
      subtitle: '',
      items: [],
      style: { align: 'left', columns: 3, compact: false, divider: 'none', color: 'default' },
    }),
  },

  about: {
    label: 'About',
    allowed: true,
    create: (): AboutSection => ({
      id: newId('about'),
      type: 'about',
      visible: true,
      title: 'About',
      body: '',
      imageUrl: '',
      bullets: [],
      align: 'left',
    }),
  },

  disclaimer: {
    label: 'Disclaimer',
    allowed: true,
    create: (): DisclaimerSection => ({
      id: newId('disclaimer'),
      type: 'disclaimer',
      visible: true,
      title: 'Disclaimer',
      body: '',
      enabled: true,
    }),
  },

  sectional: {
    label: 'Sectional',
    allowed: true,
    create: (): SectionalSection => ({
      id: newId('sectional'),
      type: 'sectional',
      visible: true,
      title: 'Section',
      body: '',
      backgroundUrl: '',
      overlay: false,
      align: 'left',
      subtitleAlign: 'center',
      height: 'md',
      motion: undefined,
    }),
  },

  skills: {
    label: 'Skills',
    allowed: true,
    create: (): SkillsSection => ({
      id: newId('skills'),
      type: 'skills',
      visible: true,
      title: 'Skills',
      subtitle: '',
      items: [],
      columns: 3,
    }),
  },

  pricing: {
    label: 'Pricing',
    allowed: true,
    create: (): PricingSection => ({
      id: newId('pricing'),
      type: 'pricing',
      visible: true,
      title: 'Pricing',
      subtitle: '',
      plans: [],
    }),
  },

  share: {
    label: 'Share (QR)',
    allowed: true,
    create: (): ShareSection => ({
      id: newId('share'),
      type: 'share',
      visible: true,
      title: 'Share this',
      subtitle: '',
      items: [],
      style: { variant: 'default', align: 'left', actions: true },
    }),
  },

  partners: {
    label: 'Partners',
    allowed: true,
    create: (): PartnersSection => ({
      id: newId('partners'),
      type: 'partners',
      visible: true,
      title: 'Partners',
      subtitle: '',
      items: [],
      style: { variant: 'cards', columns: 3, rounded: 'xl', background: 'default' },
    }),
  },

  instagram: {
    label: 'Instagram',
    allowed: true,
    create: (): InstagramSection => ({
      id: newId('instagram'),
      type: 'instagram',
      visible: true,
      title: 'Instagram',
      subtitle: '',
      items: [],
      align: 'center',
      maxWidth: 640,
      rounded: 'xl',
      columns: 1,
      orientation: 'profile',
    }),
  },

  gallery: {
    label: 'Gallery',
    allowed: true,
    create: (): GallerySection => ({
      id: newId('gallery'),
      type: 'gallery',
      visible: true,
      title: 'Gallery',
      subtitle: '',
      style: { columns: 3, rounded: 'xl', gap: 'md' },
      backgroundClass: undefined,
      items: [],
    }),
  },

  socials: {
    label: 'Socials',
    allowed: true,
    create: (): SocialsSection => ({
      id: newId('socials'),
      type: 'socials',
      visible: true,
      title: 'Connect with us',
      subtitle: '',
      items: [],
      style: { background: 'default', rounded: 'xl', size: 'md', gap: 'md', align: 'left' },
    }),
  },

  video: {
    label: 'Video',
    allowed: true,
    create: (): VideoSection => ({
      id: newId('video'),
      type: 'video',
      visible: true,
      title: 'Video',
      subtitle: '',
      source: { type: 'url', href: '' },
      posterUrl: '',
      controls: true,
      autoplay: false,
      muted: false,
      loop: false,
      style: { aspect: '16/9', rounded: 'xl', shadow: 'md', background: 'default' },
    }),
  },
    productListings: {
    label: 'Product Listings',
    allowed: true,
    create: (id = `productListings-${crypto.randomUUID().slice(0,6)}`): ProductListingsSection => ({
      id,
      type: 'productListings',
      title: 'Our Products',
      subtitle: 'Browse our offerings.',
      productIds: [],
      viewType: 'featured',
      style: { columns: 4, cardVariant: 'default', showBadges: true },
      showAllThreshold: 3,
      buyCtaFallback: 'Buy Now',
    }),
    // No Editor yet — your ConfigModal will show "No editor implemented…" until we add one.
  } as SectionRegistryItem<ProductListingsSection>,

  classDetail: {
    label: 'Class Detail',
    allowed: true,
    create: (id = `classDetail-${crypto.randomUUID().slice(0,6)}`): ClassDetailSection => ({
      id,
      type: 'classDetail',
      classItemId: undefined,
      buyCtaFallback: 'Book Now',
    }),
  } as SectionRegistryItem<ClassDetailSection>,

  classList: {
    label: 'Class List',
    allowed: true,
    create: (id = `classList-${crypto.randomUUID().slice(0,6)}`): ClassListSection => ({
      id,
      type: 'classList',
      title: 'Our Classes',
      subtitle: '',
      buyCtaFallback: 'Book Now',
    }),
  } as SectionRegistryItem<ClassListSection>,

  persons: {
    label: 'Persons',
    allowed: true,
    create: (): PersonsSection => ({
      id: newId('persons'),
      type: 'persons',
      visible: true,
      title: 'Our Team',
      subtitle: 'Meet the people behind our success.',
      items: [],
      style: { columns: 3, cardVariant: 'default', rounded: 'xl', align: 'center' },
    }),
  },

  productShop: {
    label: 'Product Shop',
    allowed: true,
    create: (): ProductShopSection => ({
      id: newId('productShop'),
      type: 'productShop',
      visible: true,
      title: 'Shop',
      subtitle: '',
    }),
  },

  sendAMessage: {
    label: 'Send a Message',
    allowed: true,
    create: (): SendAMessageSection => ({
      id: newId('sendAMessage'),
      type: 'sendAMessage',
      visible: true,
      title: 'Send Us a Message',
      subtitle: '',
      description: '',
      submitLabel: 'Send Message',
      successTitle: "We'll be in touch!",
      successMessage: "Your message has been received. We'll get back to you shortly.",
      fields: [
        { id: 'name', label: 'Name', type: 'text', placeholder: 'Your name', required: true },
        { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
        { id: 'message', label: 'Message', type: 'textarea', placeholder: 'How can we help?', required: true },
      ],
    }),
  },

  pageLinks: {
    label: 'Page Links',
    allowed: true,
    create: (): PageLinksSection => ({
      id: newId('pageLinks'),
      type: 'pageLinks',
      visible: true,
      title: 'Explore',
      subtitle: '',
      items: [],
      style: { align: 'center' },
    }),
  },

  bannerCarousel: {
    label: 'Banner Carousel (Ads/Links)',
    allowed: true,
    create: (): BannerCarouselSection => ({
      id: newId('bannerCarousel'),
      type: 'bannerCarousel',
      visible: true,
      items: [
        { title: '', body: '', backgroundUrl: '', overlay: true, imageUrl: '', href: '' },
      ],
      intervalMs: 5000,
    }),
  },

  // Toggled from Settings → General, never added to the section list.
  siteDisabled: {
    label: 'Site Unavailable',
    allowed: false,
    create: (): SiteDisabledSection => ({
      id: 'site-disabled',
      type: 'siteDisabled',
      title: '',
      message: '',
    }),
  },
};

// Helper to get an array of allowed types
export const getAllowedSectionTypes = (): AnySection['type'][] =>
  (Object.keys(SECTION_REGISTRY) as AnySection['type'][])
    .filter((t) => SECTION_REGISTRY[t].allowed);
