import type { AnySection, ClassItem, ClassTime, FooterSection, HeaderSection, SiteConfig, SiteClassesConfig, SiteDisabledSection, SiteDisabledSettings, SitePage, SocialItem } from '@/types/site';

export function createDefaultHeaderSection(): HeaderSection {
  return {
    id: 'hdr',
    type: 'header',
    logoText: 'Site-Crafter',
    logoImage: '',
    links: [],
    cta: { label: '', href: '' },
    style: { sticky: true, blur: true, elevation: 'sm', transparent: false },
  };
}

export function createDefaultFooterSection(): FooterSection {
  return {
    id: 'ftr',
    type: 'footer',
    columns: [],
    legal: '',
  };
}

function isHeaderOrFooter(section: AnySection | undefined | null): section is HeaderSection | FooterSection {
  return !!section && (section.type === 'header' || section.type === 'footer');
}

// Every class item is meant to own its bookable times directly (`times`).
// Older stored configs instead have a flat `classTimeIds` FK list resolved
// against a separate shared `classes.classTimes` pool — this derives `times`
// from that legacy shape on every read, without touching the legacy fields,
// so old data keeps working and new code only ever has to look at `times`.
export function normalizeClassItems(classes: SiteClassesConfig | undefined): ClassItem[] {
  const items = classes?.classItems ?? [];
  const pool = classes?.classTimes ?? [];
  if (pool.length === 0) {
    // Nothing to resolve legacy ids against — still guarantee `times` exists.
    return items.map((item) => (item.times ? item : { ...item, times: [] }));
  }
  const poolById = new Map(pool.map((t) => [t.id, t]));
  return items.map((item) => {
    if (item.times) return item; // already in the new shape
    const legacyIds = item.classTimeIds ?? [];
    const times = legacyIds
      .map((id) => poolById.get(id))
      .filter((t): t is ClassTime => !!t);
    return { ...item, times };
  });
}

export function normalizeSiteConfig(input: SiteConfig): SiteConfig {
  const rawSections = Array.isArray(input.sections) ? input.sections : [];

  const headerFromSections = rawSections.find((s) => s.type === 'header') as HeaderSection | undefined;
  const footerFromSections = rawSections.find((s) => s.type === 'footer') as FooterSection | undefined;

  const header = input.header ?? headerFromSections ?? createDefaultHeaderSection();
  const footer = input.footer ?? footerFromSections ?? createDefaultFooterSection();

  const showHeader =
    typeof input.showHeader === 'boolean'
      ? input.showHeader
      : headerFromSections?.visible === false
        ? false
        : true;

  const showFooter =
    typeof input.showFooter === 'boolean'
      ? input.showFooter
      : footerFromSections?.visible === false
        ? false
        : true;

  const sections = rawSections.filter((s) => !isHeaderOrFooter(s));

  // Non-destructive: keeps `classItems`/`classTimes`/`classTimeIds` exactly
  // as stored (the admin UI still reads/writes those directly for now) and
  // only adds `times` alongside them.
  const classes: SiteClassesConfig | undefined = input.classes
    ? { ...input.classes, classItems: normalizeClassItems(input.classes) }
    : input.classes;

  return {
    ...input,
    header: { ...createDefaultHeaderSection(), ...header },
    footer: { ...createDefaultFooterSection(), ...footer },
    showHeader,
    showFooter,
    sections,
    classes,
  };
}

export const SITE_DISABLED_DEFAULT_TITLE = 'We’ll Be Back Soon';
export const SITE_DISABLED_DEFAULT_MESSAGE =
  'Our site is temporarily unavailable. Follow us on social media for the latest updates.';

