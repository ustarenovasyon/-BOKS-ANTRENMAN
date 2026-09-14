/**
 * SESSION TIME BUDGET ENGINE V1 (PART 12)
 * --------------------------------------------------------------
 * Pure/deterministic. Aynı input → aynı output. AI/network yok.
 * Program/timer/block ÜRETMEZ. Yalnız zaman planı (derived object).
 * Exact-total invariant: block toplamı = sessionDurationMinutes*60.
 * Pause planned timer'a dahil değil; TTS gizli süre eklemez (data contract).
 * --------------------------------------------------------------
 */
import { PROGRAM_MODES, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS, SESSION_TIME_BUDGET_ENGINE_VERSION, SESSION_BUDGET_REASON_CODES } from '@/config/architecture';
import {
  SINGLE_MODE_PRESETS, COMBINED_PRESETS, isPresetDuration, isValidCustomDuration,
  roundTo30, clamp, MODE_BOXING, MODE_STRENGTH, MODE_COMBINED,
} from './sessionBudgetConstants';
import { minimumSessionMinutesForMode } from './sessionDurationPolicy';
import { buildBoxingIntervalBudget } from './boxingIntervalBudget';
import { getStrengthEligibleMovementCounts, buildStrengthTimeBudget, computePreferredMovementCount } from './strengthTimeBudget';

const RC = SESSION_BUDGET_REASON_CODES;

function validateInput(input) {
  const reasons = [];
  if (!Object.values(PROGRAM_MODES).includes(input.programMode)) reasons.push(RC.SESSION_INVALID_MODE);
  const dur = input.sessionDurationMinutes;
  const minMinutes = minimumSessionMinutesForMode(input.programMode);
  if (typeof dur !== 'number' || !Number.isInteger(dur) || dur < minMinutes || dur > 120) reasons.push(RC.SESSION_INVALID_CUSTOM_DURATION);
  if (!Object.values(EXPERIENCE_LEVELS).includes(input.experienceLevel)) reasons.push(RC.SESSION_INVALID_EXPERIENCE);
  if (!Object.values(DIFFICULTY_LEVELS).includes(input.difficulty)) reasons.push(RC.SESSION_INVALID_DIFFICULTY);
  return { valid: reasons.length === 0, reasons };
}

function resolveSingleModeBlocks(minutes, mode) {
  if (isPresetDuration(minutes)) {
    const p = SINGLE_MODE_PRESETS[minutes];
    return {
      warmupSeconds: p.warmupSeconds,
      boxingSeconds: mode === MODE_BOXING ? p.mainSeconds : 0,
      transitionSeconds: 0,
      strengthSeconds: mode === MODE_STRENGTH ? p.mainSeconds : 0,
      cooldownSeconds: p.cooldownSeconds,
    };
  }
  // custom single-mode
  const total = minutes * 60;
  const warmupSeconds = clamp(roundTo30(total * 0.10), 60, 360);
  const cooldownSeconds = clamp(roundTo30(total * 0.04), 60, 120);
  const main = total - warmupSeconds - cooldownSeconds;
  return {
    warmupSeconds,
    boxingSeconds: mode === MODE_BOXING ? main : 0,
    transitionSeconds: 0,
    strengthSeconds: mode === MODE_STRENGTH ? main : 0,
    cooldownSeconds,
  };
}

function resolveCombinedBlocks(minutes) {
  if (isPresetDuration(minutes)) {
    const p = COMBINED_PRESETS[minutes];
    return {
      warmupSeconds: p.warmupSeconds,
      boxingSeconds: p.boxingSeconds,
      transitionSeconds: p.transitionSeconds,
      strengthSeconds: p.strengthSeconds,
      cooldownSeconds: p.cooldownSeconds,
    };
  }
  // custom combined
  const total = minutes * 60;
  const warmupSeconds = clamp(roundTo30(total * 0.08), 60, 300);
  const transitionSeconds = minutes < 30 ? 30 : 60;
  const cooldownSeconds = clamp(roundTo30(total * 0.04), 60, 120);
  const remaining = total - warmupSeconds - transitionSeconds - cooldownSeconds;
  const boxingSeconds = roundTo30(remaining * 0.54);
  const strengthSeconds = remaining - boxingSeconds;
  return { warmupSeconds, boxingSeconds, transitionSeconds, strengthSeconds, cooldownSeconds };
}

