/**
 * WEEKLY BALANCE SABİTLERİ (PART 14)
 * --------------------------------------------------------------
 * Pure/deterministic. Role/focus enum'ları, canonical pattern set,
 * focus rotation tabloları. Tarih bağımlılığı YOK.
 * --------------------------------------------------------------
 */
import { WEEKDAYS, WEEKLY_SESSION_ROLES, WEEKLY_PROGRESSION_FOCUS, STRENGTH_MOVEMENT_PATTERNS } from '@/config/architecture';

export const WEEKDAY_INDEX = Object.freeze(Object.fromEntries(WEEKDAYS.map((d, i) => [d, i])));

/** Canonical 7 strength pattern (reachability hedefi). */
export const CANONICAL_STRENGTH_PATTERNS = Object.freeze(Object.values(STRENGTH_MOVEMENT_PATTERNS));

/** Role → PART 12 budget mode mapping. */
export const ROLE_BUDGET_MODE = Object.freeze({
  [WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY]: 'boxing_only',
  [WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY]: 'strength_only',
  [WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY]: 'boxing_and_strength',
});

/** Focus rotation per role (deterministic). */
export const FOCUS_ROTATIONS = Object.freeze({
  [WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY]: Object.freeze([
    WEEKLY_PROGRESSION_FOCUS.BOXING_COMPLEXITY,
    WEEKLY_PROGRESSION_FOCUS.BOXING_WORK_CAPACITY,
    WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE,
  ]),
  [WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY]: Object.freeze([
    WEEKLY_PROGRESSION_FOCUS.STRENGTH_MOVEMENT_DENSITY,
    WEEKLY_PROGRESSION_FOCUS.STRENGTH_PRESCRIPTION,
    WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE,
  ]),
  [WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY]: Object.freeze([
    WEEKLY_PROGRESSION_FOCUS.BOXING_COMPLEXITY,
    WEEKLY_PROGRESSION_FOCUS.STRENGTH_MOVEMENT_DENSITY,
    WEEKLY_PROGRESSION_FOCUS.BOXING_WORK_CAPACITY,
    WEEKLY_PROGRESSION_FOCUS.STRENGTH_PRESCRIPTION,
    WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE,
  ]),
});

/** Bir role için geçersiz focus set'leri. */
export const INVALID_FOCUS_FOR_ROLE = Object.freeze({
  [WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY]: Object.freeze([
    WEEKLY_PROGRESSION_FOCUS.STRENGTH_MOVEMENT_DENSITY,
    WEEKLY_PROGRESSION_FOCUS.STRENGTH_PRESCRIPTION,
  ]),
  [WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY]: Object.freeze([
    WEEKLY_PROGRESSION_FOCUS.BOXING_COMPLEXITY,
    WEEKLY_PROGRESSION_FOCUS.BOXING_WORK_CAPACITY,
    WEEKLY_PROGRESSION_FOCUS.DEFENSE_INTEGRATION,
  ]),
});

export const WEEKLY_CONSTRAINTS = Object.freeze({
  fixedDailyDuration: true,
  maxOneRowVariantPerSession: true,
  maxOneProgressionPushPerSession: true,
  noKgPrescription: true,
  immutableBoxingSequences: true,
  immutableStrengthTemplates: true,
});