/**
 * PROGRAM WEEK SECTION (PART 16)
 * --------------------------------------------------------------
 * Hafta N + day count. Day listesi. Collapsed default.
 * --------------------------------------------------------------
 */
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import ProgramDayCard from './ProgramDayCard';

export default function ProgramWeekSection({ week, blocksByDay }) {
  const [open, setOpen] = useState(false);
  const dayCount = week.days.length;
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-left"
      >
        <span className="text-xs font-semibold text-foreground">Hafta {week.weekIndex}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {dayCount} antrenman
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="space-y-1.5 pl-1">
          {week.days.map((day) => (
            <ProgramDayCard key={day.id} day={day} blocks={blocksByDay.get(day.id) || []} />
          ))}
        </div>
      )}
    </div>
  );
}