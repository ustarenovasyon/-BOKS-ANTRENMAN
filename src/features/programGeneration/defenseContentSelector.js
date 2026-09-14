/**
 * DEFENSE CONTENT SELECTOR (PART 15)
 * --------------------------------------------------------------
 * Yalnız BOX_DEF_001 / BOX_DEF_002. SAME_STANCE. workingRange=MID.
 * Alternation: 1st exposure → 001, 2nd → 002. Actual rule seçer.
 * Threat/defenseMove/counterMove ayrı field'lar (user moveIds'a karışmaz).
 * --------------------------------------------------------------
 */
import { DEFENSE_COUNTER_RULES } from '@/features/boxing/defense/defenseCounterRules';
import { GENERATION_POLICY_VERSIONS } from '@/config/architecture';
import { selectDefenseRuleV2 } from '@/features/boxing/curriculum/boxingV2DefenseCurriculumEligibility';

const RULE_BY_ID = new Map(DEFENSE_COUNTER_RULES.map((r) => [r.id, r]));

/**
 * Policy-aware defense rule selection (PART 28 PATCH).
 *
 * V1 (default): existing deterministic alternation BOX_DEF_001/002 — unchanged.
 * V2: curriculum-filtered pool via PART 28 eligibility helper.
 *
 * Backwards-compatible: selectDefenseRule(exposureCounter) → V1 behavior unchanged.
 * V1 accidental curriculumStage context silently ignored.
 *
 * @param {number} exposureCounter
 * @param {object} [options]
 * @param {number} [options.generationPolicyVersion=V1]
 * @param {number} [options.curriculumStage=null] — required for V2
 */
export function selectDefenseRule(exposureCounter, options = {}) {
  const { generationPolicyVersion = GENERATION_POLICY_VERSIONS.V1, curriculumStage = null } = options;

  // Unknown policy → fail-safe (PART 20 security principle at selector level).
  if (generationPolicyVersion !== GENERATION_POLICY_VERSIONS.V1 && generationPolicyVersion !== GENERATION_POLICY_VERSIONS.V2) {
    return { valid: false, reason: 'PROGRAM_UNKNOWN_GENERATION_POLICY' };
  }

  // V2 path: curriculum-filtered selection via PART 28 eligibility helper.
  if (generationPolicyVersion === GENERATION_POLICY_VERSIONS.V2) {
    return selectDefenseRuleV2({ exposureCounter, curriculumStage, generationPolicyVersion });
  }

  // V1 path: existing deterministic alternation (unchanged).
  const rule = exposureCounter % 2 === 0 ? RULE_BY_ID.get('BOX_DEF_001') : RULE_BY_ID.get('BOX_DEF_002');
  return {
    defenseRuleId: rule.id,
    incomingThreatType: rule.incomingThreatType,
    defenseMoveId: rule.defenseMoveId,
    counterMoveIds: rule.counterMoveIds.slice(),
    opponentStanceRelation: rule.opponentStanceRelation,
    workingRange: 'mid',
  };
}

/**
 * Mixed-week defense slot planner (PART 15.33).
 * perDayLevels: [{weekdayIndex, role, level}] boxing-capable günler için.
 * weekOrdinal: program hafta indexi.
 * Returns defenseEligible weekdayIndex set.
 */
export function planMixedDefenseSlots(perDayLevels, weekOrdinal) {
  const boxing = perDayLevels.filter((s) => s.level !== undefined);
  if (boxing.length === 0) return new Set();
  const levels = boxing.map((s) => s.level);
  const allNone = levels.every((l) => l === 'none');
  if (allNone) return new Set();
  const hasRegular = levels.some((l) => l === 'regular');
  const hasIntro = levels.some((l) => l === 'intro');

  let targetCount = 0;
  let eligibleSlots = [];
  if (hasRegular) {
    targetCount = boxing.length >= 4 ? 2 : 1;
    const regularBoxingOnly = boxing.filter((s) => s.level === 'regular' && s.role === 'boxing_only_day').map((s) => s.weekdayIndex);
    const regularCombined = boxing.filter((s) => s.level === 'regular' && s.role === 'combined_boxing_strength_day').map((s) => s.weekdayIndex);
    eligibleSlots = [...regularBoxingOnly, ...regularCombined];
    if (eligibleSlots.length < targetCount && hasIntro && weekOrdinal % 2 === 1) {
      const introBoxingOnly = boxing.filter((s) => s.level === 'intro' && s.role === 'boxing_only_day').map((s) => s.weekdayIndex);
      const introCombined = boxing.filter((s) => s.level === 'intro' && s.role === 'combined_boxing_strength_day').map((s) => s.weekdayIndex);
      eligibleSlots = [...eligibleSlots, ...introBoxingOnly, ...introCombined];
    }
  } else if (hasIntro) {
    if (weekOrdinal % 2 === 1) {
      targetCount = 1;
      const introBoxingOnly = boxing.filter((s) => s.level === 'intro' && s.role === 'boxing_only_day').map((s) => s.weekdayIndex);
      const introCombined = boxing.filter((s) => s.level === 'intro' && s.role === 'combined_boxing_strength_day').map((s) => s.weekdayIndex);
      eligibleSlots = [...introBoxingOnly, ...introCombined];
    } else {
      targetCount = 0;
    }
  }
  if (targetCount === 0 || eligibleSlots.length === 0) return new Set();
  // spaced selection
  const chosen = pickSpaced(eligibleSlots, targetCount);
  return new Set(chosen);
}

function pickSpaced(indices, count) {
  if (count >= indices.length) return indices.slice();
  if (count === 1) return [indices[0]];
  // pick max cyclic distance pair
  let best = [indices[0], indices[1]];
  let bestDist = -1;
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      const d = Math.abs(indices[i] - indices[j]);
      const cd = Math.min(d, 7 - d);
      if (cd > bestDist) { bestDist = cd; best = [indices[i], indices[j]]; }
    }
  }
  return best;
}