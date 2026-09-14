import React from 'react';
import { STRENGTH_EQUIPMENT } from '@/config/architecture';
import { LABELS } from '../programPreferences';

const OPTIONS = Object.values(STRENGTH_EQUIPMENT).map((v) => ({ value: v, label: LABELS.equipment[v] }));

/** Kuvvet ekipmanı çoklu seçim. */
export default function EquipmentPicker({ selected, onChange }) {
  const toggle = (v) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
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