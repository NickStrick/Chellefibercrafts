'use client';

import type {
  AnySection,
} from '@/types/site';

import { EditTestimonials } from './fields/TestimonialEditor';
import { EditHero } from './fields/HeroEditor';
import { EditHeader } from './fields/HeaderEditor';
import { EditSectional } from './fields/SectionalEditor';
import { EditAbout } from './fields/AboutEditor';
import { EditCTA } from './fields/CTAEditor';
import { EditVideo } from './fields/VideoEditor';
import  EditGallery  from './fields/GalleryEditor';
import EditFeatures from './fields/FeaturesEditor';
import EditContact from './fields/ContactEditor';
import EditFooter from './fields/FooterEditor';
import EditStats from './fields/StatsEditor';   
import EditInstagram from './fields/InstagramEditor';
import EditPricing from './fields/PricingEditor';
import EditPartners from './fields/PartnersEditor';
import EditShare from './fields/ShareEditor';
import EditScheduling from './fields/SchedulingEditor';
import EditNewsletter from './fields/NewsletterEditor';
import EditDisclaimer from './fields/DisclaimerEditor';
import EditProductListings from './fields/EditProductListings';
import EditPersons from './fields/PersonsEditor';
import EditSendAMessage from './fields/SendAMessageEditor';
import EditProductShop from './fields/ProductShopEditor';
import EditSocials from './fields/SocialsEditor';
import EditSkills from './fields/SkillsEditor';
import EditPageLinks from './fields/PageLinksEditor';
import EditBannerCarousel from './fields/BannerCarouselEditor';
import EditClassDetail from './fields/EditClassDetail';
import EditClassList from './fields/EditClassList';

// -----------------------------
// Shared types & helpers
// -----------------------------
export type EditorSharedProps = {
  /** Promise-based bridge into your MediaPicker modal */
  openMediaPicker: (prefix: string) => Promise<string | null>;
  /** Multi-select variant; resolves with the picked keys (or null if cancelled). */
  openMediaPickerMulti?: (prefix: string, initialSelected?: string[]) => Promise<string[] | null>;
  /** Current site namespace (e.g., "carole") */
  siteId: string;
};

export type EditorProps<T extends AnySection> = EditorSharedProps & {
  section: T;
  onChange: (next: T) => void;
};

// function deepClone<T>(obj: T): T {
//   return JSON.parse(JSON.stringify(obj)) as T;
// }
// -----------------------------
// Registry
// -----------------------------
export type EditorComponent<T extends AnySection = AnySection> = (props: EditorProps<T>) => JSX.Element;

export const SECTION_EDITORS: Partial<Record<AnySection['type'], EditorComponent<AnySection>>> = {
  hero: EditHero as EditorComponent<AnySection>,
  gallery: EditGallery as EditorComponent<AnySection>,
  video: EditVideo as EditorComponent<AnySection>,

  // Starter extra editors
  cta: EditCTA as EditorComponent<AnySection>,
  about: EditAbout as EditorComponent<AnySection>,
  header: EditHeader as EditorComponent<AnySection>,
  sectional: EditSectional as EditorComponent<AnySection>,
  testimonials: EditTestimonials as EditorComponent<AnySection>,
  features: EditFeatures as EditorComponent<AnySection>,
  contact: EditContact as EditorComponent<AnySection>,
  footer: EditFooter as EditorComponent<AnySection>,
  stats: EditStats as EditorComponent<AnySection>,
  instagram: EditInstagram as EditorComponent<AnySection>, 
  pricing: EditPricing as EditorComponent<AnySection>,
  partners: EditPartners as EditorComponent<AnySection>,
  share: EditShare as EditorComponent<AnySection>,
  scheduling: EditScheduling as EditorComponent<AnySection>,
  newsletter: EditNewsletter as EditorComponent<AnySection>,
  disclaimer: EditDisclaimer as EditorComponent<AnySection>,
  productListings: EditProductListings as EditorComponent<AnySection>,
  persons: EditPersons as EditorComponent<AnySection>,
  sendAMessage: EditSendAMessage as EditorComponent<AnySection>,
  productShop: EditProductShop as EditorComponent<AnySection>,
  socials: EditSocials as EditorComponent<AnySection>,
  skills: EditSkills as EditorComponent<AnySection>,
  pageLinks: EditPageLinks as EditorComponent<AnySection>,
  bannerCarousel: EditBannerCarousel as EditorComponent<AnySection>,
  classDetail: EditClassDetail as EditorComponent<AnySection>,
  classList: EditClassList as EditorComponent<AnySection>,
  // Add more as you implement them…
};

export function getEditorForSection(section: AnySection) {
  return SECTION_EDITORS[section.type];
}
