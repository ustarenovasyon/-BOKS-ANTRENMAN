/**
 * WEEKLY DEFENSE PLANNER (PART 14)
 * --------------------------------------------------------------
 * PART 13 defenseExposureLevel → weekly structural defense slots.
 * Actual rule (BOX_DEF_001/002) SEÇİLMEZ. Yalnız defenseEligible.
 * INTRO: alternate-week. REGULAR: 1 (1-3 boxing) / 2 (>=4 boxing).
 * Slot önceliği: Boxing-only gün. İki slot mümkünse spaced.
 * --------------------------------------------------------------
 */
import { WEEKLY_SESSION_ROLES } from '@/config/architecture';
import { cyclicDayDistance } from './weekdaySpacingEngine';

const BOXING = WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY;
const COMBINED = WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY;

function boxingEligibleSlots(slots) {
  return slots.filter((s) => s.scheduled && (s.sessionRole === BOXING || s.sessionRole === COMBINED));
}

/** Kaç defense-eligible slot bu hafta. */
export function defenseSlotCount(exposureLevel, boxingSessionCount, weekOrdinal) {
  if (exposureLevel === 'none') return 0;
  if (exposureLevel === 'intro') return weekOrdinal % 2 === 1 ? 1 : 0;
  if (exposureLevel === 'regular') return boxingSessionCount >= 4 ? 2 : 1;
  return 0;
}

/** Max cyclic distance pair, tie lexicographic (lower indices). */
function pickBestPair(indices) {
  let best = null;
  let bestDist = -1;
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const d = cyclicDayDistance(indices[i], indices[j]);
      const better = d > bestDist
        || (d === bestDist && best !== null && (indices[i] < best[0] || (indices[i] === best[0] && indices[j] < best[1])));
      if (better) {
        bestDist = d;
        best = [indices[i], indices[j]];
      }
    }
  }
  return best || [];
}

/**
 * defenseEligible slot weekday index listesi (deterministic).
 */
export function planDefenseSlots(exposureLevel, slots, weekOrdinal) {
  const boxing = boxingEligibleSlots(slots);
  const boxingSessionCount = boxing.length;
  const count = defenseSlotCount(exposureLevel, boxingSessionCount, weekOrdinal);
  if (count === 0) return [];
  const boxingOnlyIdx = boxing.filter((s) => s.sessionRole === BOXING).map((s) => s.weekdayIndex).sort((a, b) => a - b);
  const combinedIdx = boxing.filter((s) => s.sessionRole === COMBINED).map((s) => s.weekdayIndex).sort((a, b) => a - b);
  const pool = [...boxingOnlyIdx, ...combinedIdx];
  if (count === 1) {
    const first = boxingOnlyIdx.length ? boxingOnlyIdx[0] : pool[0];
    return first !== undefined ? [first] : [];
  }
  // count === 2
  if (boxingOnlyIdx.length >= 2) return pickBestPair(boxingOnlyIdx);
  if (pool.length >= 2) return pickBestPair(pool);
  if (pool.length === 1) return [pool[0]];
  return [];
}