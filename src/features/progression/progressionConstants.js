/**
 * PROGRESSION SABİTLERİ V1 (PART 13)
 * --------------------------------------------------------------
 * Pure/deterministic tablolar. Calendar/tarih bağımlılığı YOK.
 * Tüm tablolar duration × experience × phase eksenindedir.
 * Combo ceiling min 2, max 10. Strength movement count 3–6.
 * --------------------------------------------------------------
 */
import { PROGRESSION_PHASES, PROGRAM_DURATION_MONTHS, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS } from '@/config/architecture';

const F = PROGRESSION_PHASES.FOUNDATION;
const D = PROGRESSION_PHASES.DEVELOPMENT;
const E = PROGRESSION_PHASES.EXPANSION;
const I = PROGRESSION_PHASES.INTEGRATION;
const C = PROGRESSION_PHASES.CONSOLIDATION;

/** Her duration için aktif phase sırası (canonical progression order). */
export const ACTIVE_PHASES = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze([F, D, C]),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze([F, D, I, C]),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze([F, D, E, I, C]),
});

/** Phase ağırlıkları (her duration'da toplam 1.00). */
export const PHASE_WEIGHTS = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze({ [F]: 0.35, [D]: 0.40, [C]: 0.25 }),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze({ [F]: 0.20, [D]: 0.30, [I]: 0.30, [C]: 0.20 }),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze({ [F]: 0.15, [D]: 0.20, [E]: 0.25, [I]: 0.25, [C]: 0.15 }),
});

/** Boxing combo ceiling tablosu (duration × experience), active phase sırasına hizalı. */
export const COMBO_CEILINGS = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze({
    [EXPERIENCE_LEVELS.BEGINNER]: Object.freeze([2, 3, 4]),
    [EXPERIENCE_LEVELS.INTERMEDIATE]: Object.freeze([3, 4, 5]),
    [EXPERIENCE_LEVELS.EXPERIENCED]: Object.freeze([4, 6, 8]),
  }),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze({
    [EXPERIENCE_LEVELS.BEGINNER]: Object.freeze([2, 3, 4, 6]),
    [EXPERIENCE_LEVELS.INTERMEDIATE]: Object.freeze([3, 4, 6, 8]),
    [EXPERIENCE_LEVELS.EXPERIENCED]: Object.freeze([4, 6, 8, 10]),
  }),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze({
    [EXPERIENCE_LEVELS.BEGINNER]: Object.freeze([2, 3, 4, 6, 8]),
    [EXPERIENCE_LEVELS.INTERMEDIATE]: Object.freeze([3, 4, 6, 8, 10]),
    [EXPERIENCE_LEVELS.EXPERIENCED]: Object.freeze([4, 6, 8, 10, 10]),
  }),
});

/** Boxing work progression offset (sn), active phase sırasına hizalı. */
export const WORK_OFFSETS = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze([0, 15, 15]),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze([0, 15, 15, 30]),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze([0, 15, 15, 30, 30]),
});

export const BOXING_WORK_SECONDS_CAP = 120;

/** Defense exposure: (duration × experience) → { phaseId: level }. */
export const DEFENSE_EXPOSURE = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze({
    [EXPERIENCE_LEVELS.BEGINNER]: Object.freeze({ [F]: 'none', [D]: 'intro', [C]: 'intro' }),
    [EXPERIENCE_LEVELS.INTERMEDIATE]: Object.freeze({ [F]: 'intro', [D]: 'intro', [C]: 'regular' }),
    [EXPERIENCE_LEVELS.EXPERIENCED]: Object.freeze({ [F]: 'intro', [D]: 'regular', [C]: 'regular' }),
  }),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze({
    [EXPERIENCE_LEVELS.BEGINNER]: Object.freeze({ [F]: 'none', [D]: 'intro', [I]: 'regular', [C]: 'regular' }),
    [EXPERIENCE_LEVELS.INTERMEDIATE]: Object.freeze({ [F]: 'intro', [D]: 'intro', [I]: 'regular', [C]: 'regular' }),
    [EXPERIENCE_LEVELS.EXPERIENCED]: Object.freeze({ [F]: 'intro', [D]: 'regular', [I]: 'regular', [C]: 'regular' }),
  }),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze({
    [EXPERIENCE_LEVELS.BEGINNER]: Object.freeze({ [F]: 'none', [D]: 'intro', [E]: 'intro', [I]: 'regular', [C]: 'regular' }),
    [EXPERIENCE_LEVELS.INTERMEDIATE]: Object.freeze({ [F]: 'intro', [D]: 'intro', [E]: 'regular', [I]: 'regular', [C]: 'regular' }),
    [EXPERIENCE_LEVELS.EXPERIENCED]: Object.freeze({ [F]: 'intro', [D]: 'regular', [E]: 'regular', [I]: 'regular', [C]: 'regular' }),
  }),
});

