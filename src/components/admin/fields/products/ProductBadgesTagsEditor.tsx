'use client';

type LocalProduct = {
  _id: string;
  badges: string[];
};

export default function ProductBadgesTagsEditor({
  product,
  onUpdate,
}: {
  product: LocalProduct;
  onUpdate: (patch: Partial<LocalProduct>) => void;
}) {
  const addBadge = () => onUpdate({ badges: [...(product.badges ?? []), ''] });
  const updateBadge = (idx: number, value: string) => {
    const next = (product.badges ?? []).slice();
    next[idx] = value;
    onUpdate({ badges: next });
  };
  const removeBadge = (idx: number) =>
    onUpdate({ badges: (product.badges ?? []).filter((_, i) => i !== idx) });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Badges</label>
        <button className="btn btn-ghost" onClick={addBadge}>Add badge</button>
      </div>

      <div className="space-y-2">
        {(product.badges ?? []).map((b, bi) => (
          <div key={`${product._id}-badge-${bi}`} className="grid grid-cols-[1fr_auto] gap-2">
            <input
              className="input"
              value={b}
              onChange={(e) => updateBadge(bi, e.target.value)}
              placeholder="e.g., New, Bestseller"
            />
            <button className="btn btn-ghost" onClick={() => removeBadge(bi)}>
              Remove
            </button>
          </div>
        ))}
        {(product.badges ?? []).length === 0 && (
          <div className="text-sm text-muted">No badges yet.</div>
        )}
      </div>
    </div>
  );
}
