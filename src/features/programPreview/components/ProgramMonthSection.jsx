/**
 * PROGRAM MONTH SECTION (PART 16)
 * --------------------------------------------------------------
 * Ay N + antrenman sayısı. Week listesi. Month 1 default açık,
 * diğerleri collapsed. 6 aylık DOM yükü kontrol altında.
 * --------------------------------------------------------------
 */
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ProgramWeekSection from './ProgramWeekSection';

export default function ProgramMonthSection({ month, blocksByDay, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const sessionCount = month.weeks.reduce((a, w) => a + w.days.length, 0);
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-muted/40 text-left"
      >
        <span className="text-sm font-semibold text-foreground">{month.monthIndex}. Ay</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {sessionCount} antrenman
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="px-2 py-2 space-y-2">
          {month.weeks.map((w) => (
            <ProgramWeekSection key={w.weekIndex} week={w} blocksByDay={blocksByDay} />
          ))}
        </div>
      )}
    </div>
  );
}