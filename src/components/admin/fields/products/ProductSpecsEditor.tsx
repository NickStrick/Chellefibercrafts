'use client';

type LocalSpec = { _id: string; label: string; value: string };
type LocalProduct = {
  _id: string;
  specs: LocalSpec[];
};

export default function ProductSpecsEditor({
  product,
  onUpdate,
}: {
  product: LocalProduct;
  onUpdate: (patch: Partial<LocalProduct>) => void;
}) {
  const addSpec = () => {
    const next = [...(product.specs ?? []), { _id: crypto.randomUUID(), label: '', value: '' }];
    onUpdate({ specs: next });
  };
  const updateSpec = (idx: number, patch: Partial<LocalSpec>) => {
    const next = (product.specs ?? []).slice();
    next[idx] = { ...next[idx], ...patch };
    onUpdate({ specs: next });
  };
  const removeSpec = (idx: number) => {
    onUpdate({ specs: (product.specs ?? []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Specs</label>
        <button className="btn btn-ghost" onClick={addSpec}>Add spec</button>
      </div>
      <div className="space-y-2">
        {(product.specs ?? []).map((sp, si) => (
          <div key={sp._id} className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              className="input"
              placeholder="Label"
              value={sp.label}
              onChange={(e) => updateSpec(si, { label: e.target.value })}
            />
            <input
              className="input"
              placeholder="Value"
              value={sp.value}
              onChange={(e) => updateSpec(si, { value: e.target.value })}
            />
            <button className="btn btn-ghost" onClick={() => removeSpec(si)}>
              Remove
            </button>
          </div>
        ))}
        {(product.specs ?? []).length === 0 && (
          <div className="text-sm text-muted">No specs yet. Click “Add spec”.</div>
        )}
      </div>
    </div>
  );
}
