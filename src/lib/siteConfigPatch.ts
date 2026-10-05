import type { AnySection, SiteConfig } from '@/types/site';
import { normalizeSiteConfig } from '@/lib/siteConfigSections';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep<T>(base: T, patch: Partial<T>): T {
  if (!isPlainObject(patch)) return patch as T;
  const baseObj = isPlainObject(base) ? base : {};
  const result = { ...(baseObj as Record<string, unknown>) } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (isPlainObject(value)) {
      const baseVal = result[key];
      result[key] = mergeDeep(baseVal as Record<string, unknown>, value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

type SectionPatch = Partial<AnySection> & { id?: string; _delete?: boolean };

function applySectionsPatch(base: AnySection[], patch: unknown): AnySection[] {
  if (!Array.isArray(patch)) return base;

  const next = [...base];
  for (const entry of patch) {
    if (!isPlainObject(entry)) continue;
    const sp = entry as SectionPatch;
    const id = sp.id;
    if (!id) continue;

    // Header/footer are not reorderable sections anymore; ignore attempts to add/move them via sections patches.
    if (sp.type === 'header' || sp.type === 'footer') {
      continue;
    }

    const idx = next.findIndex((s) => s.id === id);
    if (sp._delete) {
      if (idx >= 0) next.splice(idx, 1);
      continue;
    }

    if (idx >= 0) next[idx] = mergeDeep(next[idx], sp as Partial<AnySection>);
    else next.push(sp as AnySection);
  }

  return next;
}

export function applySiteConfigPatch(base: SiteConfig, patch: Partial<SiteConfig>): SiteConfig {
  const { sections, header, footer, showHeader, showFooter, ...rest } = patch as Partial<SiteConfig> & {
    sections?: unknown;
  };

  const merged = mergeDeep(base, { ...rest, header, footer, showHeader, showFooter });

  const nextSections =
    typeof sections === 'undefined'
      ? merged.sections
      : applySectionsPatch(Array.isArray(base.sections) ? base.sections : [], sections);

  // Ensure header/footer exist and never live inside sections.
  return normalizeSiteConfig({ ...merged, sections: nextSections });
}
