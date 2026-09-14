/**
 * KUVVET SESSION + WEEK BALANCE VALIDATOR
 * --------------------------------------------------------------
 * Pure/deterministic. Exercise-selection seviyesinde çalışır; set/rep
 * istemez (10.62). Kg üretmez. Random/AI yok. Aynı input → aynı output.
 * Boxing kataloguna write yapmaz; yalnız kuvvet seçimini denetler.
 * --------------------------------------------------------------
 */
import { STRENGTH_EXERCISES, isStrengthExerciseAvailable } from '../library/strengthExercises';
import {
  STRENGTH_EXERCISE_BY_ID, STRENGTH_SIDE_SEMANTICS, STRENGTH_KG_POLICY,
} from './strengthTechnicalConstitution';
import {
  STRENGTH_ALTERNATIVE_GROUPS, STRENGTH_BALANCE_VERDICTS, STRENGTH_REASON_CODES,
  STRENGTH_SESSION_TYPES, STRENGTH_MOVEMENT_PATTERNS, STRENGTH_PRESCRIPTION_TYPES,
  EXPERIENCE_LEVELS,
} from '@/config/architecture';

const EXERCISES = STRENGTH_EXERCISES;
const RC = STRENGTH_REASON_CODES;

function emptyMetrics() {
  return { movementCount: 0, patternCount: 0, lowerBodyPatternCount: 0, upperBodyPatternCount: 0, corePatternCount: 0 };
}

function computeMetrics(exercises) {
  const patterns = new Set();
  const lower = new Set();
  const upper = new Set();
  const core = new Set();
  for (const ex of exercises) {
    patterns.add(ex.movementPattern);
    if (ex.bodyRegion === 'lower') lower.add(ex.movementPattern);
    else if (ex.bodyRegion === 'upper') upper.add(ex.movementPattern);
    else if (ex.bodyRegion === 'core') core.add(ex.movementPattern);
  }
  return {
    movementCount: exercises.length,
    patternCount: patterns.size,
    lowerBodyPatternCount: lower.size,
    upperBodyPatternCount: upper.size,
    corePatternCount: core.size,
  };
}

function resolveExercises(exerciseIds) {
  const resolved = [];
  for (const id of exerciseIds) {
    const ex = STRENGTH_EXERCISE_BY_ID[id];
    if (!ex) return { resolved, error: { code: RC.STR_UNKNOWN_EXERCISE, detail: id } };
    resolved.push(ex);
  }
  return { resolved };
}

/**
 * Session-level balance. input:
 * { exerciseIds:[], availableEquipment:[], sessionType, experienceLevel }
 */
export function evaluateStrengthSessionBalance(input = {}) {
  const exerciseIds = Array.isArray(input.exerciseIds) ? input.exerciseIds : [];
  const reasons = [];
  const warnings = [];
  const requirements = [];

  const { resolved, error } = resolveExercises(exerciseIds);
  if (error) {
    return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [error.code], warnings, requirements, metrics: emptyMetrics(), detail: error.detail };
  }

  // inactive/unapproved
  for (const ex of resolved) {
    if (ex.approved !== true || ex.active !== true) {
      return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_INACTIVE_EXERCISE], warnings, requirements, metrics: emptyMetrics(), detail: ex.id };
    }
  }

  // duplicate exact exercise
  const seen = new Set();
  for (const ex of resolved) {
    if (seen.has(ex.id)) {
      return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_DUPLICATE_EXERCISE], warnings, requirements, metrics: emptyMetrics(), detail: ex.id };
    }
    seen.add(ex.id);
  }

  // alternative group stack (ROW_VARIANTS)
  const groupCount = {};
  for (const ex of resolved) {
    if (!ex.alternativeGroup) continue;
    groupCount[ex.alternativeGroup] = (groupCount[ex.alternativeGroup] || 0) + 1;
  }
  for (const [group, count] of Object.entries(groupCount)) {
    if (group === STRENGTH_ALTERNATIVE_GROUPS.ROW_VARIANTS && count > 1) {
      return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_MULTIPLE_ROW_VARIANTS], warnings, requirements, metrics: emptyMetrics(), detail: `${count} row variants` };
    }
  }

  // equipment eligibility
  const availableEquipment = Array.isArray(input.availableEquipment) ? input.availableEquipment : [];
  for (const ex of resolved) {
    if (!isStrengthExerciseAvailable(ex, availableEquipment)) {
      return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_EQUIPMENT_MISMATCH], warnings, requirements, metrics: emptyMetrics(), detail: ex.id };
    }
  }

  // kg policy guard (future template/prescription shouldn't carry kg fields)
  for (const ex of resolved) {
    const hasForbidden = STRENGTH_KG_POLICY.FORBIDDEN_LOAD_FIELDS.some((k) => Object.prototype.hasOwnProperty.call(ex, k));
    if (hasForbidden) {
      return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_KG_PRESCRIPTION_FORBIDDEN], warnings, requirements, metrics: emptyMetrics(), detail: ex.id };
    }
  }

  // unilateral side coverage requirement (metadata, not hard fail at selection)
  const hasUnilateral = resolved.some((ex) => STRENGTH_SIDE_SEMANTICS.UNILATERAL_LATERALITIES.includes(ex.laterality));
  if (hasUnilateral) {
    requirements.push(STRENGTH_SIDE_SEMANTICS.BOTH_SIDES_REQUIRED);
  }

  const metrics = computeMetrics(resolved);

  // combined-day interference risk (beginner + combined + heavy lower-body stack)
  const isCombined = input.sessionType === STRENGTH_SESSION_TYPES.COMBINED_BOXING_STRENGTH_DAY;
  const isBeginner = input.experienceLevel === EXPERIENCE_LEVELS.BEGINNER;
  const lowerStack = resolved.filter((ex) => ex.bodyRegion === 'lower').map((ex) => ex.movementPattern);
  const uniqueLower = new Set(lowerStack);
  if (isCombined && isBeginner && uniqueLower.size >= 3) {
    warnings.push(RC.STR_COMBINED_DAY_INTERFERENCE_RISK);
  }

  const verdict = warnings.length > 0 ? STRENGTH_BALANCE_VERDICTS.WARNING : STRENGTH_BALANCE_VERDICTS.PASS;
  return { valid: true, verdict, reasons, warnings, requirements, metrics };
}

