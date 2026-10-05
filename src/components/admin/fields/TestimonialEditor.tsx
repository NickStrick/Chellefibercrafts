// --- add near your other imports ---
import type { AnySection, TestimonialsSection, TestimonialItem } from '@/types/site';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
// If you already have EditorProps / EditorSharedProps and deepClone in this file, reuse them.
// Otherwise, keep the same shapes you used for Hero/Gallery/Video editors:
type EditorSharedProps = {
  openMediaPicker: (prefix: string) => Promise<string | null>;
  siteId: string;
};
type EditorProps<T extends AnySection> = EditorSharedProps & {
  section: T;
  onChange: (next: T) => void;
};

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// -----------------------------
// Testimonials Editor
// -----------------------------
export function EditTestimonials({
  section,
  onChange,
  openMediaPicker,
  siteId,
}: EditorProps<TestimonialsSection>) {
  const items = section.items ?? [];

  const setItems = (next: TestimonialItem[]) =>
    onChange({ ...section, items: next });

  const updateItem = (idx: number, patch: Partial<TestimonialItem>) => {
    const next = deepClone(items);
    next[idx] = { ...next[idx], ...patch };
    setItems(next);
  };

  const addItem = () => {
    const next = [
      ...items,
      { quote: '', name: '', role: '', avatarUrl: '' } as TestimonialItem,
    ];
    setItems(next);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const to = idx + dir;
    if (to < 0 || to >= items.length) return;
    const next = deepClone(items);
    const [row] = next.splice(idx, 1);
    next.splice(to, 0, row);
    setItems(next);
  };

  const pickAvatar = async (idx: number) => {
    // You can change this prefix; keeping everything in assets is fine.
    const picked = await openMediaPicker(`configs/${siteId}/assets/`);
    if (picked) updateItem(idx, { avatarUrl: picked });
  };

  return (
    <div className="space-y-6">
      {/* Top-level fields */}
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="input w-full"
            value={section.title ?? ''}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            placeholder="What folks are saying"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Subtitle</label>
          <input
            className="input w-full"
            value={section.subtitle ?? ''}
            onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
            placeholder="Short supporting line"
          />
        </div>
      </div>

      {/* Items header */}
      <div className="flex items-center justify-between">
        <div className="font-medium">Items ({items.length})</div>
        <button className="btn btn-inverted" onClick={addItem}>
          <FontAwesomeIcon icon={faPlus} className="text-xs" />
          Add Testimonial
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={`${i}-${'item'}`} className="card admin-card card-solid p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-70">Item #{i + 1}</div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  <FontAwesomeIcon icon={faChevronUp} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => moveItem(i, 1)}
                  disabled={i === items.length - 1}
                  title="Move down"
                >
                  <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                </button>
                <button
                  className="btn btn-ghost text-red-600"
                  onClick={() => removeItem(i)}
                  title="Remove"
                >
                  <FontAwesomeIcon icon={faTrash} className="text-xs" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium">Quote</label>
                <textarea
                  className="textarea w-full"
                  rows={3}
                  value={it.quote}
                  onChange={(e) => updateItem(i, { quote: e.target.value })}
                  placeholder="“This team was incredible to work with...”"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  className="input w-full"
                  value={it.name}
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Role</label>
                <input
                  className="input w-full"
                  value={it.role ?? ''}
                  onChange={(e) => updateItem(i, { role: e.target.value })}
                  placeholder="Founder, Acme Co."
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium">Avatar URL</label>
                <div className="h-28 w-28 aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  {it.avatarUrl ? (
                    <img
                      src={resolveAssetUrl(it.avatarUrl) ?? it.avatarUrl}
                      alt="Image preview"
                      className="admin-image-preview"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted">
                      No image selected
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    value={it.avatarUrl ?? ''}
                    onChange={(e) => updateItem(i, { avatarUrl: e.target.value })}
                    placeholder="https://… or configs/{siteId}/assets/jane.jpg"
                  />
                  <button
                    type="button"
                    className="btn btn-inverted"
                    onClick={() => pickAvatar(i)}
                  >
                    Pick…
                  </button>
                </div>
                {it.avatarUrl && (
                  <div className="text-xs text-muted break-all mt-1">
                    {it.avatarUrl}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-sm text-muted">No testimonials yet.</div>
        )}
      </div>
    </div>
  );
}
