/**
 * V2 ATTACK ROUND ROLE POLICY (PART 26)
 * --------------------------------------------------------------
 * V2 boxing session içindeki her ATTACK ROUND için deterministic
 * role-plan sistemi. Role'ler:
 *
 *   FOUNDATIONAL — session'ın ilk attack round'u (warmup/intro)
 *   SUPPORT      — kısa kombinasyonların korunması (supportRange)
 *   MAIN         — session'ın ana çalışma grubu (targetRange)
 *   CHALLENGE    — kontrollü seyrek uzun combo exposure'ı
 *
 * PART 26'da bu roller selector'a BAĞLANMAZ.
 * V1 generation değişmez. V2 production aktif edilmez.
 *
 * Defense attack-role planının parçası DEĞİLDİR.
 * Round objective (speed/timing/rhythm vs.) role DEĞİLDİR.
 *
 * Stage-local ordinal PART 22 resolver üzerinden derive edilir —
 * timeline formülleri DUPLICATE EDİLMEZ.
 * --------------------------------------------------------------
 */
import { EXPERIENCE_LEVELS } from '@/config/architecture';
import { BOXING_CURRICULUM_STAGES } from './boxingTechniqueCurriculum';
import {
  resolveBoxingCurriculumStage,
  resolveCurriculumBoundaries,
  BEGINNER_DURATION_MAX_STAGE,
} from './boxingCurriculumStageResolver';

/** Immutable V2 attack round role constants. */
export const V2_ATTACK_ROUND_ROLES = Object.freeze({
  FOUNDATIONAL: 'foundational',
  SUPPORT: 'support',
  MAIN: 'main',
  CHALLENGE: 'challenge',
});

const VALID_ROLES = Object.freeze(new Set(Object.values(V2_ATTACK_ROUND_ROLES)));

/** Challenge için minimum attack round sayısı. */
const CHALLENGE_MIN_ATTACK_ROUNDS = 10;

/** Challenge için minimum stage-local exposure ordinal. */
const CHALLENGE_MIN_STAGE_LOCAL_ORDINAL = 3;

/** Support count oranı. */
const SUPPORT_RATIO = 0.20;

/**
 * Stage-local exposure ordinal'ı PART 22 resolver üzerinden derive eder.
 * Timeline formüllerini duplicate ETMEZ — resolveCurriculumBoundaries kullanır.
 *
 * @returns {{ valid: boolean, stageLocalOrdinal: number|null, stage: number|null, stageStart: number|null, ... }}
 */
export function deriveStageLocalExposureOrdinal({
  durationMonths,
  experienceLevel,
  boxingExposureOrdinal,
  totalBoxingExposures,
} = {}) {
  const stageResult = resolveBoxingCurriculumStage({
    durationMonths,
    experienceLevel,
    boxingExposureOrdinal,
    totalBoxingExposures,
  });
  if (!stageResult.valid) {
    return { valid: false, reason: stageResult.reason, stageLocalOrdinal: null, stage: null, stageStart: null };
  }

  const boundaries = resolveCurriculumBoundaries(durationMonths, experienceLevel, totalBoxingExposures);
  if (!boundaries) {
    return { valid: false, reason: 'invalid_boundaries', stageLocalOrdinal: null, stage: null, stageStart: null };
  }

  const stage = stageResult.stage;
  let stageStart;

  if (stage === BOXING_CURRICULUM_STAGES.FUNDAMENTALS) {
    stageStart = 1;
  } else if (stage === BOXING_CURRICULUM_STAGES.BASIC_COMBINATION) {
    stageStart = (boundaries.stage1End || 0) + 1;
  } else if (stage === BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION) {
    stageStart = (boundaries.stage2End || boundaries.stage1End || 0) + 1;
  } else if (stage === BOXING_CURRICULUM_STAGES.ADVANCED_STRIKE_INTEGRATION) {
    stageStart = (boundaries.stage3End || boundaries.stage2End || boundaries.stage1End || 0) + 1;
  } else {
    return { valid: false, reason: 'unsupported_stage_for_role_policy', stageLocalOrdinal: null, stage: null, stageStart: null };
  }

  const stageLocalOrdinal = boxingExposureOrdinal - stageStart + 1;

  return {
    valid: true,
    stageLocalOrdinal,
    stage,
    stageStart,
  };
}

