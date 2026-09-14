/**
 * SESSION BUDGET SABİTLERİ + HELPERS (PART 12)
 * --------------------------------------------------------------
 * Pure deterministic. Seconds tabanlı. Exact-total invariant.
 * Preset tablolar + custom formül + ratio/work-rest profilleri.
 * --------------------------------------------------------------
 */
import {
  PROGRAM_MODES, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS,
  SESSION_DURATION_OPTIONS, SESSION_DURATION_LIMITS,
} from '@/config/architecture';

export const SESSION_BUDGET_PRESET_DURATIONS = Object.freeze([...SESSION_DURATION_OPTIONS]);

/** Single-mode (boxing-only / strength-only) preset outer shell. */
export const SINGLE_MODE_PRESETS = Object.freeze({
  15: { warmupSeconds: 120, mainSeconds: 720, cooldownSeconds: 60 },
  20: { warmupSeconds: 180, mainSeconds: 930, cooldownSeconds: 90 },
  30: { warmupSeconds: 240, mainSeconds: 1470, cooldownSeconds: 90 },
  40: { warmupSeconds: 300, mainSeconds: 1980, cooldownSeconds: 120 },
  45: { warmupSeconds: 300, mainSeconds: 2280, cooldownSeconds: 120 },
  60: { warmupSeconds: 360, mainSeconds: 3120, cooldownSeconds: 120 },
});

/** Combined (boks + kuvvet) preset dağılımı. */
export const COMBINED_PRESETS = Object.freeze({
  15: { warmupSeconds: 90, boxingSeconds: 360, transitionSeconds: 30, strengthSeconds: 360, cooldownSeconds: 60 },
  20: { warmupSeconds: 120, boxingSeconds: 480, transitionSeconds: 30, strengthSeconds: 510, cooldownSeconds: 60 },
  30: { warmupSeconds: 180, boxingSeconds: 780, transitionSeconds: 60, strengthSeconds: 720, cooldownSeconds: 60 },
  40: { warmupSeconds: 240, boxingSeconds: 1080, transitionSeconds: 60, strengthSeconds: 900, cooldownSeconds: 120 },
  45: { warmupSeconds: 240, boxingSeconds: 1260, transitionSeconds: 60, strengthSeconds: 1020, cooldownSeconds: 120 },
  60: { warmupSeconds: 300, boxingSeconds: 1680, transitionSeconds: 60, strengthSeconds: 1440, cooldownSeconds: 120 },
});

/** Boxing work interval (experience → saniye). */
export const BOXING_WORK_SECONDS = Object.freeze({
  [EXPERIENCE_LEVELS.BEGINNER]: 60,
  [EXPERIENCE_LEVELS.INTERMEDIATE]: 90,
  [EXPERIENCE_LEVELS.EXPERIENCED]: 120,
});

/** Boxing rest (difficulty → saniye). */
export const BOXING_REST_SECONDS = Object.freeze({
  [DIFFICULTY_LEVELS.EASY]: 60,
  [DIFFICULTY_LEVELS.NORMAL]: 45,
  [DIFFICULTY_LEVELS.HARD]: 30,
});

/** Strength internal budget oranları (toplam 1.00). */
export const STRENGTH_RATIOS = Object.freeze({
  [DIFFICULTY_LEVELS.EASY]: { work: 0.50, recovery: 0.40, transition: 0.10 },
  [DIFFICULTY_LEVELS.NORMAL]: { work: 0.55, recovery: 0.35, transition: 0.10 },
  [DIFFICULTY_LEVELS.HARD]: { work: 0.60, recovery: 0.30, transition: 0.10 },
});

export const MODE_BOXING = PROGRAM_MODES.BOXING_ONLY;
export const MODE_STRENGTH = PROGRAM_MODES.STRENGTH_ONLY;
export const MODE_COMBINED = PROGRAM_MODES.BOXING_AND_STRENGTH;

/** En yakın 30 saniyeye deterministic round (HALF_UP). */
export function roundTo30(seconds) {
  return Math.round(seconds / 30) * 30;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Strength ratio → exact integer seconds (residual work bucket'a). */
export function allocateRatiosExact(totalSeconds, ratioObj, quantum = 15) {
  const work = Math.round((totalSeconds * ratioObj.work) / quantum) * quantum;
  const recovery = Math.round((totalSeconds * ratioObj.recovery) / quantum) * quantum;
  const transition = Math.round((totalSeconds * ratioObj.transition) / quantum) * quantum;
  const sum = work + recovery + transition;
  // Residual deterministik olarak work budget'a eklenir (exact total).
  return {
    workBudgetSeconds: work + (totalSeconds - sum),
    recoveryBudgetSeconds: recovery,
    transitionBudgetSeconds: transition,
  };
}

export function isPresetDuration(minutes) {
  return SESSION_BUDGET_PRESET_DURATIONS.includes(minutes);
}

export function isValidCustomDuration(minutes) {
  return Number.isInteger(minutes) && minutes >= SESSION_DURATION_LIMITS.MIN && minutes <= SESSION_DURATION_LIMITS.MAX;
}