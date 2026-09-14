/**
 * AUDIT FINDING YARDIMCILARI (PART 17)
 * --------------------------------------------------------------
 * Finding factory + pattern mask utilities. Pure helpers.
 * --------------------------------------------------------------
 */
import { PATTERN_BITS } from './programAuditConstants';

export function makeFinding(code, severity, category, message, location = {}, details = {}) {
  return {
    code,
    severity,
    category,
    message,
    location: {
      programDayId: location.programDayId || null,
      trainingOrdinal: location.trainingOrdinal || null,
      plannedDate: location.plannedDate || null,
      workoutBlockId: location.workoutBlockId || null,
      orderIndex: Number.isInteger(location.orderIndex) ? location.orderIndex : null,
    },
    details,
  };
}

/** Template'in pattern union mask'ı. */
export function templatePatternMask(template) {
  if (!template || !Array.isArray(template.movementPatterns)) return 0;
  let m = 0;
  for (const p of template.movementPatterns) m |= (PATTERN_BITS[p] || 0);
  return m;
}

/** Mask → eksik pattern isimleri listesi. */
import { STRENGTH_MOVEMENT_PATTERNS } from '@/config/architecture';
export function missingPatterns(mask) {
  const missing = [];
  for (const p of Object.values(STRENGTH_MOVEMENT_PATTERNS)) {
    if ((mask & (PATTERN_BITS[p] || 0)) === 0) missing.push(p);
  }
  return missing;
}