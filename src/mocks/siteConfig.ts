// src/mocks/siteConfig.NEW.ts
import type { SiteConfig } from "@/types/site";

// Image imports (replace paths/names as needed)
import main from "../../public/NEW/main.jpg";
import bg from "../../public/NEW/bg.jpg";
import image1 from "../../public/NEW/img1.png";
import image2 from "../../public/NEW/img2.png";
import image3 from "../../public/NEW/img3.png";
import image4 from "../../public/NEW/img4.png";

export const mockSiteConfig: SiteConfig = {
  theme: { preset: "grove", radius: "xl" }, // presets: 'ocean' | 'sunset' | 'forest' | 'slate' | 'festival' | 'candy' | 'neon' | 'grove'
  meta: {
    title: "NEW SITE TITLE",
    description: "Short 1–2 sentence description for SEO and social.",
    favicon: "/favicon.ico",
  },
  sections: [
    // HEADER
    {
      visible: true,
      id: "hdr",
      type: "header",
      logoText: "Brand / Person",
      links: [
        { label: "About", href: "#about" },
        { label: "Services", href: "#services" },
        { label: "Experience", href: "#credentials" },
        { label: "Contact", href: "#contact" },
      ],
      cta: { label: "Primary CTA", href: "#" },
      style: { sticky: false, blur: true, elevation: "sm", transparent: false },
    },

    // OPTIONAL FLOATING/SECTIONAL
    {
      visible: true,
      id: "floating",
      type: "sectional",
      title: "Punchy headline / value prop",
      body: "",
      backgroundUrl: bg.src,
      overlay: true,
      height: "sm", // 'sm' | 'md' | 'lg'
    },

    // HERO
    {
      visible: true,
      id: "hero",
      type: "hero",
      eyebrow: "Short qualifier",
      title: "Main Headline",
      subtitle: "Supportive subheadline that explains the value succinctly.",
      primaryCta: { label: "Primary CTA", href: "#" },
      secondaryCta: { label: "Secondary CTA", href: "#contact" },
      imageUrl: main.src,
    },

    // ABOUT
    {
      visible: true,
      id: "about",
      type: "about",
      title: "About",
      body:
        "1–3 short paragraphs. Keep it friendly and scannable. Can include location, approach, specialties.",
      imageUrl: "",
    },

    // FEATURES / PROJECTS / SERVICES
    {
      visible: true,
      id: "features",
      type: "features",
      title: "What I Do",
      items: [
        {
          title: "Service or Project",
          body: "1–2 sentence description.",
          imageUrl: image1.src,
          meta: [
            { label: "Type", value: "Consulting" },
            { label: "Status", value: "Open" },
          ],
        },
        {
          title: "Service or Project",
          body: "Another description.",
          imageUrl: image2.src,
        },
      ],
    },

    // CTA (OPTIONAL)
    {
      visible: true,
      id: "cta",
      type: "cta",
      title: "Ready to work together?",
      body: "Short prompt leading into your primary action.",
      cta: { label: "Get in touch", href: "#contact" },
    },

    // OPTIONAL SECOND SECTIONAL
    {
      visible: true,
      id: "floating2",
      type: "sectional",
      title: "A short quote or differentiator",
      body: "- Attribution",
      backgroundUrl: bg.src,
      overlay: true,
    },

    // CREDENTIALS (FEATURES-LIKE)
    {
      visible: true,
      id: "credentials",
      type: "features",
      title: "Degrees, Certifications, & Experience",
      items: [
        {
          title: "Degree or Certification",
          body: "Issuing institution or summary.",
          meta: [{ label: "Location", value: "City, ST" }],
        },
        { title: "Certification", body: "Issuer / brief summary" },
        { title: "Experience", body: "Short summary of relevant work." },
      ],
    },

    // SKILLS (GRID)
    {
      visible: true,
      id: "skills",
      type: "skills",
      title: "Core Skills & Attributes",
      subtitle: "What I bring to every engagement",
      items: [
        { title: "Skill One", body: "Short blurb.", imageUrl: image3.src },
        { title: "Skill Two", body: "Short blurb.", imageUrl: image4.src },
      ],
      columns: 2, // 2 or 3
    },

    // CONTACT
    {
      visible: true,
      id: "contact",
      type: "contact",
      title: "Contact",
      email: "hello@example.com",
      address: "City, ST",
      backgroundUrl: bg.src,
      socials: [
        { label: "LinkedIn", href: "#" },
        { label: "Email", href: "mailto:hello@example.com" },
      ],
    },

    // DISCLAIMER (OPTIONAL)
    {
      visible: true,
      id: "disclaimer",
      type: "disclaimer",
      title: "Disclaimer",
      body:
        "Information on this site is for educational purposes only and is not a substitute for professional advice.",
      enabled: false,
    },

    // FOOTER
    {
      visible: true,
      id: "ftr",
      type: "footer",
      columns: [
        {
          title: "Explore",
          links: [
            { label: "About", href: "#about" },
            { label: "Services", href: "#features" },
            { label: "Credentials", href: "#credentials" },
          ],
        },
        {
          title: "Connect",
          links: [
            { label: "LinkedIn", href: "#" },
            { label: "Email", href: "mailto:hello@example.com" },
          ],
        },
      ],
      legal: "© 2025 NEW NAME. All rights reserved.",
    },
  ],
};
