'use client';

import { useMemo, useRef, useState } from 'react';
import { useSite } from '@/context/SiteContext';
import { getSiteId } from '@/lib/siteId';
import { THEME_PRESETS, type SiteStyle, type ThemePreset, type ThemeColors, type SiteConfig, type FontPair } from '@/types/site';
import { FONT_PAIRS, FONT_PAIR_KEYS } from '@/lib/fontPairs';

type ColorField = {
  key: keyof Pick<SiteStyle, 'primary' | 'accent' | 'bg' | 'bg2' | 'fg' | 'muted' | 'text1' | 'text2'>;
  label: string;
  cssVar: string;
};

const COLOR_FIELDS: ColorField[] = [
  { key: 'primary', label: '--primary', cssVar: '--primary' },
  { key: 'accent', label: '--accent', cssVar: '--accent' },
  { key: 'bg', label: '--bg', cssVar: '--bg' },
  { key: 'bg2', label: '--bg-2', cssVar: '--bg-2' },
  { key: 'fg', label: '--fg', cssVar: '--fg' },
  { key: 'muted', label: '--muted', cssVar: '--muted' },
  { key: 'text1', label: '--text-1', cssVar: '--text-1' },
  { key: 'text2', label: '--text-2', cssVar: '--text-2' },
];

export default function AdminThemePanel() {
  const { config, setStyle, setConfig } = useSite();
  const [showColors, setShowColors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const originalThemeRef = useRef<SiteConfig['theme'] | null>(null);
  const siteId = getSiteId();

  const currentPreset = config?.theme?.preset ?? 'ocean';
  const currentFontPair: FontPair = config?.theme?.fontPair ?? 'inter';
  const isCustom = currentPreset === 'custom';
  const options = useMemo(() => THEME_PRESETS, []);

  const currentColors = useMemo(() => {
    const theme = config?.theme ?? { preset: 'ocean' as ThemePreset };
    const colors = theme.colors ?? {};
    return {
      primary: colors.primary ?? '',
      accent: colors.accent ?? '',
      bg: colors.bg ?? '',
      bg2: colors.bg2 ?? '',
      fg: colors.fg ?? '',
      muted: colors.muted ?? '',
      text1: colors.text1 ?? '',
      text2: colors.text2 ?? '',
    };
  }, [config?.theme]);

  const [localColors, setLocalColors] = useState(currentColors);

  function syncLocalFromTheme() {
    if (typeof window === 'undefined') {
      setLocalColors(currentColors);
      return;
    }
    const styles = getComputedStyle(document.body);
    const read = (v: string) => styles.getPropertyValue(v).trim();
    setLocalColors({
      primary: read('--primary') || currentColors.primary,
      accent: read('--accent') || currentColors.accent,
      bg: read('--bg') || currentColors.bg,
      bg2: read('--bg-2') || currentColors.bg2,
      fg: read('--fg') || currentColors.fg,
      muted: read('--muted') || currentColors.muted,
      text1: read('--text-1') || currentColors.text1,
      text2: read('--text-2') || currentColors.text2,
    });
  }

  function applyColors() {
    if (!config) return;
    const nextColors: ThemeColors = { ...localColors };
    setConfig({
      ...config,
      theme: {
        ...config.theme,
        preset: 'custom',
        colors: nextColors,
      },
    });
    setShowColors(false);
  }

  const themeDirty = useMemo(() => {
    if (!config?.theme) return false;
    if (!originalThemeRef.current) return false;
    return JSON.stringify(config.theme) !== JSON.stringify(originalThemeRef.current);
  }, [config?.theme]);

  if (config?.theme && !originalThemeRef.current) {
    originalThemeRef.current = config.theme;
  }

  async function saveTheme() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const variant = (process.env.NEXT_PUBLIC_CONFIG_VARIANT ?? 'draft') as 'draft' | 'published';
      const url = `/api/admin/config/${encodeURIComponent(siteId)}?variant=${variant}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-local-admin': '1',
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Save failed with HTTP ${res.status}`);
      }

      const saved = (await res.json()) as SiteConfig;
      setConfig(saved);
      originalThemeRef.current = saved.theme;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed bottom-2 min-h-[69px] right-0 z-[10000] flex justify-center">
      <div className="card admin-card card-solid px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold">Theme</div>
        <select
          className="select min-w-[180px] text-black"
          value={currentPreset}
          onChange={(e) => {
            const next = e.target.value as ThemePreset;
            if (next !== 'custom') {
              setStyle({ preset: next });
              if (config) {
                setConfig({
                  ...config,
                  theme: { ...config.theme, preset: next, colors: undefined },
                });
              }
            } else {
              setStyle({ preset: next });
              if (config) {
                setConfig({
                  ...config,
                  theme: { ...config.theme, preset: next },
                });
              }
            }
          }}
        >
          {options.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          className="select min-w-[200px] text-black"
          value={currentFontPair}
          onChange={(e) => {
            const next = e.target.value as FontPair;
            if (config) {
              setConfig({
                ...config,
                theme: { ...config.theme, fontPair: next },
              });
            }
          }}
        >
          {FONT_PAIR_KEYS.map((key) => (
            <option key={key} value={key}>{FONT_PAIRS[key].label}</option>
          ))}
        </select>

        {isCustom && (
          <button
            className="btn btn-inverted"
            onClick={() => {
              syncLocalFromTheme();
              setShowColors(true);
            }}
          >
            Edit colors
          </button>
        )}
        {themeDirty && (
        <div className="">
          <div className="flex items-center gap-2">
            {error && <div className="text-sm text-red-600 bg-white/90 px-3 py-2 rounded-lg border">{error}</div>}
            <button className="btn btn-primary" onClick={saveTheme} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
      </div>

      {showColors && (
        <div className="fixed inset-0 z-[12000] bg-black/50 flex items-center justify-center p-4">
          <div className="card admin-card card-solid p-6 relative w-full max-w-xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-lg">Custom Theme Colors</div>
              <button
                className="btn btn-ghost"
                onClick={() => setShowColors(false)}
                aria-label="Close color editor"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {COLOR_FIELDS.map((field) => (
                <label key={field.key} className="space-y-2">
                  <div className="text-sm font-medium">{field.label}</div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-12 rounded-md border border-gray-200 p-1 bg-white"
                      value={localColors[field.key] || '#000000'}
                      onChange={(e) =>
                        setLocalColors((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      aria-label={`${field.label} color picker`}
                    />
                    <input
                      className="input w-full"
                      value={localColors[field.key] ?? ''}
                      onChange={(e) =>
                        setLocalColors((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.cssVar}
                    />
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setShowColors(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={applyColors}>
                Apply
              </button>
            </div>
            
          </div>
        </div>
      )}

      
    </div>
  );
}
