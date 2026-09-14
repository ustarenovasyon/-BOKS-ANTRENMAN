/**
 * PROGRAM DAY CARD (PART 16)
 * --------------------------------------------------------------
 * Collapsed: Antrenman #, tarih, weekday, role, phase•focus, süre.
 * Expanded: WorkoutBlock list (orderIndex asc) + daily total.
 * Stable key: programDay.id. Persisted source mutate YOK.
 * --------------------------------------------------------------
 */
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import WorkoutBlockPreview from './WorkoutBlockPreview';
import {
  ROLE_LABELS, PHASE_LABELS, FOCUS_LABELS, formatCivilDate, formatSeconds,
} from '../previewLabels';
import { LABELS } from '@/features/programCreate/programPreferences';

const WD_LABELS = LABELS.weekdays;

export default function ProgramDayCard({ day, blocks }) {
  const [open, setOpen] = useState(false);
  const weekdayLabel = WD_LABELS[day.weekday] || day.weekday;
  const phaseLabel = PHASE_LABELS[day.phaseId] || day.phaseId;
  const focusLabel = FOCUS_LABELS[day.progressionFocus] || day.progressionFocus;
  const roleLabel = ROLE_LABELS[day.sessionRole] || day.sessionRole;
  const totalSec = blocks.reduce((a, b) => a + (b.plannedSeconds || 0), 0);

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/50"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Antrenman {day.trainingOrdinal}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatCivilDate(day.plannedDate)} {weekdayLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {roleLabel} • {phaseLabel} • {focusLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{day.sessionDurationMinutes} dk</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2 space-y-1">
          {blocks.map((b) => (
            <WorkoutBlockPreview key={b.id} block={b} />
          ))}
          <div className="flex justify-between pt-1 border-t border-border mt-1">
            <span className="text-xs text-muted-foreground">Toplam</span>
            <span className="text-sm font-medium text-foreground">{formatSeconds(totalSec)}</span>
          </div>
        </div>
      )}
    </div>
  );
}