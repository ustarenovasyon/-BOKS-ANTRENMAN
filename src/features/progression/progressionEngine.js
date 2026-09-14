/**
 * PROGRAM PROGRESSION ENGINE V1 (PART 13)
 * --------------------------------------------------------------
 * Pure/deterministic. Calendar/tarih bağımsız. Program ÜRETMEZ.
 * PART 12 time envelope hard limit. sessionDuration değişmez.
 * Output: phase + boxing/strength progression envelope'ları.
 * --------------------------------------------------------------
 */
import {
  PROGRAM_PROGRESSION_ENGINE_VERSION, PROGRAM_DURATION_MONTHS, PROGRAM_MODES,
  EXPERIENCE_LEVELS, DIFFICULTY_LEVELS, PROGRESSION_REASON_CODES,
} from '@/config/architecture';
import { resolvePhase, validatePhaseModels } from './progressionPhaseEngine';
import { buildBoxingProgression } from './boxingProgressionEngine';
import { buildStrengthProgression } from './strengthProgressionEngine';
import { PROGRESSION_CONSTRAINTS } from './progressionConstants';

const RC = PROGRESSION_REASON_CODES;
const MODE_BOXING = PROGRAM_MODES.BOXING_ONLY;
const MODE_STRENGTH = PROGRAM_MODES.STRENGTH_ONLY;
const MODE_COMBINED = PROGRAM_MODES.BOXING_AND_STRENGTH;

function validateInput(input) {
  const reasons = [];
  const validDurations = Object.values(PROGRAM_DURATION_MONTHS);
  if (!validDurations.includes(input.durationMonths)) reasons.push(RC.PROGRESSION_INVALID_DURATION);
  if (!Object.values(PROGRAM_MODES).includes(input.programMode)) reasons.push(RC.PROGRESSION_INVALID_MODE);
  if (!Object.values(EXPERIENCE_LEVELS).includes(input.experienceLevel)) reasons.push(RC.PROGRESSION_INVALID_EXPERIENCE);
  if (!Object.values(DIFFICULTY_LEVELS).includes(input.difficulty)) reasons.push(RC.PROGRESSION_INVALID_DIFFICULTY);
  if (!Number.isInteger(input.trainingOrdinal) || input.trainingOrdinal < 1) reasons.push(RC.PROGRESSION_INVALID_ORDINAL);
  if (!Number.isInteger(input.totalPlannedTrainingSessions) || input.totalPlannedTrainingSessions < 1) reasons.push(RC.PROGRESSION_INVALID_TOTAL_SESSION_COUNT);
  if (Number.isInteger(input.trainingOrdinal) && Number.isInteger(input.totalPlannedTrainingSessions) && input.trainingOrdinal > input.totalPlannedTrainingSessions) {
    reasons.push(RC.PROGRESSION_INVALID_ORDINAL);
  }
  return { valid: reasons.length === 0, reasons };
}

/**
 * input: {
 *   durationMonths, programMode, experienceLevel, difficulty,
 *   trainingOrdinal, totalPlannedTrainingSessions,
 *   userBoxingMaxMoves,            // required for boxing/combined
 *   sessionBudget                  // PART 12 result (for strength eligible/preferred)
 * }
 */
export function buildProgramProgression(input = {}) {
  const v = validateInput(input);
  if (!v.valid) {
    return { valid: false, engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION, reasons: v.reasons, warnings: [], result: null };
  }
  const {
    durationMonths, programMode, experienceLevel, difficulty,
    trainingOrdinal, totalPlannedTrainingSessions, userBoxingMaxMoves, sessionBudget,
  } = input;

  const phaseRes = resolvePhase(durationMonths, trainingOrdinal, totalPlannedTrainingSessions);
  if (!phaseRes.valid) {
    return { valid: false, engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION, reasons: phaseRes.reasons, warnings: [], result: null };
  }

  const hasBoxing = programMode === MODE_BOXING || programMode === MODE_COMBINED;
  const hasStrength = programMode === MODE_STRENGTH || programMode === MODE_COMBINED;

  let boxingProgression = null;
  if (hasBoxing) {
    if (!Number.isInteger(userBoxingMaxMoves) || userBoxingMaxMoves < 2) {
      return { valid: false, engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION, reasons: [RC.PROGRESSION_INVALID_BOXING_MAX_MOVES], warnings: [], result: null };
    }
    boxingProgression = buildBoxingProgression(durationMonths, experienceLevel, difficulty, phaseRes.phase.id, userBoxingMaxMoves);
  }

  let strengthProgression = null;
  if (hasStrength) {
    if (!sessionBudget || !sessionBudget.strengthBudget) {
      return { valid: false, engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION, reasons: [RC.PROGRESSION_MISSING_SESSION_BUDGET], warnings: [], result: null };
    }
    strengthProgression = buildStrengthProgression(durationMonths, experienceLevel, difficulty, phaseRes.phase.id, sessionBudget.strengthBudget);
    if (strengthProgression && strengthProgression.invalid) {
      return { valid: false, engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION, reasons: [RC.PROGRESSION_MOVEMENT_COUNT_OUTSIDE_TIME_ENVELOPE], warnings: [], result: null };
    }
  }

  const result = {
    engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION,
    durationMonths,
    trainingOrdinal,
    totalPlannedTrainingSessions,
    phase: phaseRes.phase,
    boxingProgression,
    strengthProgression,
    constraints: PROGRESSION_CONSTRAINTS,
  };

  return { valid: true, engineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION, reasons: [], warnings: [], result };
}

export { validatePhaseModels };