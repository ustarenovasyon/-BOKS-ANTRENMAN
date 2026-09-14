/**
 * STRENGTH FEASIBILITY ENGINE (PART 14)
 * --------------------------------------------------------------
 * Candidate template pool (equipment + movement-count envelope aware).
 * Pattern reachability (canonical 7). Coverage window helper.
 * Yeni template/icat etmez; seçim yapmaz.
 * --------------------------------------------------------------
 */
import { STRENGTH_TEMPLATES, isStrengthTemplateAvailable } from '@/features/strength/templates/strengthTemplates';
import { CANONICAL_STRENGTH_PATTERNS } from './weeklyBalanceConstants';
import { ROLLING_STRENGTH_SESSION_WINDOW } from '@/config/architecture';

const TEMPLATE_BY_ID = new Map(STRENGTH_TEMPLATES.map((t) => [t.id, t]));

/**
 * Candidate pool: approved+active (kütüphane zaten öyle), equipment
 * compatible, movementCount PART 12 eligible envelope içinde.
 */
export function buildCandidatePool(eligibleMovementCounts, availableEquipment) {
  const eligibleSet = new Set(eligibleMovementCounts || []);
  return STRENGTH_TEMPLATES.filter((t) => isStrengthTemplateAvailable(t, availableEquipment) && eligibleSet.has(t.movementCount));
}

/** Candidate pool union → reachable movement patterns. */
export function reachableMovementPatterns(candidatePool) {
  const set = new Set();
  for (const t of candidatePool) for (const p of t.movementPatterns) set.add(p);
  return [...set];
}

/** Canonical 7 pattern'den eksik olanlar. */
export function missingMovementPatterns(reachable) {
  const set = new Set(reachable);
  return CANONICAL_STRENGTH_PATTERNS.filter((p) => !set.has(p));
}

/**
 * Rolling strength-session coverage window helper.
 * previousTemplateIds: önceki strength session'ların template id listesi.
 */
export function evaluateStrengthCoverageWindow(previousTemplateIds = []) {
  const counts = {};
  const covered = new Set();
  for (const id of previousTemplateIds) {
    const t = TEMPLATE_BY_ID.get(id);
    if (!t) continue;
    for (const p of t.movementPatterns) {
      covered.add(p);
      counts[p] = (counts[p] || 0) + 1;
    }
  }
  const coveredPatterns = [...covered];
  const missingPatterns = CANONICAL_STRENGTH_PATTERNS.filter((p) => !covered.has(p));
  const vals = Object.values(counts);
  const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const overrepresentedPatterns = Object.entries(counts).filter(([, c]) => c > 1 && c > mean).map(([p]) => p);
  return { coveredPatterns, missingPatterns, overrepresentedPatterns };
}

export function isFullPatternCoverageReachable(candidatePool) {
  const reachable = reachableMovementPatterns(candidatePool);
  return missingMovementPatterns(reachable).length === 0;
}

export { ROLLING_STRENGTH_SESSION_WINDOW };