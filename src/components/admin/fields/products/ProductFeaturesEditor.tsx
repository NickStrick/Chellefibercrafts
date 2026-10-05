'use client';

type LocalProduct = {
  _id: string;
  features: string[];
};

export default function ProductFeaturesEditor({
  product,
  onUpdate,
}: {
  product: LocalProduct;
  onUpdate: (patch: Partial<LocalProduct>) => void;
}) {
  const addFeature = () => {
    onUpdate({ features: [...(product.features ?? []), ''] });
  };
  const updateFeature = (idx: number, value: string) => {
    const next = (product.features ?? []).slice();
    next[idx] = value;
    onUpdate({ features: next });
  };
  const removeFeature = (idx: number) => {
    onUpdate({ features: (product.features ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Features</label>
        <button className="btn btn-ghost" onClick={addFeature}>Add feature</button>
      </div>
      <div className="space-y-2">
        {(product.features ?? []).map((f, fi) => (
          <div key={`${product._id}-feature-${fi}`} className="grid grid-cols-[1fr_auto] gap-2">
            <input
              className="input"
              value={f}
              placeholder="Feature text"
              onChange={(e) => updateFeature(fi, e.target.value)}
            />
            <button className="btn btn-ghost" onClick={() => removeFeature(fi)}>
              Remove
            </button>
          </div>
        ))}
        {(product.features ?? []).length === 0 && (
          <div className="text-sm text-muted">No features yet. Click “Add feature”.</div>
        )}
      </div>
    </div>
  );
}