/**
 * Challenge eligibility — TAMAMI doğruysa eligible.
 *
 *   Beginner V2 role policy supported
 *   AND attackRoundCount >= 10
 *   AND currentStage === finalReachableStage
 *   AND currentStage > 1
 *   AND currentStageExposureOrdinal >= 3
 */
function isChallengeEligible({ attackRoundCount, currentStage, finalStage, durationMonths, experienceLevel, boxingExposureOrdinal, totalBoxingExposures }) {
  if (attackRoundCount < CHALLENGE_MIN_ATTACK_ROUNDS) return false;
  if (currentStage !== finalStage) return false;
  if (currentStage <= BOXING_CURRICULUM_STAGES.FUNDAMENTALS) return false;

  const localResult = deriveStageLocalExposureOrdinal({
    durationMonths,
    experienceLevel,
    boxingExposureOrdinal,
    totalBoxingExposures,
  });
  if (!localResult.valid) return false;

  return localResult.stageLocalOrdinal >= CHALLENGE_MIN_STAGE_LOCAL_ORDINAL;
}

/**
 * Final reachable curriculum stage — PART 22 BEGINNER_DURATION_MAX_STAGE üzerinden.
 * Duplicate edilmez.
 */
function resolveFinalReachableStage(durationMonths, experienceLevel) {
  if (experienceLevel !== EXPERIENCE_LEVELS.BEGINNER) return null;
  return BEGINNER_DURATION_MAX_STAGE[durationMonths] || null;
}

/**
 * Support slot'larını deterministic olarak dağıtır.
 * Reserved index'ler (foundation, challenge) hariç tutulur.
 * Bresenham-tarzı eşit aralıklı dağıtım.
 */
function distributeSupportSlots(attackRoundCount, supportCount, challengeIndex) {
  const reserved = new Set([0]);
  if (challengeIndex !== null) reserved.add(challengeIndex);

  const availableIndices = [];
  for (let i = 0; i < attackRoundCount; i++) {
    if (!reserved.has(i)) availableIndices.push(i);
  }

  const slots = [];
  const n = availableIndices.length;
  for (let s = 0; s < supportCount && n > 0; s++) {
    const slot = Math.floor((s * n) / supportCount);
    slots.push(availableIndices[slot]);
  }

  return Object.freeze(slots);
}

/**
 * Ordered attack role plan üretir.
 *
 * Positioning:
 *   index 0                    → FOUNDATIONAL
 *   index attackRoundCount - 2 → CHALLENGE (if eligible)
 *   SUPPORT evenly distributed among remaining MAIN slots
 *   remaining                  → MAIN
 *
 * @param {object} input
 * @param {number} input.attackRoundCount
 * @param {number} input.durationMonths
 * @param {string} input.experienceLevel
 * @param {number} input.boxingExposureOrdinal
 * @param {number} input.totalBoxingExposures
 * @returns {{ valid: boolean, rolePlan: string[], counts: object, ... }}
 */
