// src/components/admin/GenericJSONEditor.tsx
'use client';
import { useEffect, useState } from 'react';

export default function GenericJSONEditor<T>({
  value,
  onChange,
}: {
  value: T;
  onChange: (next: T) => void;
}) {
  const [text, setText] = useState<string>(JSON.stringify(value, null, 2));

  // Keep textarea in sync if parent changes value
  useEffect(() => {
    setText(JSON.stringify(value, null, 2));
  }, [value]);

  return (
    <div className="space-y-2">
      <textarea
        className="textarea w-full h-64 font-mono text-sm"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="btn btn-primary"
          onClick={() => {
            try {
              const next = JSON.parse(text) as T;
              onChange(next);
            } catch {
              alert('Invalid JSON');
            }
          }}
        >
          Apply JSON
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => setText(JSON.stringify(value, null, 2))}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
