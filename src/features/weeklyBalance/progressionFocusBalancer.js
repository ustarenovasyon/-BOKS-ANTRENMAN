/**
 * PROGRESSION FOCUS BALANCER (PART 14)
 * --------------------------------------------------------------
 * PART 13 result'ı MUTATE ETMEZ. Session-level balanced caps üretir.
 * At most one progression dimension actively pushed to phase target.
 * Diğer dimensionlar conservative cap. PART 13 source değişmez.
 * --------------------------------------------------------------
 */
import { WEEKLY_SESSION_ROLES, WEEKLY_PROGRESSION_FOCUS } from '@/config/architecture';
import { FOCUS_ROTATIONS, INVALID_FOCUS_FOR_ROLE } from './weeklyBalanceConstants';

const BOXING = WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY;
const STRENGTH = WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY;
const COMBINED = WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY;

export function focusRotationFor(sessionRole) {
  return FOCUS_ROTATIONS[sessionRole] || null;
}

export function pickFocus(sessionRole, weekOrdinal, scheduledSlotIndex, defenseEligible) {
  if (defenseEligible) return WEEKLY_PROGRESSION_FOCUS.DEFENSE_INTEGRATION;
  const rot = FOCUS_ROTATIONS[sessionRole];
  if (!rot || rot.length === 0) return WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE;
  const idx = (weekOrdinal + scheduledSlotIndex) % rot.length;
  let focus = rot[idx];
  // role için geçersiz focus varsa balanced'a düş
  const invalid = INVALID_FOCUS_FOR_ROLE[sessionRole] || [];
  if (invalid.includes(focus)) focus = WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE;
  return focus;
}

// ---- conservative caps ----
export function conservativeComboCeiling(target) {
  return target > 2 ? target - 1 : 2;
}
export function conservativeWorkSeconds(baseWork, targetWork) {
  return Math.max(baseWork, targetWork - 15);
}
export function conservativeMovementCount(eligible, progressed) {
  if (!Array.isArray(eligible) || eligible.length === 0) return progressed || 0;
  const lower = eligible.filter((c) => c < progressed);
  if (lower.length > 0) return Math.max(...lower);
  return progressed;
}
export function conservativeTierKey(tierKey) {
  const n = Number(tierKey && tierKey.split('_')[1]);
  if (!Number.isInteger(n)) return tierKey;
  return `tier_${Math.max(1, n - 1)}`;
}

/**
 * Balanced caps. progressionResult: PART 13 buildProgramProgression output.
 * sessionRole: boxing/strength domain varsa ilgili cap'leri üretir.
 */
export function applyProgressionFocusBalance(progressionResult, sessionRole, focus) {
  const res = progressionResult && progressionResult.valid ? progressionResult.result : null;
  if (!res) return null;
  const hasBoxing = sessionRole === BOXING || sessionRole === COMBINED;
  const hasStrength = sessionRole === STRENGTH || sessionRole === COMBINED;
  const bp = hasBoxing ? res.boxingProgression : null;
  const sp = hasStrength ? res.strengthProgression : null;

  const boxingComplexityPush = focus === WEEKLY_PROGRESSION_FOCUS.BOXING_COMPLEXITY;
  const boxingWorkPush = focus === WEEKLY_PROGRESSION_FOCUS.BOXING_WORK_CAPACITY;
  const strengthMovPush = focus === WEEKLY_PROGRESSION_FOCUS.STRENGTH_MOVEMENT_DENSITY;
  const strengthTierPush = focus === WEEKLY_PROGRESSION_FOCUS.STRENGTH_PRESCRIPTION;

  return {
    focus,
    boxingComplexityCap: bp ? (boxingComplexityPush ? bp.effectiveComboCeiling : conservativeComboCeiling(bp.effectiveComboCeiling)) : null,
    boxingWorkCapSeconds: bp ? (boxingWorkPush ? bp.targetWorkSeconds : conservativeWorkSeconds(bp.baseWorkSeconds, bp.targetWorkSeconds)) : null,
    strengthMovementCap: sp ? (strengthMovPush ? sp.progressedPreferredMovementCount : conservativeMovementCount(sp.eligibleMovementCounts, sp.progressedPreferredMovementCount)) : null,
    strengthTierCap: sp ? (strengthTierPush ? sp.prescriptionTier : conservativeTierKey(sp.prescriptionTier)) : null,
  };
}

/** Bir session'da aktif olarak push edilen progression dimension sayısı. */
export function countPushedDimensions(caps) {
  if (!caps) return 0;
  // focus'a göre: target vs conservative farkı varsa push sayılır.
  // Basit V1: focus BALANCED/DEFENSE ise 0, tek focus dimension ise 1.
  if (caps.focus === WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE) return 0;
  if (caps.focus === WEEKLY_PROGRESSION_FOCUS.DEFENSE_INTEGRATION) return 0;
  return 1;
}