/**
 * BOXING PROGRESSION ENGINE (PART 13)
 * --------------------------------------------------------------
 * Phase → combo ceiling, work target, rest, defense exposure.
 * Combo ceiling difficulty'den bağımsız. Work max 120. Rest korunur.
 * Approved combination seçmez; yalnız ceiling/envelope üretir.
 * --------------------------------------------------------------
 */
import { DIFFICULTY_LEVELS } from '@/config/architecture';
import {
  COMBO_CEILINGS, WORK_OFFSETS, DEFENSE_EXPOSURE, BOXING_WORK_SECONDS_CAP, phaseIndexFor,
} from './progressionConstants';
import { BOXING_WORK_SECONDS, BOXING_REST_SECONDS } from '@/features/sessionBudget/sessionBudgetConstants';

/**
 * Boxing progression result for a resolved phase.
 * userBoxingMaxMoves hard cap. effectiveComboCeiling = min(phase, userCap).
 */
export function buildBoxingProgression(durationMonths, experienceLevel, difficulty, phaseId, userBoxingMaxMoves) {
  const idx = phaseIndexFor(durationMonths, phaseId);
  if (idx < 0) return null;
  const phaseComboCeiling = COMBO_CEILINGS[durationMonths][experienceLevel][idx];
  const effectiveComboCeiling = Math.min(phaseComboCeiling, userBoxingMaxMoves);
  const baseWorkSeconds = BOXING_WORK_SECONDS[experienceLevel] || 0;
  const workProgressionOffsetSeconds = WORK_OFFSETS[durationMonths][idx];
  const targetWorkSeconds = Math.min(baseWorkSeconds + workProgressionOffsetSeconds, BOXING_WORK_SECONDS_CAP);
  const restSeconds = BOXING_REST_SECONDS[difficulty] || 0;
  const defenseExposureLevel = DEFENSE_EXPOSURE[durationMonths][experienceLevel][phaseId] || 'none';
  return {
    phaseComboCeiling,
    effectiveComboCeiling,
    baseWorkSeconds,
    workProgressionOffsetSeconds,
    targetWorkSeconds,
    restSeconds,
    defenseExposureLevel,
  };
}