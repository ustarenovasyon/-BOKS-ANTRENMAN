import React from 'react';

/** Tek seçimli kompakt chip/segmented seçici. */
export default function SegmentedOptions({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-2 rounded-md text-sm border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}