import type { AnySection } from '@/types/site';
export type EditorProps<T extends AnySection> = {
  section: T;
  onChange: (next: T) => void;
  openMediaPicker: (prefix: string) => Promise<string | null>;
  /** Opens the media picker in multi-select mode; resolves with the picked keys (or null if cancelled). */
  openMediaPickerMulti?: (prefix: string, initialSelected?: string[]) => Promise<string[] | null>;
  siteId: string;
};
export type EditorSharedProps = {
  openMediaPicker: (prefix: string) => Promise<string | null>;
  openMediaPickerMulti?: (prefix: string, initialSelected?: string[]) => Promise<string[] | null>;
  siteId: string;
};