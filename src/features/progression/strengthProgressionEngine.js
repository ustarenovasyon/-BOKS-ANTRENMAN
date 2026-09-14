/**
 * STRENGTH PROGRESSION ENGINE (PART 13)
 * --------------------------------------------------------------
 * PART 12 eligibleMovementCounts içinde phase advance.
 * Prescription tier envelope (set/rep/hold). Kg YOK.
 * Hard ekstra movement eklemez. Difficulty tier'ı yükseltmez.
 * --------------------------------------------------------------
 */
import { EXPERIENCE_LEVELS } from '@/config/architecture';
import {
  STRENGTH_ADVANCE_STEPS, PRESCRIPTION_TIER_BASE, EXPERIENCE_TIER_OFFSET,
  PRESCRIPTION_TIER_ENVELOPES, RECOVERY_DENSITY_BY_DIFFICULTY, phaseIndexFor,
} from './progressionConstants';

/** Eligible range içinde ilerle; liste dışına çıkma. */
export function advanceWithinEligible(eligibleMovementCounts, basePreferredMovementCount, advanceSteps) {
  if (!Array.isArray(eligibleMovementCounts) || eligibleMovementCounts.length === 0) return 0;
  const sorted = [...eligibleMovementCounts].sort((a, b) => a - b);
  let idx = sorted.indexOf(basePreferredMovementCount);
  if (idx < 0) idx = 0;
  idx = Math.min(idx + Math.max(0, advanceSteps), sorted.length - 1);
  return sorted[idx];
}

/** Tier index 1–4 → key. */
function tierKey(tierNum) {
  return `tier_${tierNum}`;
}

export function buildStrengthProgression(durationMonths, experienceLevel, difficulty, phaseId, sessionBudgetStrength) {
  const idx = phaseIndexFor(durationMonths, phaseId);
  if (idx < 0) return null;
  const eligible = (sessionBudgetStrength && sessionBudgetStrength.eligibleMovementCounts) ? [...sessionBudgetStrength.eligibleMovementCounts] : [];
  const basePreferred = (sessionBudgetStrength && sessionBudgetStrength.preferredMovementCount) ? sessionBudgetStrength.preferredMovementCount : (eligible[0] || 0);
  const advanceSteps = STRENGTH_ADVANCE_STEPS[durationMonths][idx];
  const progressed = advanceWithinEligible(eligible, basePreferred, advanceSteps);

  // Validate progression stays inside PART 12 envelope.
  if (progressed > 0 && eligible.length > 0 && !eligible.includes(progressed)) {
    return { invalid: true, reason: 'PROGRESSION_MOVEMENT_COUNT_OUTSIDE_TIME_ENVELOPE' };
  }

  const tierBase = PRESCRIPTION_TIER_BASE[durationMonths][idx];
  const expOffset = EXPERIENCE_TIER_OFFSET[experienceLevel] || 0;
  const finalTierNum = Math.max(1, Math.min(4, tierBase + expOffset));
  const tierKeyStr = tierKey(finalTierNum);
  const envelope = PRESCRIPTION_TIER_ENVELOPES[tierKeyStr];

  return {
    eligibleMovementCounts: eligible,
    basePreferredMovementCount: basePreferred,
    movementCountAdvanceSteps: advanceSteps,
    progressedPreferredMovementCount: progressed,
    prescriptionTier: tierKeyStr,
    preferredSetCount: envelope.preferredSetCount,
    allowedSetCounts: [...envelope.allowedSetCounts],
    repRange: { ...envelope.repRange },
    holdRangeSeconds: { ...envelope.holdRangeSeconds },
    recoveryDensityClass: RECOVERY_DENSITY_BY_DIFFICULTY[difficulty] || 'balanced_recovery',
  };
}