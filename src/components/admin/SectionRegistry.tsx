// src/components/admin/SectionRegistry.ts
import type {
  AnySection,
  HeroSection,
  GallerySection,
  VideoSection,
} from '@/types/site';

export type EditorBaseProps<T extends AnySection> = {
  section: T;
  onChange: (next: T) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
};

type RegistryItem<T extends AnySection> = {
  label: string;
  allowed: boolean;
  create: () => T;
  // Optional specialized editor component (we can add later per type)
  Editor?: (props: EditorBaseProps<T>) => JSX.Element;
};

const rid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

/** Minimal registry: add more types later; generic fallback will handle the rest */
export const sectionRegistry: Partial<Record<AnySection['type'], RegistryItem<AnySection>>> = {
  hero: {
    label: 'Hero',
    allowed: true,
    create: (): HeroSection => ({
      id: rid('hero'),
      type: 'hero',
      visible: true,
      title: 'New Hero',
      subtitle: '',
      imageUrl: '',
    }),
  },
  gallery: {
    label: 'Gallery',
    allowed: true,
    create: (): GallerySection => ({
      id: rid('gallery'),
      type: 'gallery',
      visible: true,
      title: 'Gallery',
      subtitle: 'Selected work',
      style: { columns: 3, rounded: 'xl', gap: 'md' },
      items: [],
    }),
  },
  video: {
    label: 'Video',
    allowed: true,
    create: (): VideoSection => ({
      id: rid('video'),
      type: 'video',
      visible: true,
      title: 'Video',
      source: { type: 'url', href: '' },
      controls: true,
      autoplay: false,
      muted: false,
      loop: false,
      style: { aspect: '16/9', rounded: 'xl', shadow: 'md', background: 'default' },
    }),
  },
  // Add more entries later; leave them out or set allowed:false until ready
};
