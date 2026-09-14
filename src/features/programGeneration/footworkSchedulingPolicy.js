/**
 * FOOTWORK SCHEDULING POLICY (PART 36)
 * --------------------------------------------------------------
 * Dormant V2-only isolated-learning scheduling policy.
 * Generator'a bağlı değildir; V1 production output'u değiştirmez.
 * Attack round role planından bağımsız pedagojik katmandır.
 * --------------------------------------------------------------
 */
import { GENERATION_POLICY_VERSIONS } from '@/config/architecture';
import { getEligibleFootworkMoveIdsAtStage } from './footworkTechniqueBlock';
import { deriveStageLocalExposureOrdinal } from '@/features/boxing/curriculum/boxingV2AttackRoundRolePolicy';

export const FOOTWORK_TECHNIQUE_SECONDS = 60;
export const MIN_BOXING_INTERVAL_SECONDS_AFTER_FOOTWORK = 180;
export const FOOTWORK_REPEAT_EVERY_STAGE_LOCAL_EXPOSURES = 3;

function newlyUnlockedFootworkMoveIds(stage) {
  const current = getEligibleFootworkMoveIdsAtStage(stage);
  const previous = new Set(getEligibleFootworkMoveIdsAtStage(stage - 1));
  return current.filter((moveId) => !previous.has(moveId));
}

function chooseFootworkMoveId({ eligibleMoveIds, newlyUnlockedMoveIds, stageLocalOrdinal }) {
  if (newlyUnlockedMoveIds.length > 0 && stageLocalOrdinal <= newlyUnlockedMoveIds.length) {
    return newlyUnlockedMoveIds[stageLocalOrdinal - 1] || null;
  }
  if (eligibleMoveIds.length === 0) return null;
  return eligibleMoveIds[(stageLocalOrdinal - 1) % eligibleMoveIds.length] || null;
}

function shouldScheduleIsolatedFootwork({ stageLocalOrdinal, newlyUnlockedCount }) {
  if (stageLocalOrdinal === 1) return true;
  if (newlyUnlockedCount > 0 && stageLocalOrdinal <= newlyUnlockedCount) return true;
  return stageLocalOrdinal % FOOTWORK_REPEAT_EVERY_STAGE_LOCAL_EXPOSURES === 0;
}

/**
 * Pure deterministic session-level policy.
 *
 * - Stage'in ilk exposure'ı: isolated technique.
 * - Stage'de yeni footwork movement açılıyorsa introduction window boyunca
 *   her exposure (current library'de Stage 1 ve Stage 2 için ilk iki exposure).
 * - Sonrasında her 3. stage-local exposure: controlled repetition.
 * - Isolated block 60 sn; mevcut boxing budget'tan düşer.
 * - Kalan interval en az 180 sn olmalı, aksi halde fail-closed.
 */
export function planV2FootworkTechniqueSession({
  generationPolicyVersion,
  durationMonths,
  experienceLevel,
  boxingExposureOrdinal,
  totalBoxingExposures,
  boxingSeconds,
} = {}) {
  if (generationPolicyVersion !== GENERATION_POLICY_VERSIONS.V2) {
    return {
      valid: false,
      reason: 'footwork_scheduling_requires_v2_policy',
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds: null,
      stage: null,
      stageLocalOrdinal: null,
    };
  }

  if (!Number.isInteger(boxingSeconds) || boxingSeconds <= 0) {
    return {
      valid: false,
      reason: 'footwork_scheduling_invalid_boxing_seconds',
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds: null,
      stage: null,
      stageLocalOrdinal: null,
    };
  }

  const local = deriveStageLocalExposureOrdinal({
    durationMonths,
    experienceLevel,
    boxingExposureOrdinal,
    totalBoxingExposures,
  });
  if (!local.valid) {
    return {
      valid: false,
      reason: local.reason,
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds: null,
      stage: null,
      stageLocalOrdinal: null,
    };
  }

  const eligibleMoveIds = getEligibleFootworkMoveIdsAtStage(local.stage);
  if (eligibleMoveIds.length === 0) {
    return {
      valid: false,
      reason: 'footwork_scheduling_curriculum_starvation',
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds: null,
      stage: local.stage,
      stageLocalOrdinal: local.stageLocalOrdinal,
    };
  }

  const newlyUnlockedMoveIds = newlyUnlockedFootworkMoveIds(local.stage);
  const scheduled = shouldScheduleIsolatedFootwork({
    stageLocalOrdinal: local.stageLocalOrdinal,
    newlyUnlockedCount: newlyUnlockedMoveIds.length,
  });

  if (!scheduled) {
    return {
      valid: true,
      reason: null,
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds: boxingSeconds,
      stage: local.stage,
      stageLocalOrdinal: local.stageLocalOrdinal,
      eligibleMoveIds: Object.freeze([...eligibleMoveIds]),
      newlyUnlockedMoveIds: Object.freeze([...newlyUnlockedMoveIds]),
    };
  }

  const boxingIntervalSeconds = boxingSeconds - FOOTWORK_TECHNIQUE_SECONDS;
  if (boxingIntervalSeconds < MIN_BOXING_INTERVAL_SECONDS_AFTER_FOOTWORK) {
    return {
      valid: false,
      reason: 'footwork_scheduling_insufficient_boxing_budget',
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds,
      stage: local.stage,
      stageLocalOrdinal: local.stageLocalOrdinal,
    };
  }

  const footworkMoveId = chooseFootworkMoveId({
    eligibleMoveIds,
    newlyUnlockedMoveIds,
    stageLocalOrdinal: local.stageLocalOrdinal,
  });
  if (!footworkMoveId) {
    return {
      valid: false,
      reason: 'footwork_scheduling_move_selection_failed',
      scheduled: false,
      footworkMoveId: null,
      footworkTechniqueSeconds: 0,
      boxingIntervalSeconds: null,
      stage: local.stage,
      stageLocalOrdinal: local.stageLocalOrdinal,
    };
  }

  return {
    valid: true,
    reason: null,
    scheduled: true,
    footworkMoveId,
    footworkTechniqueSeconds: FOOTWORK_TECHNIQUE_SECONDS,
    boxingIntervalSeconds,
    stage: local.stage,
    stageLocalOrdinal: local.stageLocalOrdinal,
    eligibleMoveIds: Object.freeze([...eligibleMoveIds]),
    newlyUnlockedMoveIds: Object.freeze([...newlyUnlockedMoveIds]),
  };
}