export function buildV2AttackRoundRolePlan({
  attackRoundCount,
  durationMonths,
  experienceLevel,
  boxingExposureOrdinal,
  totalBoxingExposures,
} = {}) {
  // Validate attackRoundCount
  if (!Number.isInteger(attackRoundCount) || attackRoundCount < 0) {
    return { valid: false, reason: 'invalid_attack_round_count', rolePlan: [], counts: null };
  }

  // Edge: 0 attack rounds
  if (attackRoundCount === 0) {
    return {
      valid: true,
      rolePlan: Object.freeze([]),
      counts: Object.freeze({ foundational: 0, support: 0, main: 0, challenge: 0 }),
      challengeEligible: false,
      currentStage: null,
      finalStage: null,
    };
  }

  // Validate curriculum context
  const stageResult = resolveBoxingCurriculumStage({
    durationMonths,
    experienceLevel,
    boxingExposureOrdinal,
    totalBoxingExposures,
  });
  if (!stageResult.valid) {
    return { valid: false, reason: stageResult.reason, rolePlan: [], counts: null };
  }

  const currentStage = stageResult.stage;
  const finalStage = resolveFinalReachableStage(durationMonths, experienceLevel);
  if (finalStage === null) {
    return { valid: false, reason: 'unsupported_experience_or_duration', rolePlan: [], counts: null };
  }

  // Challenge eligibility
  const challengeEligible = isChallengeEligible({
    attackRoundCount,
    currentStage,
    finalStage,
    durationMonths,
    experienceLevel,
    boxingExposureOrdinal,
    totalBoxingExposures,
  });

  // Role counts
  const foundationalCount = 1;
  const challengeCount = challengeEligible ? 1 : 0;
  const availableAfterFoundationAndChallenge = attackRoundCount - foundationalCount - challengeCount;
  const supportCount = Math.floor(availableAfterFoundationAndChallenge * SUPPORT_RATIO);
  const mainCount = attackRoundCount - foundationalCount - supportCount - challengeCount;

  // Safety: negative count should never happen
  if (mainCount < 0 || supportCount < 0) {
    return { valid: false, reason: 'negative_role_count', rolePlan: [], counts: null };
  }

  // Build ordered plan
  const plan = new Array(attackRoundCount).fill(V2_ATTACK_ROUND_ROLES.MAIN);
  plan[0] = V2_ATTACK_ROUND_ROLES.FOUNDATIONAL;

  let challengeIndex = null;
  if (challengeCount > 0) {
    challengeIndex = attackRoundCount - 2;
    plan[challengeIndex] = V2_ATTACK_ROUND_ROLES.CHALLENGE;
  }

  const supportSlots = distributeSupportSlots(attackRoundCount, supportCount, challengeIndex);
  for (const idx of supportSlots) {
    plan[idx] = V2_ATTACK_ROUND_ROLES.SUPPORT;
  }

  return {
    valid: true,
    rolePlan: Object.freeze(plan),
    counts: Object.freeze({
      foundational: foundationalCount,
      support: supportCount,
      main: mainCount,
      challenge: challengeCount,
    }),
    challengeEligible,
    currentStage,
    finalStage,
    challengeIndex,
    supportSlots,
  };
}

/**
 * Role plan validation helper (test/debug için).
 * Sum invariant: foundational + support + main + challenge = attackRoundCount
 */
export function validateRolePlan(rolePlan, attackRoundCount) {
  if (!Array.isArray(rolePlan) || rolePlan.length !== attackRoundCount) {
    return { valid: false, error: 'rolePlan length mismatch' };
  }

  const counts = { foundational: 0, support: 0, main: 0, challenge: 0 };
  let multiRoleCount = 0;
  let unassignedCount = 0;

  for (const role of rolePlan) {
    if (!VALID_ROLES.has(role)) {
      unassignedCount++;
      continue;
    }
    counts[role] = (counts[role] || 0) + 1;
  }

  const sum = counts.foundational + counts.support + counts.main + counts.challenge + unassignedCount;
  if (sum !== attackRoundCount) {
    return { valid: false, error: `sum mismatch: ${sum} != ${attackRoundCount}`, counts, unassignedCount, multiRoleCount };
  }

  if (counts.foundational > 1) {
    return { valid: false, error: 'multiple foundational rounds', counts, unassignedCount, multiRoleCount };
  }

  if (counts.challenge > 1) {
    return { valid: false, error: 'multiple challenge rounds', counts, unassignedCount, multiRoleCount };
  }

  return { valid: true, counts, unassignedCount, multiRoleCount };
}