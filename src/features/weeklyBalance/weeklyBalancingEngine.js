/**
 * WEEKLY BALANCING ENGINE V1 (PART 14)
 * --------------------------------------------------------------
 * Pure/deterministic structural week plan. Program ÜRETMEZ.
 * Role plan + PART12 role budget + feasibility + defense + focus.
 * Daily duration sabit. Date.now() YOK. Program persist YOK.
 * --------------------------------------------------------------
 */
import {
  WEEKLY_BALANCING_ENGINE_VERSION, PROGRAM_MODES, WEEKDAYS, WEEKLY_SESSION_ROLES,
  BALANCE_REASON_CODES, BALANCE_WARNING_CODES,
} from '@/config/architecture';
import { planWeeklyRoles, computeWeeklyMetrics } from './weeklyRolePlanner';
import { countAdjacentStrengthPairs, chooseStrengthWeekdays } from './weekdaySpacingEngine';
import { buildCandidatePool, reachableMovementPatterns, missingMovementPatterns } from './strengthFeasibilityEngine';
import { planDefenseSlots, defenseSlotCount } from './weeklyDefensePlanner';
import { pickFocus, applyProgressionFocusBalance, countPushedDimensions } from './progressionFocusBalancer';
import { ROLE_BUDGET_MODE, WEEKLY_CONSTRAINTS, WEEKDAY_INDEX } from './weeklyBalanceConstants';
import { buildSessionTimeBudget } from '@/features/sessionBudget/sessionTimeBudgetEngine';

const RC = BALANCE_REASON_CODES;
const WC = BALANCE_WARNING_CODES;

function validateInput(input) {
  const reasons = [];
  if (!Object.values(PROGRAM_MODES).includes(input.programMode)) reasons.push(RC.BALANCE_INVALID_MODE);
  if (!Number.isInteger(input.weekOrdinal) || input.weekOrdinal < 1) reasons.push(RC.BALANCE_INVALID_WEEK_ORDINAL);
  if (!Array.isArray(input.selectedWeekdays) || input.selectedWeekdays.length === 0) {
    reasons.push(RC.BALANCE_INVALID_WEEKDAY_SELECTION);
  } else {
    const validSet = new Set(WEEKDAYS);
    const seen = new Set();
    for (const d of input.selectedWeekdays) {
      if (!validSet.has(d)) { reasons.push(RC.BALANCE_INVALID_WEEKDAY_SELECTION); break; }
      if (seen.has(d)) { reasons.push(RC.BALANCE_INVALID_WEEKDAY_SELECTION); break; }
      seen.add(d);
    }
  }
  if (Number.isInteger(input.daysPerWeek) && Array.isArray(input.selectedWeekdays) && input.selectedWeekdays.length !== input.daysPerWeek) {
    reasons.push(RC.BALANCE_DAY_COUNT_MISMATCH);
  }
  if (input.programMode === PROGRAM_MODES.BOXING_AND_STRENGTH) {
    const s = input.strengthDaysPerWeek;
    const dpw = input.daysPerWeek;
    if (!Number.isInteger(s) || s < 1 || s > dpw) reasons.push(RC.BALANCE_INVALID_STRENGTH_DAY_COUNT);
  }
  return { valid: reasons.length === 0, reasons };
}

/**
 * input: {
 *   programMode, daysPerWeek, selectedWeekdays, strengthDaysPerWeek,
 *   sessionDurationMinutes, experienceLevel, difficulty, availableEquipment,
 *   weekOrdinal, progressionResult (optional, PART 13),
 *   defenseExposureLevel (optional; derived from progressionResult if absent)
 * }
 */
