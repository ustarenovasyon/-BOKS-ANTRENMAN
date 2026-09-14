/**
 * STRENGTH TEMPLATE SELECTOR (PART 15)
 * --------------------------------------------------------------
 * Candidate pool: equipment + PART12 eligible + PART14 balanced cap.
 * Selection: coverage debt (rolling 4) + repeat/row rotation + movement
 * closeness + deterministic tie-break. Template immutable. Yeni template
 * üretmez. Lookahead: greedy with coverage-debt awareness.
 * --------------------------------------------------------------
 */
import { STRENGTH_TEMPLATES, isStrengthTemplateAvailable } from '@/features/strength/templates/strengthTemplates';
import { evaluateStrengthCoverageWindow } from '@/features/weeklyBalance/strengthFeasibilityEngine';
import { ROLLING_STRENGTH_SESSION_WINDOW, STRENGTH_ALTERNATIVE_GROUPS } from '@/config/architecture';
import { MAX_CONSECUTIVE_TEMPLATE_REPEAT } from './programGenerationConstants';
import { pickBest } from './deterministicSelection';

const TEMPLATE_BY_ID = new Map(STRENGTH_TEMPLATES.map((t) => [t.id, t]));

/** Session candidate pool: equipment + eligible envelope + balanced movement cap. */
export function strengthCandidatePool(eligibleMovementCounts, availableEquipment, balancedMovementCap) {
  const eligibleSet = new Set(eligibleMovementCounts || []);
  const cap = balancedMovementCap || 6;
  return STRENGTH_TEMPLATES.filter((t) =>
    isStrengthTemplateAvailable(t, availableEquipment)
    && eligibleSet.has(t.movementCount)
    && t.movementCount <= cap
  );
}

/**
 * Select template for a strength session.
 * previousTemplateIds: önceki strength session template id listesi (en sondan).
 */
export function selectStrengthTemplate({ eligibleMovementCounts, availableEquipment, balancedMovementCap, previousTemplateIds = [], generationSeed, trainingOrdinal }) {
  const pool = strengthCandidatePool(eligibleMovementCounts, availableEquipment, balancedMovementCap);
  if (pool.length === 0) {
    return { valid: false, reason: balancedMovementCap ? 'PROGRAM_NO_TEMPLATE_WITHIN_BALANCED_CAP' : 'PROGRAM_NO_ELIGIBLE_STRENGTH_TEMPLATE' };
  }
  const coverage = evaluateStrengthCoverageWindow(previousTemplateIds.slice(-ROLLING_STRENGTH_SESSION_WINDOW));
  const missingSet = new Set(coverage.missingPatterns);
  const recentTemplates = previousTemplateIds.slice(-MAX_CONSECUTIVE_TEMPLATE_REPEAT);
  const recentRowVariants = lastRowVariantIds(previousTemplateIds, 3);

  const scoreFn = (t) => {
    let score = 0;
    // coverage debt: cover missing patterns → lower score
    const coversMissing = t.movementPatterns.filter((p) => missingSet.has(p)).length;
    score -= coversMissing * 30;
    // movement count closeness to cap
    score += Math.abs((balancedMovementCap || t.movementCount) - t.movementCount) * 2;
    // repeat penalty
    const trailingSame = countTrailingSame(recentTemplates, t.id);
    if (trailingSame >= MAX_CONSECUTIVE_TEMPLATE_REPEAT) score += 500;
    if (trailingSame > 0) score += trailingSame * 20;
    // row variant rotation
    const rowVar = templateRowVariant(t);
    if (rowVar && recentRowVariants.includes(rowVar)) {
      const trailingRow = countTrailingSame(recentRowVariants, rowVar);
      if (trailingRow >= 3) score += 60;
    }
    return score;
  };
  const chosen = pickBest(pool, scoreFn, generationSeed, trainingOrdinal, 'strength');
  return { valid: true, template: chosen, candidateCount: pool.length };
}

function countTrailingSame(arr, id) {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) { if (arr[i] === id) n += 1; else break; }
  return n;
}
function templateRowVariant(template) {
  const t = TEMPLATE_BY_ID.get(template.id) || template;
  // detect row variant via exercises alternativeGroup
  return t.id; // simplified; row rotation handled via template id distinctness
}
function lastRowVariantIds(previousTemplateIds, n) {
  return previousTemplateIds.slice(-n);
}