/**
 * FOOTWORK INTEGRATION PRESCRIPTION SUPPORT (PART 35)
 * --------------------------------------------------------------
 * Dormant V2-only attack metadata contract. Scheduling/frequency YOK.
 * Prescription punch combo moveIds/moveCount/plannedSeconds değiştirmez.
 * --------------------------------------------------------------
 */
import {
  BOXING_FOOTWORK_INTEGRATION_PHASES,
  GENERATION_POLICY_VERSIONS,
  WORKOUT_BLOCK_TYPES,
} from '@/config/architecture';
import {
  getEligibleFootworkMoveIdsAtStage,
  isCanonicalActiveFootworkMove,
  resolveFootworkCurriculumStageForDay,
} from './footworkTechniqueBlock';

const PHASES = new Set(Object.values(BOXING_FOOTWORK_INTEGRATION_PHASES));
const TOP_LEVEL_FIELDS = new Set(['actions']);
const ACTION_FIELDS = new Set(['phase', 'movementId']);

export function validateFootworkPrescriptionShape(prescription) {
  const reasons = [];
  if (!prescription || typeof prescription !== 'object' || Array.isArray(prescription)) {
    return { valid: false, reasons: ['footwork_prescription_invalid'] };
  }
  for (const key of Object.keys(prescription)) {
    if (!TOP_LEVEL_FIELDS.has(key)) reasons.push(`footwork_prescription_unknown_field:${key}`);
  }
  if (!Array.isArray(prescription.actions) || prescription.actions.length < 1 || prescription.actions.length > 2) {
    reasons.push('footwork_prescription_action_count_invalid');
    return { valid: false, reasons };
  }

  const seenPhases = new Set();
  let beforeIndex = -1;
  let afterIndex = -1;
  prescription.actions.forEach((action, index) => {
    if (!action || typeof action !== 'object' || Array.isArray(action)) {
      reasons.push('footwork_prescription_action_invalid');
      return;
    }
    for (const key of Object.keys(action)) {
      if (!ACTION_FIELDS.has(key)) reasons.push(`footwork_prescription_action_unknown_field:${key}`);
    }
    if (!PHASES.has(action.phase)) {
      reasons.push('footwork_prescription_phase_invalid');
    } else {
      if (seenPhases.has(action.phase)) reasons.push('footwork_prescription_duplicate_phase');
      seenPhases.add(action.phase);
      if (action.phase === BOXING_FOOTWORK_INTEGRATION_PHASES.BEFORE_COMBO) beforeIndex = index;
      if (action.phase === BOXING_FOOTWORK_INTEGRATION_PHASES.AFTER_COMBO) afterIndex = index;
    }
    if (!isCanonicalActiveFootworkMove(action.movementId)) {
      reasons.push('footwork_prescription_movement_invalid');
    }
  });

  if (beforeIndex >= 0 && afterIndex >= 0 && beforeIndex > afterIndex) {
    reasons.push('footwork_prescription_phase_order_invalid');
  }
  return { valid: reasons.length === 0, reasons };
}

export function buildFootworkPrescription({ actions } = {}) {
  const prescription = { actions: Array.isArray(actions) ? actions.map((action) => ({ ...action })) : actions };
  const validation = validateFootworkPrescriptionShape(prescription);
  if (!validation.valid) return { valid: false, reasons: validation.reasons, prescription: null };
  return { valid: true, reasons: [], prescription };
}

export function cloneFootworkPrescription(prescription) {
  if (!prescription || typeof prescription !== 'object') return prescription;
  return {
    ...prescription,
    ...(Array.isArray(prescription.actions)
      ? { actions: prescription.actions.map((action) => (action && typeof action === 'object' ? { ...action } : action)) }
      : {}),
  };
}

export function validateFootworkPrescriptionOnAttackBlock({ block, settings, programDays, day } = {}) {
  const reasons = [];
  if (!block || block.type !== WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK) {
    return { valid: false, reasons: ['footwork_prescription_requires_attack_block'], stage: null };
  }
  if (!Object.prototype.hasOwnProperty.call(block, 'footworkPrescription')) {
    return { valid: true, present: false, reasons: [], stage: null };
  }

  const shape = validateFootworkPrescriptionShape(block.footworkPrescription);
  if (!shape.valid) reasons.push(...shape.reasons);

  const stageResult = resolveFootworkCurriculumStageForDay({ settings, programDays, day });
  if (!stageResult.valid) {
    reasons.push(stageResult.reason);
  } else if (shape.valid) {
    const eligible = new Set(getEligibleFootworkMoveIdsAtStage(stageResult.stage));
    for (const action of block.footworkPrescription.actions) {
      if (!eligible.has(action.movementId)) reasons.push('footwork_prescription_movement_not_allowed_at_stage');
    }
  }

  return { valid: reasons.length === 0, present: true, reasons, stage: stageResult.stage };
}

export function validateFootworkPrescriptionDay({
  day,
  dayBlocks,
  programDays,
  settings,
  generationPolicyVersion,
} = {}) {
  const blocks = Array.isArray(dayBlocks) ? dayBlocks : [];
  const carriers = blocks.filter((block) => Object.prototype.hasOwnProperty.call(block, 'footworkPrescription'));
  if (carriers.length === 0) return { valid: true, present: false, reasons: [], prescriptionCount: 0 };

  const reasons = [];
  if (generationPolicyVersion !== GENERATION_POLICY_VERSIONS.V2) {
    reasons.push('footwork_prescription_requires_v2_policy');
  }

  for (const block of carriers) {
    if (block.type !== WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK) {
      reasons.push('footwork_prescription_non_attack_block');
      continue;
    }
    const validation = validateFootworkPrescriptionOnAttackBlock({ block, settings, programDays, day });
    if (!validation.valid) reasons.push(...validation.reasons);
  }

  return {
    valid: reasons.length === 0,
    present: true,
    reasons,
    prescriptionCount: carriers.length,
  };
}
