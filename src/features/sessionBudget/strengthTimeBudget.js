/**
 * STRENGTH TIME BUDGET (PART 12)
 * --------------------------------------------------------------
 * strengthSeconds → work/recovery/transition budget (exact).
 * Movement-count eligibility (mode-aware) + preferred count.
 * Set/rep/rest prescription ÜRETMEZ. Kg yok.
 * --------------------------------------------------------------
 */
import { PROGRAM_MODES, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS } from '@/config/architecture';
import { STRENGTH_RATIOS, allocateRatiosExact, MODE_COMBINED } from './sessionBudgetConstants';

/**
 * Mode-aware movement-count envelope (süre açısından eligible).
 * 3/4/5/6 dışında count üretmez.
 */
export function getStrengthEligibleMovementCounts(strengthSeconds, programMode) {
  if (programMode === MODE_COMBINED) {
    if (strengthSeconds < 900) return [3];
    if (strengthSeconds < 1200) return [3, 4];
    if (strengthSeconds < 1800) return [3, 4, 5];
    return [4, 5, 6];
  }
  // strength-only
  if (strengthSeconds < 1200) return [3];
  if (strengthSeconds < 1800) return [3, 4];
  if (strengthSeconds < 2700) return [4, 5];
  return [4, 5, 6];
}

/** Strength internal budget (work/recovery/transition) — exact strengthSeconds. */
export function buildStrengthTimeBudget(strengthSeconds, difficulty) {
  const ratios = STRENGTH_RATIOS[difficulty];
  return allocateRatiosExact(strengthSeconds, ratios, 15);
}

/**
 * Preferred movement count: experience baseline + easy bias.
 * Hard sırf zor diye artırmaz. Beginner permanent min'e kilitlenmez.
 */
export function computePreferredMovementCount(eligible, experienceLevel, difficulty) {
  if (!eligible || eligible.length === 0) return 0;
  const sorted = [...eligible].sort((a, b) => a - b);
  let idx;
  if (experienceLevel === EXPERIENCE_LEVELS.BEGINNER) idx = 0;
  else if (experienceLevel === EXPERIENCE_LEVELS.EXPERIENCED) idx = sorted.length - 1;
  else idx = Math.floor((sorted.length - 1) / 2); // intermediate
  let preferred = sorted[idx];
  if (difficulty === DIFFICULTY_LEVELS.EASY && idx > 0 && preferred > 3) {
    preferred = sorted[idx - 1];
  }
  return preferred;
}