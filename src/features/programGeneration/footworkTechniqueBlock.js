/**
 * FOOTWORK TECHNIQUE BLOCK SUPPORT (PART 34)
 * --------------------------------------------------------------
 * Dormant V2-only isolated-learning contract. Production scheduling YOK.
 * Curriculum eligibility merkezi curriculum helpers'tan derive edilir.
 * V1 generated workout bu block'u üretmez.
 * --------------------------------------------------------------
 */
import {
  BOXING_MOVEMENT_TYPES,
  GENERATION_POLICY_VERSIONS,
  WEEKLY_SESSION_ROLES,
  WORKOUT_BLOCK_TYPES,
} from '@/config/architecture';
import { BOXING_MOVES } from '@/features/boxing/library/boxingMoves';
import { isTechniqueAllowedAtStage } from '@/features/boxing/curriculum/boxingTechniqueCurriculum';
import {
  deriveBoxingExposureIndex,
  resolveBoxingCurriculumStage,
} from '@/features/boxing/curriculum/boxingCurriculumStageResolver';

const MOVE_BY_ID = new Map(BOXING_MOVES.map((move) => [move.id, move]));
const BOXING_CAPABLE_ROLES = new Set([
  WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY,
  WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY,
]);
const BOXING_INTERVAL_TYPES = new Set([
  WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK,
  WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK,
  WORKOUT_BLOCK_TYPES.BOXING_REST,
]);

export const FOOTWORK_TECHNIQUE_FORBIDDEN_FIELDS = Object.freeze([
  'combinationId',
  'moveIds',
  'moveCount',
  'requiredContext',
  'roundIndex',
  'defenseRuleId',
  'incomingThreatType',
  'defenseMoveId',
  'counterMoveIds',
  'opponentStanceRelation',
  'workingRange',
  'footworkPrescription',
]);

function isCanonicalActiveFootworkMove(moveId) {
  const move = MOVE_BY_ID.get(moveId);
  return !!(
    move
    && move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK
    && move.approved === true
    && move.active === true
  );
}

export function getEligibleFootworkMoveIdsAtStage(stage) {
  return BOXING_MOVES
    .filter((move) => isCanonicalActiveFootworkMove(move.id) && isTechniqueAllowedAtStage(move.id, stage))
    .map((move) => move.id);
}

export function buildFootworkTechniqueDescriptor({ footworkMoveId, plannedSeconds } = {}) {
  if (!isCanonicalActiveFootworkMove(footworkMoveId)) {
    return { valid: false, reason: 'footwork_move_invalid', descriptor: null };
  }
  if (!Number.isInteger(plannedSeconds) || plannedSeconds <= 0) {
    return { valid: false, reason: 'footwork_planned_seconds_invalid', descriptor: null };
  }
  return {
    valid: true,
    reason: null,
    descriptor: { footworkMoveId, plannedSeconds },
  };
}

export function resolveFootworkCurriculumStageForDay({ settings, programDays, day } = {}) {
  if (!settings || !day || !Array.isArray(programDays)) {
    return { valid: false, reason: 'footwork_curriculum_context_missing', stage: null };
  }
  if (!BOXING_CAPABLE_ROLES.has(day.sessionRole)) {
    return { valid: false, reason: 'footwork_role_not_boxing_capable', stage: null };
  }
  const exposure = deriveBoxingExposureIndex(programDays, day.id);
  if (!exposure || !exposure.isBoxingExposure || !exposure.boxingExposureOrdinal) {
    return { valid: false, reason: 'footwork_boxing_exposure_invalid', stage: null };
  }
  const stageResult = resolveBoxingCurriculumStage({
    durationMonths: settings.durationMonths,
    experienceLevel: settings.experienceLevel,
    boxingExposureOrdinal: exposure.boxingExposureOrdinal,
    totalBoxingExposures: exposure.totalBoxingExposures,
  });
  if (!stageResult.valid) {
    return { valid: false, reason: stageResult.reason, stage: null };
  }
  return { valid: true, reason: null, stage: stageResult.stage };
}

export function validateFootworkTechniqueBlock({ block, settings, programDays, day } = {}) {
  const reasons = [];
  if (!block || block.type !== WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE) {
    reasons.push('footwork_block_type_invalid');
    return { valid: false, reasons, stage: null };
  }
  if (!Number.isInteger(block.plannedSeconds) || block.plannedSeconds <= 0) {
    reasons.push('footwork_planned_seconds_invalid');
  }
  if (!isCanonicalActiveFootworkMove(block.footworkMoveId)) {
    reasons.push('footwork_move_invalid');
  }
  for (const key of FOOTWORK_TECHNIQUE_FORBIDDEN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(block, key)) reasons.push(`footwork_forbidden_field:${key}`);
  }

  const stageResult = resolveFootworkCurriculumStageForDay({ settings, programDays, day });
  if (!stageResult.valid) {
    reasons.push(stageResult.reason);
  } else if (!isTechniqueAllowedAtStage(block.footworkMoveId, stageResult.stage)) {
    reasons.push('footwork_move_not_allowed_at_stage');
  }

  return { valid: reasons.length === 0, reasons, stage: stageResult.stage };
}

export function validateFootworkTechniqueDay({
  day,
  dayBlocks,
  programDays,
  settings,
  generationPolicyVersion,
} = {}) {
  const blocks = Array.isArray(dayBlocks) ? dayBlocks : [];
  const footworkBlocks = blocks.filter((block) => block.type === WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE);
  if (footworkBlocks.length === 0) return { valid: true, present: false, reasons: [] };

  const reasons = [];
  if (generationPolicyVersion !== GENERATION_POLICY_VERSIONS.V2) reasons.push('footwork_requires_v2_policy');
  if (footworkBlocks.length !== 1) reasons.push('footwork_block_count_invalid');

  const block = footworkBlocks[0];
  if (block) {
    const content = validateFootworkTechniqueBlock({ block, settings, programDays, day });
    if (!content.valid) reasons.push(...content.reasons);

    const warmup = blocks.find((candidate) => candidate.type === WORKOUT_BLOCK_TYPES.WARMUP);
    const firstBoxingInterval = blocks.find((candidate) => BOXING_INTERVAL_TYPES.has(candidate.type));
    if (!warmup || !firstBoxingInterval) {
      reasons.push('footwork_block_order_context_missing');
    } else if (!(block.orderIndex > warmup.orderIndex && block.orderIndex < firstBoxingInterval.orderIndex)) {
      reasons.push('footwork_block_order_invalid');
    }

    const boxingIntervalSeconds = blocks
      .filter((candidate) => BOXING_INTERVAL_TYPES.has(candidate.type))
      .reduce((sum, candidate) => sum + (candidate.plannedSeconds || 0), 0);
    const boxingBudgetSeconds = day?.budgetSnapshot?.boxingSeconds;
    if (!Number.isInteger(boxingBudgetSeconds) || block.plannedSeconds + boxingIntervalSeconds !== boxingBudgetSeconds) {
      reasons.push('footwork_boxing_budget_composition_invalid');
    }
  }

  return { valid: reasons.length === 0, present: true, reasons };
}
