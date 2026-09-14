/**
 * V2 COMBO-LENGTH POLICY (PART 25)
 * --------------------------------------------------------------
 * Central source-of-truth for V2 duration-aware combo-length profiles.
 * Yalnız Beginner 1/3/6 month için tanımlıdır.
 *
 * Invariants:
 *  - V1 selector NEVER imports or uses this module.
 *  - Yalnız Beginner 1/3/6 desteklenir — diğerleri fail-safe (null).
 *  - challengeCeiling DATA-ONLY — PART 25 selector kullanmaz.
 *  - Immutable definitions (deep-frozen arrays/objects).
 * --------------------------------------------------------------
 */
import { EXPERIENCE_LEVELS, PROGRAM_DURATION_MONTHS } from '@/config/architecture';

/**
 * Beginner V2 combo-length profiles.
 * Her duration için: supportRange, floor, targetRange, normalCeiling, challengeCeiling.
 */
const V2_LENGTH_PROFILES = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze({
    supportRange: Object.freeze([2]),
    floor: 2,
    targetRange: Object.freeze([2, 3]),
    normalCeiling: 3,
    challengeCeiling: 4,
  }),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze({
    supportRange: Object.freeze([2, 3]),
    floor: 2,
    targetRange: Object.freeze([3, 4]),
    normalCeiling: 4,
    challengeCeiling: 5,
  }),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze({
    supportRange: Object.freeze([2, 3]),
    floor: 3,
    targetRange: Object.freeze([4, 5]),
    normalCeiling: 6,
    challengeCeiling: 7,
  }),
});

const SUPPORTED_DURATIONS = Object.freeze([
  PROGRAM_DURATION_MONTHS.ONE,
  PROGRAM_DURATION_MONTHS.THREE,
  PROGRAM_DURATION_MONTHS.SIX,
]);
const SUPPORTED_EXPERIENCE = Object.freeze([EXPERIENCE_LEVELS.BEGINNER]);

/**
 * V2 combo-length policy resolver.
 * Invalid duration/experience → null (fail-safe, silent fallback V1 YOK).
 */
export function resolveV2ComboLengthPolicy(durationMonths, experienceLevel) {
  if (!SUPPORTED_DURATIONS.includes(durationMonths)) return null;
  if (!SUPPORTED_EXPERIENCE.includes(experienceLevel)) return null;
  return V2_LENGTH_PROFILES[durationMonths];
}

/**
 * V2 effective target range clipping.
 * targetRange değerlerini [floor, ceiling] aralığına clip eder.
 * Hiçbir target değeri aralıkta değilse → [ceiling] (best available).
 */
export function clipV2TargetRange(targetRange, floor, ceiling) {
  const clipped = targetRange.filter((v) => v >= floor && v <= ceiling);
  if (clipped.length === 0) {
    return Object.freeze([ceiling]);
  }
  return Object.freeze(clipped);
}