/** Strength movement-count advance steps, active phase sırasına hizalı. */
export const STRENGTH_ADVANCE_STEPS = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze([0, 0, 1]),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze([0, 0, 1, 1]),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze([0, 0, 1, 1, 2]),
});

/** Strength prescription tier base (phase), active phase sırasına hizalı. */
export const PRESCRIPTION_TIER_BASE = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: Object.freeze([1, 1, 2]),
  [PROGRAM_DURATION_MONTHS.THREE]: Object.freeze([1, 2, 2, 3]),
  [PROGRAM_DURATION_MONTHS.SIX]: Object.freeze([1, 2, 3, 4, 4]),
});

export const EXPERIENCE_TIER_OFFSET = Object.freeze({
  [EXPERIENCE_LEVELS.BEGINNER]: 0,
  [EXPERIENCE_LEVELS.INTERMEDIATE]: 1,
  [EXPERIENCE_LEVELS.EXPERIENCED]: 2,
});

/** Prescription tier envelope'ları (set/rep/hold). Kg YOK. */
export const PRESCRIPTION_TIER_ENVELOPES = Object.freeze({
  tier_1: Object.freeze({ preferredSetCount: 2, allowedSetCounts: Object.freeze([2]), repRange: Object.freeze({ min: 6, max: 10 }), holdRangeSeconds: Object.freeze({ min: 20, max: 30 }) }),
  tier_2: Object.freeze({ preferredSetCount: 2, allowedSetCounts: Object.freeze([2, 3]), repRange: Object.freeze({ min: 8, max: 12 }), holdRangeSeconds: Object.freeze({ min: 20, max: 40 }) }),
  tier_3: Object.freeze({ preferredSetCount: 3, allowedSetCounts: Object.freeze([2, 3]), repRange: Object.freeze({ min: 8, max: 12 }), holdRangeSeconds: Object.freeze({ min: 30, max: 45 }) }),
  tier_4: Object.freeze({ preferredSetCount: 3, allowedSetCounts: Object.freeze([2, 3, 4]), repRange: Object.freeze({ min: 8, max: 15 }), holdRangeSeconds: Object.freeze({ min: 30, max: 60 }) }),
});

export const RECOVERY_DENSITY_BY_DIFFICULTY = Object.freeze({
  [DIFFICULTY_LEVELS.EASY]: 'generous_recovery',
  [DIFFICULTY_LEVELS.NORMAL]: 'balanced_recovery',
  [DIFFICULTY_LEVELS.HARD]: 'dense_recovery',
});

export const PROGRESSION_CONSTRAINTS = Object.freeze({
  sessionDurationFixed: true,
  noKgPrescription: true,
  immutableBoxingSequences: true,
  immutableStrengthTemplates: true,
  part12TimeEnvelopeRequired: true,
  avoidConcurrentMaximalProgression: true,
});

export function activePhasesFor(durationMonths) {
  return ACTIVE_PHASES[durationMonths] || null;
}

/** phaseId → active-phase-index. */
export function phaseIndexFor(durationMonths, phaseId) {
  const ap = activePhasesFor(durationMonths);
  if (!ap) return -1;
  return ap.indexOf(phaseId);
}