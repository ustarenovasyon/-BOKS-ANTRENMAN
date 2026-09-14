/**
 * SESSION BUDGET VALIDATOR (PART 12)
 * --------------------------------------------------------------
 * Structured result. Boolean değil. Exact-total, interval ve strength
 * internal budget tutarlılığını denetler. Pure/deterministic.
 * --------------------------------------------------------------
 */
import { SESSION_BUDGET_REASON_CODES } from '@/config/architecture';
import { buildSessionTimeBudget } from './sessionTimeBudgetEngine';

const RC = SESSION_BUDGET_REASON_CODES;

/**
 * Bir budget çıktısını structured doğrular.
 * input: { programMode, sessionDurationMinutes, experienceLevel, difficulty }
 */
export function validateSessionBudget(input = {}) {
  const budget = buildSessionTimeBudget(input);
  const reasons = budget.reasons ? budget.reasons.slice() : [];
  const warnings = budget.warnings ? budget.warnings.slice() : [];

  if (!budget.valid) {
    return { valid: false, reasons, warnings, computedTotalSeconds: null, expectedTotalSeconds: input.sessionDurationMinutes ? input.sessionDurationMinutes * 60 : null };
  }

  const expected = budget.validation.expectedTotalSeconds;
  const computed = budget.validation.computedTotalSeconds;
  if (computed !== expected) reasons.push(RC.SESSION_BUDGET_TOTAL_MISMATCH);

  // Negative block guard
  const b = budget.blocks;
  if (b.warmupSeconds < 0 || b.boxingSeconds < 0 || b.transitionSeconds < 0 || b.strengthSeconds < 0 || b.cooldownSeconds < 0) {
    reasons.push(RC.SESSION_NEGATIVE_BLOCK_DURATION);
  }

  // Boxing interval exact
  if (b.boxingSeconds > 0) {
    const intervalSum = budget.boxingBudget.intervalSegments.reduce((a, s) => a + s.durationSeconds, 0);
    if (intervalSum !== b.boxingSeconds) reasons.push(RC.SESSION_BOXING_INTERVAL_MISMATCH);
  }

  // Strength internal exact
  if (b.strengthSeconds > 0) {
    const sb = budget.strengthBudget;
    if (sb.workBudgetSeconds + sb.recoveryBudgetSeconds + sb.transitionBudgetSeconds !== b.strengthSeconds) {
      reasons.push(RC.SESSION_STRENGTH_BUDGET_MISMATCH);
    }
    if (!sb.eligibleMovementCounts || sb.eligibleMovementCounts.length === 0) {
      reasons.push(RC.SESSION_NO_ELIGIBLE_STRENGTH_TEMPLATE_COUNT);
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
    warnings,
    computedTotalSeconds: computed,
    expectedTotalSeconds: expected,
  };
}