function resolveBlocks(mode, minutes) {
  if (mode === MODE_COMBINED) return resolveCombinedBlocks(minutes);
  return resolveSingleModeBlocks(minutes, mode);
}

function emptyBoxingBudget() {
  return { workSecondsPerFullRound: 0, restSecondsPerFullRecovery: 0, intervalSegments: [], plannedWorkRoundCount: 0, totalWorkSeconds: 0, totalRestSeconds: 0 };
}

function emptyStrengthBudget() {
  return { workBudgetSeconds: 0, recoveryBudgetSeconds: 0, transitionBudgetSeconds: 0, eligibleMovementCounts: [], preferredMovementCount: 0, averageStrengthSecondsPerMovement: 0 };
}

/**
 * Ana engine. input: { programMode, sessionDurationMinutes, experienceLevel, difficulty }
 */
export function buildSessionTimeBudget(input = {}) {
  const v = validateInput(input);
  if (!v.valid) {
    return { valid: false, engineVersion: SESSION_TIME_BUDGET_ENGINE_VERSION, reasons: v.reasons, warnings: [], blocks: null, boxingBudget: null, strengthBudget: null, validation: { exactTotal: false } };
  }
  const { programMode, sessionDurationMinutes, experienceLevel, difficulty } = input;
  const totalSeconds = sessionDurationMinutes * 60;
  const blocks = resolveBlocks(programMode, sessionDurationMinutes);

  const warnings = [];
  if (programMode === MODE_COMBINED && sessionDurationMinutes < 15) {
    warnings.push(RC.SESSION_VERY_COMPACT_COMBINED);
  }

  let boxingBudget = emptyBoxingBudget();
  if (blocks.boxingSeconds > 0) {
    boxingBudget = buildBoxingIntervalBudget(blocks.boxingSeconds, experienceLevel, difficulty);
  }

  let strengthBudget = emptyStrengthBudget();
  if (blocks.strengthSeconds > 0) {
    const eligible = getStrengthEligibleMovementCounts(blocks.strengthSeconds, programMode);
    const preferred = computePreferredMovementCount(eligible, experienceLevel, difficulty);
    const internal = buildStrengthTimeBudget(blocks.strengthSeconds, difficulty);
    strengthBudget = {
      ...internal,
      eligibleMovementCounts: eligible,
      preferredMovementCount: preferred,
      averageStrengthSecondsPerMovement: preferred > 0 ? Math.floor(blocks.strengthSeconds / preferred) : 0,
    };
  }

  const computedTotalSeconds = blocks.warmupSeconds + blocks.boxingSeconds + blocks.transitionSeconds + blocks.strengthSeconds + blocks.cooldownSeconds;
  const validation = {
    exactTotal: computedTotalSeconds === totalSeconds,
    computedTotalSeconds,
    expectedTotalSeconds: totalSeconds,
  };

  return {
    valid: true,
    engineVersion: SESSION_TIME_BUDGET_ENGINE_VERSION,
    programMode,
    sessionDurationMinutes,
    totalSeconds,
    blocks,
    boxingBudget,
    strengthBudget,
    warnings,
    validation,
  };
}

/** Deterministic debug/test fingerprint (DB key değil). */
export function sessionBudgetFingerprint(input = {}) {
  return `${input.programMode}|${input.sessionDurationMinutes}|${input.experienceLevel}|${input.difficulty}|V${SESSION_TIME_BUDGET_ENGINE_VERSION}`;
}