/**
 * Prescription type guard (ayrı API). input: { exerciseId, prescriptionType }
 */
export function validateStrengthPrescription(input = {}) {
  const ex = STRENGTH_EXERCISE_BY_ID[input.exerciseId];
  if (!ex) {
    return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_UNKNOWN_EXERCISE], detail: input.exerciseId };
  }
  if (!Object.values(STRENGTH_PRESCRIPTION_TYPES).includes(input.prescriptionType)) {
    return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_INVALID_PRESCRIPTION_TYPE], detail: input.prescriptionType };
  }
  if (ex.prescriptionType !== input.prescriptionType) {
    return { valid: false, verdict: STRENGTH_BALANCE_VERDICTS.FAIL, reasons: [RC.STR_INVALID_PRESCRIPTION_TYPE], detail: `${ex.id} expects ${ex.prescriptionType}` };
  }
  return { valid: true, verdict: STRENGTH_BALANCE_VERDICTS.PASS, reasons: [] };
}

/**
 * Week/phase-level neglect + repeated-pattern density.
 * sessions: array of { exerciseIds:[] }
 */
export function evaluateStrengthWeekBalance(sessions = []) {
  const reasons = [];
  const warnings = [];
  const allPatterns = new Set();
  let prevLowerSet = null;

  sessions.forEach((s) => {
    const ids = Array.isArray(s?.exerciseIds) ? s.exerciseIds : [];
    const resolved = ids.map((id) => STRENGTH_EXERCISE_BY_ID[id]).filter(Boolean);
    resolved.forEach((ex) => allPatterns.add(ex.movementPattern));

    // adjacent-day repeated lower-body pattern density
    const lowerSet = new Set(resolved.filter((ex) => ex.bodyRegion === 'lower').map((ex) => ex.movementPattern));
    if (lowerSet.size >= 2 && prevLowerSet && [...lowerSet].every((p) => prevLowerSet.has(p))) {
      warnings.push(RC.STR_REPEATED_PATTERN_DENSITY);
    }
    prevLowerSet = lowerSet;
  });

  // pattern neglect detection (only when a meaningful window of sessions exists)
  if (sessions.length > 0) {
    if (!allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.PUSH)) warnings.push(RC.STR_PUSH_NEGLECT);
    if (!allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.ROW)) warnings.push(RC.STR_PULL_NEGLECT);
    if (!allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.HINGE)) warnings.push(RC.STR_HINGE_NEGLECT);
    if (!allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.CORE_ANTI_EXTENSION) && !allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.CORE_LATERAL_STABILITY)) {
      warnings.push(RC.STR_CORE_NEGLECT);
    }
    if (!allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.SQUAT) && !allPatterns.has(STRENGTH_MOVEMENT_PATTERNS.LUNGE)) {
      warnings.push(RC.STR_LOWER_NEGLECT);
    }
  }

  const verdict = warnings.length > 0 ? STRENGTH_BALANCE_VERDICTS.WARNING : STRENGTH_BALANCE_VERDICTS.PASS;
  return { valid: true, verdict, reasons, warnings, requirements: [], patternsCovered: [...allPatterns] };
}

/** Pattern coverage set (deterministic). */
export function evaluateStrengthPatternCoverage(sessions = []) {
  const patterns = new Set();
  for (const s of sessions) {
    const ids = Array.isArray(s?.exerciseIds) ? s.exerciseIds : [];
    for (const id of ids) {
      const ex = STRENGTH_EXERCISE_BY_ID[id];
      if (ex) patterns.add(ex.movementPattern);
    }
  }
  return [...patterns];
}

export { EXERCISES };