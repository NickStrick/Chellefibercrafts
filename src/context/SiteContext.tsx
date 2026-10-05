// src/context/SiteContext.tsx
'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type { SiteConfig, SiteStyle, ThemePreset } from '@/types/site';
import { normalizeSiteConfig } from '@/lib/siteConfigSections';
import { FONT_PAIRS } from '@/lib/fontPairs';

type Ctx = {
  /** Current site configuration (null only before initial mount) */
  config: SiteConfig | null;

  /** Replace the entire SiteConfig (used by admin editor after saving) */
  setConfig: (next: SiteConfig) => void;

  /** Update just the theme/style portion (keeps existing behavior) */
  setStyle: (update: Partial<SiteStyle>) => void;

  /** Loading flag (true only if config is null) */
  isLoading: boolean;
};

const SiteCtx = createContext<Ctx>({
  config: null,
  setConfig: () => {},
  setStyle: () => {},
  isLoading: true,
});

export const useSite = () => useContext(SiteCtx);

export function SiteProvider({
  initial,
  children,
}: {
  initial: SiteConfig;
  children: React.ReactNode;
}) {
  const [config, _setConfig] = useState<SiteConfig>(() => normalizeSiteConfig(initial));

  // expose full-replacement setter while preserving previous API
  const setConfig = useCallback((next: SiteConfig) => _setConfig(normalizeSiteConfig(next)), []);

  // apply data-theme + runtime CSS vars (unchanged from your version)
  useEffect(() => {
    if (!config) return;
    const b = document.body;
    const preset = (config.theme.preset ?? 'ocean') as ThemePreset;
    b.setAttribute('data-theme', preset);
    const customColors =
      config.theme.preset === 'custom' ? config.theme.colors : undefined;
    const resolved = {
      primary: customColors?.primary ?? config.theme.primary,
      accent: customColors?.accent ?? config.theme.accent,
      bg: customColors?.bg ?? config.theme.bg,
      bg2: customColors?.bg2 ?? config.theme.bg2,
      fg: customColors?.fg ?? config.theme.fg,
      muted: customColors?.muted ?? config.theme.muted,
      text1: customColors?.text1 ?? config.theme.text1,
      text2: customColors?.text2 ?? config.theme.text2,
    };
    if (resolved.primary) b.style.setProperty('--primary', resolved.primary);
    else b.style.removeProperty('--primary');
    if (resolved.accent)  b.style.setProperty('--accent',  resolved.accent);
    else b.style.removeProperty('--accent');
    if (resolved.bg) b.style.setProperty('--bg', resolved.bg);
    else b.style.removeProperty('--bg');
    if (resolved.bg2) b.style.setProperty('--bg-2', resolved.bg2);
    else b.style.removeProperty('--bg-2');
    if (resolved.fg) b.style.setProperty('--fg', resolved.fg);
    else b.style.removeProperty('--fg');
    if (resolved.muted) b.style.setProperty('--muted', resolved.muted);
    else b.style.removeProperty('--muted');
    if (resolved.text1) b.style.setProperty('--text-1', resolved.text1);
    else b.style.removeProperty('--text-1');
    if (resolved.text2) b.style.setProperty('--text-2', resolved.text2);
    else b.style.removeProperty('--text-2');
    if (config.theme.radius)  b.style.setProperty('--radius',  radiusToPx(config.theme.radius));
    else b.style.removeProperty('--radius');

    // Font pair — set data-font attribute + inject/update Google Fonts link
    const fontPair = config.theme.fontPair ?? 'inter';
    b.setAttribute('data-font', fontPair);
    const fontDef = FONT_PAIRS[fontPair];
    let link = document.getElementById('site-font-link') as HTMLLinkElement | null;
    if (fontDef.googleUrl) {
      if (!link) {
        link = document.createElement('link');
        link.id = 'site-font-link';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
      link.href = fontDef.googleUrl;
    } else {
      link?.remove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.theme]);

  // keep your existing style-updater helper
  const setStyle = useCallback((update: Partial<SiteStyle>) =>
    _setConfig(prev => ({ ...prev, theme: { ...prev.theme, ...update } })), []);

  const value = useMemo<Ctx>(
    () => ({
      config,
      setConfig,
      setStyle,
      isLoading: !config,
    }),
    [config, setConfig, setStyle]
  );

  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}

function radiusToPx(r: NonNullable<SiteStyle['radius']>) {
  switch (r) {
    case 'sm': return '6px';
    case 'md': return '10px';
    case 'lg': return '14px';
    case 'xl': return '18px';
    case '2xl': return '24px';
    case 'full': return '9999px';
    default: return '16px';
  }
}
