/**
 * WEEKLY ROLE PLANNER (PART 14)
 * --------------------------------------------------------------
 * selectedWeekdays + programMode + strengthDaysPerWeek → 7-gün role plan.
 * Combined: exact strengthDaysPerWeek combined day, kalan boxing-only.
 * Strength-only day Combined programda üretilmez.
 * --------------------------------------------------------------
 */
import { WEEKDAYS, PROGRAM_MODES, WEEKLY_SESSION_ROLES } from '@/config/architecture';
import { WEEKDAY_INDEX } from './weeklyBalanceConstants';
import { chooseStrengthWeekdays } from './weekdaySpacingEngine';

const BOXING = WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY;
const STRENGTH = WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY;
const COMBINED = WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY;
const UNSCHEDULED = WEEKLY_SESSION_ROLES.UNSCHEDULED_DAY;

/**
 * 7 gün slot array (canonical Monday→Sunday order).
 * Her slot: { weekday, weekdayIndex, scheduled, sessionRole }.
 */
export function planWeeklyRoles(programMode, selectedWeekdays, strengthDaysPerWeek) {
  const selectedSet = new Set(selectedWeekdays);
  let strengthIdxSet = new Set();
  if (programMode === PROGRAM_MODES.BOXING_AND_STRENGTH) {
    const sIdx = chooseStrengthWeekdays(selectedWeekdays, strengthDaysPerWeek);
    strengthIdxSet = new Set(sIdx);
  }
  const slots = WEEKDAYS.map((weekday, idx) => {
    const scheduled = selectedSet.has(weekday);
    let sessionRole = UNSCHEDULED;
    if (scheduled) {
      if (programMode === PROGRAM_MODES.BOXING_ONLY) sessionRole = BOXING;
      else if (programMode === PROGRAM_MODES.STRENGTH_ONLY) sessionRole = STRENGTH;
      else {
        sessionRole = strengthIdxSet.has(idx) ? COMBINED : BOXING;
      }
    }
    return { weekday, weekdayIndex: idx, scheduled, sessionRole };
  });
  return slots;
}

/** Structural metrics over 7-day cyclic week. */
export function computeWeeklyMetrics(slots, sessionDurationMinutes) {
  let trainingDayCount = 0, boxingDayCount = 0, strengthDayCount = 0, combinedDayCount = 0, unscheduledDayCount = 0;
  for (const s of slots) {
    if (!s.scheduled) { unscheduledDayCount += 1; continue; }
    trainingDayCount += 1;
    if (s.sessionRole === BOXING) boxingDayCount += 1;
    else if (s.sessionRole === STRENGTH) strengthDayCount += 1;
    else if (s.sessionRole === COMBINED) { combinedDayCount += 1; strengthDayCount += 1; boxingDayCount += 1; }
  }
  // adjacency / consecutive (cyclic)
  const scheduledIdx = slots.filter((s) => s.scheduled).map((s) => s.weekdayIndex);
  const strengthIdx = slots.filter((s) => s.scheduled && (s.sessionRole === STRENGTH || s.sessionRole === COMBINED)).map((s) => s.weekdayIndex);
  const adj = (a, b) => { const d = Math.abs(a - b); return Math.min(d, 7 - d) === 1; };
  let adjacentTrainingPairCount = 0;
  for (let i = 0; i < scheduledIdx.length; i++) for (let j = i + 1; j < scheduledIdx.length; j++) if (adj(scheduledIdx[i], scheduledIdx[j])) adjacentTrainingPairCount += 1;
  let adjacentStrengthPairCount = 0;
  for (let i = 0; i < strengthIdx.length; i++) for (let j = i + 1; j < strengthIdx.length; j++) if (adj(strengthIdx[i], strengthIdx[j])) adjacentStrengthPairCount += 1;
  // max consecutive (cyclic) training & strength days
  const maxConsec = (idxArr) => {
    if (idxArr.length === 0) return 0;
    const set = new Set(idxArr);
    let max = 0;
    for (const start of idxArr) {
      let len = 0, cur = start;
      while (set.has(cur)) { len += 1; cur = (cur + 1) % 7; }
      max = Math.max(max, len);
    }
    return max;
  };
  return {
    trainingDayCount,
    boxingDayCount,
    strengthDayCount,
    combinedDayCount,
    unscheduledDayCount,
    adjacentTrainingPairCount,
    adjacentStrengthPairCount,
    maxConsecutiveTrainingDays: maxConsec(scheduledIdx),
    maxConsecutiveStrengthDays: maxConsec(strengthIdx),
    weeklyPlannedSeconds: trainingDayCount * sessionDurationMinutes * 60,
  };
}