/** Reads settings.general.siteDisabled defensively — `general` is free-form JSON. */
export function getSiteDisabledSettings(config: SiteConfig | null | undefined): SiteDisabledSettings {
  const raw = config?.settings?.general?.siteDisabled;
  if (!raw || typeof raw !== 'object') return {};
  const { enabled, title, message, logoImage, logoRounded, logoSize, socials } = raw as Record<string, unknown>;
  return {
    enabled: enabled === true,
    title: typeof title === 'string' ? title : undefined,
    message: typeof message === 'string' ? message : undefined,
    logoImage: typeof logoImage === 'string' ? logoImage : undefined,
    logoRounded: logoRounded === true,
    logoSize: logoSize === 'sm' || logoSize === 'md' || logoSize === 'lg' ? logoSize : undefined,
    socials: Array.isArray(socials) ? (socials as SocialItem[]) : [],
  };
}

/** Returns the lone section to render while the site is disabled, or null when the site is live. */
export function getSiteDisabledSection(config: SiteConfig): SiteDisabledSection | null {
  const settings = getSiteDisabledSettings(config);
  if (!settings.enabled) return null;

  return {
    id: 'site-disabled',
    type: 'siteDisabled',
    title: settings.title?.trim() || SITE_DISABLED_DEFAULT_TITLE,
    message: settings.message?.trim() || SITE_DISABLED_DEFAULT_MESSAGE,
    logoImage: settings.logoImage?.trim() || undefined,
    logoRounded: settings.logoRounded,
    logoSize: settings.logoSize ?? 'md',
    socials: (settings.socials ?? []).filter((s) => s.href?.trim()),
  };
}

export function getRenderableSections(config: SiteConfig): AnySection[] {
   console.log("Site config loaded:", config);
  const disabled = getSiteDisabledSection(config);
  if (disabled) return [disabled];

  const normalized = normalizeSiteConfig(config);
  const out: AnySection[] = [];

  if (normalized.showHeader !== false && normalized.header) {
    out.push({ ...normalized.header, visible: true });
  }
  out.push(...(normalized.sections ?? []));
  if (normalized.showFooter !== false && normalized.footer) {
    out.push({ ...normalized.footer, visible: true });
  }

  return out;
}

export type AdminSectionSlot =
  | { kind: 'header'; section: HeaderSection; show: boolean }
  | { kind: 'section'; index: number; section: AnySection }
  | { kind: 'footer'; section: FooterSection; show: boolean };

export function getAdminSectionSlots(config: SiteConfig): AdminSectionSlot[] {
  const normalized = normalizeSiteConfig(config);
  const slots: AdminSectionSlot[] = [
    { kind: 'header', section: normalized.header!, show: normalized.showHeader !== false },
    ...(normalized.sections ?? []).map((s, index) => ({ kind: 'section' as const, index, section: s })),
    { kind: 'footer', section: normalized.footer!, show: normalized.showFooter !== false },
  ];
  return slots;
}

/** Returns the sections to render for a custom page (with shared header/footer). Returns null if slug not found. */
export function getRenderablePageSections(config: SiteConfig, slug: string): AnySection[] | null {
  // Every URL shows the unavailable notice (instead of "Page not found") while disabled.
  const disabled = getSiteDisabledSection(config);
  if (disabled) return [disabled];

  const normalized = normalizeSiteConfig(config);
  const page = normalized.pages?.find((p) => p.slug === slug);
  if (!page) return null;

  const out: AnySection[] = [];
  if (normalized.showHeader !== false && normalized.header) {
    out.push({ ...normalized.header, visible: true });
  }
  out.push(...page.sections);
  if (normalized.showFooter !== false && normalized.footer) {
    out.push({ ...normalized.footer, visible: true });
  }
  return out;
}

/** Returns only the body slots for a page (no header/footer) — used by the admin editor. */
export function getAdminPageSectionSlots(config: SiteConfig, pageIndex: number): AdminSectionSlot[] {
  const normalized = normalizeSiteConfig(config);
  const page = normalized.pages?.[pageIndex];
  if (!page) return [];
  return page.sections.map((s, index) => ({ kind: 'section' as const, index, section: s }));
}

// Re-export SitePage so callers can import from here
export type { SitePage };
