import React from 'react';
import { WEEKDAYS } from '@/config/architecture';
import { LABELS } from '../programPreferences';

/** Hafta günü çoklu seçim (sıra her zaman Pazartesi → Pazar). */
export default function WeekdayPicker({ selected, onChange, expectedCount }) {
  const toggle = (day) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((day) => {
          const active = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-border'
              }`}
            >
              {LABELS.weekdays[day]}
            </button>
          );
        })}
      </div>
      {expectedCount !== undefined && selected.length !== expectedCount && (
        <p className="mt-2 text-xs text-destructive">
          Haftada {expectedCount} gün seçtin. Lütfen {expectedCount} antrenman günü belirle.
        </p>
      )}
    </div>
  );
}