export function buildWeeklyBalance(input = {}) {
  const v = validateInput(input);
  if (!v.valid) {
    return { valid: false, engineVersion: WEEKLY_BALANCING_ENGINE_VERSION, reasons: v.reasons, warnings: [], result: null };
  }
  const {
    programMode, daysPerWeek, selectedWeekdays, strengthDaysPerWeek,
    sessionDurationMinutes, experienceLevel, difficulty, availableEquipment,
    weekOrdinal, progressionResult,
  } = input;

  const slots = planWeeklyRoles(programMode, selectedWeekdays, strengthDaysPerWeek);
  const metrics = computeWeeklyMetrics(slots, sessionDurationMinutes);
  const warnings = [];

  // Adjacent strength unavoidable warning
  const strengthIdx = slots.filter((s) => s.scheduled && (s.sessionRole === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY || s.sessionRole === WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY)).map((s) => s.weekdayIndex);
  if (countAdjacentStrengthPairs(strengthIdx) > 0) {
    // daha iyi spacing mümkün mü? seçilen subset brute-force best ile aynı olmalı
    const best = chooseStrengthWeekdays(selectedWeekdays, programMode === PROGRAM_MODES.BOXING_AND_STRENGTH ? strengthDaysPerWeek : strengthIdx.length);
    const bestAdj = countAdjacentStrengthPairs(best);
    if (bestAdj > 0) warnings.push(WC.BALANCE_ADJACENT_STRENGTH_DAYS_UNAVOIDABLE);
  }
  if (metrics.maxConsecutiveTrainingDays >= 4) warnings.push(WC.BALANCE_HIGH_CONSECUTIVE_TRAINING_DENSITY);
  if (metrics.unscheduledDayCount === 0) warnings.push(WC.BALANCE_NO_UNSCHEDULED_WEEKDAY_GAP);

  // Per-slot budget + defense + focus
  let defenseExposureLevel = input.defenseExposureLevel;
  if (!defenseExposureLevel && progressionResult && progressionResult.valid && progressionResult.result && progressionResult.result.boxingProgression) {
    defenseExposureLevel = progressionResult.result.boxingProgression.defenseExposureLevel;
  }
  defenseExposureLevel = defenseExposureLevel || 'none';
  const defenseSlotIdx = planDefenseSlots(defenseExposureLevel, slots, weekOrdinal);
  const defenseSet = new Set(defenseSlotIdx);

  let scheduledSlotIndex = 0;
  let weeklyBoxingSeconds = 0, weeklyStrengthSeconds = 0, weeklyWarmupSeconds = 0, weeklyTransitionSeconds = 0, weeklyCooldownSeconds = 0;

  for (const slot of slots) {
    if (!slot.scheduled) {
      slot.plannedSessionDurationMinutes = null;
      slot.budgetMode = null;
      slot.budget = null;
      slot.defenseEligible = false;
      slot.progressionFocus = null;
      slot.progressionCaps = null;
      continue;
    }
    const budgetMode = ROLE_BUDGET_MODE[slot.sessionRole];
    const budget = buildSessionTimeBudget({
      programMode: budgetMode,
      sessionDurationMinutes,
      experienceLevel,
      difficulty,
    });
    if (!budget.valid) {
      return { valid: false, engineVersion: WEEKLY_BALANCING_ENGINE_VERSION, reasons: [RC.BALANCE_SESSION_BUDGET_INVALID], warnings, result: null };
    }
    slot.plannedSessionDurationMinutes = sessionDurationMinutes;
    slot.budgetMode = budgetMode;
    slot.budget = {
      warmupSeconds: budget.blocks.warmupSeconds,
      boxingSeconds: budget.blocks.boxingSeconds,
      transitionSeconds: budget.blocks.transitionSeconds,
      strengthSeconds: budget.blocks.strengthSeconds,
      cooldownSeconds: budget.blocks.cooldownSeconds,
      totalSeconds: budget.totalSeconds,
    };
    weeklyWarmupSeconds += budget.blocks.warmupSeconds;
    weeklyBoxingSeconds += budget.blocks.boxingSeconds;
    weeklyTransitionSeconds += budget.blocks.transitionSeconds;
    weeklyStrengthSeconds += budget.blocks.strengthSeconds;
    weeklyCooldownSeconds += budget.blocks.cooldownSeconds;

    const defenseEligible = defenseSet.has(slot.weekdayIndex);
    const focus = progressionResult ? pickFocus(slot.sessionRole, weekOrdinal, scheduledSlotIndex, defenseEligible) : null;
    slot.defenseEligible = defenseEligible;
    slot.progressionFocus = focus;
    slot.progressionCaps = progressionResult ? applyProgressionFocusBalance(progressionResult, slot.sessionRole, focus) : null;
    scheduledSlotIndex += 1;
  }

  // Strength feasibility (strength-bearing program)
  let strengthFeasibility = null;
  const hasStrengthDomain = programMode === PROGRAM_MODES.STRENGTH_ONLY || programMode === PROGRAM_MODES.BOXING_AND_STRENGTH;
  if (hasStrengthDomain) {
    const strengthBudgetMode = ROLE_BUDGET_MODE[programMode === PROGRAM_MODES.BOXING_AND_STRENGTH ? WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY : WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY];
    const refBudget = buildSessionTimeBudget({ programMode: strengthBudgetMode, sessionDurationMinutes, experienceLevel, difficulty });
    const eligible = refBudget.valid ? refBudget.strengthBudget.eligibleMovementCounts : [];
    const pool = buildCandidatePool(eligible, availableEquipment || []);
    const reachable = reachableMovementPatterns(pool);
    const missing = missingMovementPatterns(reachable);
    strengthFeasibility = {
      candidateTemplateIds: pool.map((t) => t.id),
      candidateTemplateCount: pool.length,
      reachableMovementPatterns: reachable,
      missingMovementPatterns: missing,
      fullPatternCoverageReachable: missing.length === 0,
      eligibleMovementCounts: eligible,
    };
    if (pool.length === 0) {
      return { valid: false, engineVersion: WEEKLY_BALANCING_ENGINE_VERSION, reasons: [RC.BALANCE_NO_ELIGIBLE_STRENGTH_TEMPLATE], warnings, result: null };
    }
    if (missing.length > 0) {
      return { valid: false, engineVersion: WEEKLY_BALANCING_ENGINE_VERSION, reasons: [RC.BALANCE_REQUIRED_PATTERN_UNREACHABLE], warnings, result: null, missingPatterns: missing };
    }
    if (pool.length <= 2) warnings.push(WC.BALANCE_TEMPLATE_VARIETY_LIMITED);
  }

  const result = {
    engineVersion: WEEKLY_BALANCING_ENGINE_VERSION,
    weekOrdinal,
    programMode,
    daysPerWeek,
    selectedWeekdays,
    strengthDaysPerWeek: programMode === PROGRAM_MODES.BOXING_AND_STRENGTH ? strengthDaysPerWeek : (programMode === PROGRAM_MODES.STRENGTH_ONLY ? daysPerWeek : 0),
    slots,
    metrics: {
      ...metrics,
      weeklyBoxingSeconds,
      weeklyStrengthSeconds,
      weeklyWarmupSeconds,
      weeklyTransitionSeconds,
      weeklyCooldownSeconds,
    },
    strengthFeasibility,
    defenseExposureLevel,
    defenseSlotCount: defenseSlotCount(defenseExposureLevel, metrics.boxingDayCount, weekOrdinal),
    constraints: WEEKLY_CONSTRAINTS,
  };

  return { valid: true, engineVersion: WEEKLY_BALANCING_ENGINE_VERSION, reasons: [], warnings, result };
}