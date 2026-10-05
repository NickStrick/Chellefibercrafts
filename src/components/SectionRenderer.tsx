// src/components/SectionRenderer.tsx
// 'use client';

import type {
  AnySection,
} from '@/types/site';

import Navbar from './sections/Navbar';
import { Hero } from './sections/Hero';
import { Features } from './sections/Features';
import { CTA } from './sections/CTA';
import { Newsletter } from './sections/Newsletter';
import { Contact } from './sections/Contact';
import { Scheduling } from './sections/Scheduling';
import { Footer } from './sections/Footer';
import { Testimonials } from './sections/Testimonials';
import { Stats } from './sections/Stats';
import { Disclaimer } from './sections/Disclaimer';
import { About } from './sections/About';
import Sectional from './sections/Sectional';
import Skills from './sections/Skills';
import Pricing from "./sections/Pricing";
import Share from "./sections/Share";
import  Partners  from './sections/Partners';
import InstagramEmbed from './sections/Instagram';
import GalleryClient from './sections/Gallery.client'; 
import Socials from './sections/Socials';
import Video from './sections/Video';
import ProductListings from './sections/ProductListings';
import Persons from './sections/Persons';
import ProductShop from './sections/ProductShop';
import SendAMessage from './sections/SendAMessage';
import PageLinks from './sections/PageLinks';
import BannerCarousel from './sections/BannerCarousel';
import ClassDetail from './sections/ClassDetail';
import ClassList from './sections/ClassList';
import SiteDisabled from './sections/SiteDisabled';

// Exhaustiveness helper (nice to have)
function assertNever(x: never): never {
  throw new Error(`Unhandled section type: ${JSON.stringify(x)}`);
}

export function SectionRenderer({ section }: { section: AnySection }) {
  if (section.visible === false) return null;

  switch (section.type) {
    case 'header': {
      // section is HeaderSection here
      return <Navbar />;
    }
    case 'hero': {
      // section is HeroSection
      return <Hero {...section} />;
    }
    case 'features': {
      // section is FeaturesSection
      return <Features {...section} />;
    }
    case 'cta': {
      // section is CTASection
      return <CTA {...section} />;
    }
    case 'newsletter': {
      // section is NewsletterSection
      return <Newsletter {...section} />;
    }
    case 'contact': {
      // section is ContactSection
      return <Contact {...section} />;
    }
    case 'scheduling': {
      // section is SchedulingSection
      return <Scheduling {...section} />;
    }
    case 'footer': {
      // section is FooterSection
      return <Footer {...section} />;
    }
    case 'testimonials': {
      // section is TestimonialsSection
      return <Testimonials {...section} />;
    }
    case 'stats': {
      // section is StatsSection
      return <Stats {...section} />;
    }
    case 'disclaimer': {
      // section is DisclaimerSection
      return <Disclaimer {...section} />;
    }
    case 'about': {
      // section is AboutSection
      return <About {...section} />;
    }
    case 'sectional': {
      // section is SectionalSection
      return <Sectional {...section} />;
    }
    case 'skills': {
      // section is SkillsSection
      return <Skills {...section} />;
    }
    case "pricing":{
      return <Pricing {...section} />;
    }
    case "share":{
      return <Share {...section} />;
    }
    case "partners":{
      return <Partners {...section} />;
    }
    case "instagram":{
      return <InstagramEmbed {...section}/>; 
    }
    case "gallery":{
      return <GalleryClient {...section}/>; 
    }
    case "socials":{
      return <Socials {...section}/>; 
    }
    case 'video': {
      return <Video {...section} />;
    }
    case 'productListings':{
      return <ProductListings key={section.id} {...section} />;
    }
    case 'persons': {
      return <Persons {...section} />;
    }
    case 'productShop': {
      return <ProductShop key={section.id} {...section} />;
    }
    case 'sendAMessage': {
      return <SendAMessage {...section} />;
    }
    case 'pageLinks': {
      return <PageLinks {...section} />;
    }
    case 'bannerCarousel': {
      return <BannerCarousel {...section} />;
    }
    case 'classDetail': {
      return <ClassDetail key={section.id} {...section} />;
    }
    case 'classList': {
      return <ClassList key={section.id} {...section} />;
    }
    case 'siteDisabled': {
      return <SiteDisabled {...section} />;
    }
    default: {
      // if you ever add a new type and forget to handle it,
      // TS will error here because `section` would not be `never`.
      return assertNever(section);
    }
  }
}
