/**
 * V2 DEFENSE CURRICULUM ELIGIBILITY (PART 28)
 * --------------------------------------------------------------
 * V2 defense rule'ların hangi curriculum stage'de gösterilebileceğini
 * PART 21 technique mapping üzerinden derive eder.
 *
 * Defense rule required stage:
 *   max(introducedStage(defenseMove), introducedStage(counterMove), ...)
 *
 * Bu PART'ta:
 *  - Yeni defense tekniği/rule EKLENMEZ
 *  - V1 defense behavior DEĞİŞMEZ
 *  - Generator'a BAĞLANMAZ
 *  - V2 production AKTİF EDİLMEZ
 *
 * Stage 1 → eligible defense = 0
 * Stage 2 → eligible defense = 2 (Catch Lead/Rear — PART 30)
 * Stage 3/4 → eligible defense = 4 (Catch Lead/Rear + Slip Lead/Rear)
 * --------------------------------------------------------------
 */
import { DEFENSE_COUNTER_RULES } from '@/features/boxing/defense/defenseCounterRules';
import { BOXING_V2_SUPPLEMENTAL_DEFENSE_RULES } from '@/features/boxing/curriculum/boxingV2SupplementalDefenseRules';
import { getDefenseRuleRequiredStage } from '@/features/boxing/curriculum/boxingTechniqueCurriculum';
import { GENERATION_POLICY_VERSIONS } from '@/config/architecture';

/**
 * V2 combined defense candidate pool: V1 rules + V2 supplemental rules.
 * V1 selector never uses this — only V2 eligibility/selection path.
 */
const COMBINED_V2_DEFENSE_RULES = Object.freeze([...DEFENSE_COUNTER_RULES, ...BOXING_V2_SUPPLEMENTAL_DEFENSE_RULES]);

/**
 * V2 defense selector supported curriculum stages.
 * Stage 5/6 unsupported until long-duration defense policy is defined.
 */
export const V2_DEFENSE_SELECTOR_SUPPORTED_STAGES = Object.freeze([1, 2, 3, 4]);

/**
 * Defense rule required stage (DERIVED from PART 21 mapping).
 * PART 21 getDefenseRuleRequiredStage tek source-of-truth.
 * Unknown movement → null (fail-safe, asla Stage 1 değil).
 */
export function getDefenseRuleRequiredStageV2(rule) {
  return getDefenseRuleRequiredStage(rule);
}

/**
 * V2 defense eligible rules for a curriculum stage.
 * Rule eligible iff: defenseRuleRequiredStage <= curriculumStage.
 * Unknown movement rules excluded (fail-safe).
 * Invalid stage → empty array.
 */
export function getV2DefenseEligibleRules(curriculumStage) {
  if (!V2_DEFENSE_SELECTOR_SUPPORTED_STAGES.includes(curriculumStage)) return [];
  return COMBINED_V2_DEFENSE_RULES.filter((r) => {
    if (!r.approved || !r.active) return false;
    const reqStage = getDefenseRuleRequiredStage(r);
    if (reqStage === null) return false; // unknown movement → fail-safe
    return reqStage <= curriculumStage;
  });
}

/**
 * V2 policy-aware defense rule selection.
 *
 * V1 path: selectDefenseRule (unchanged, alternates BOX_DEF_001/002)
 * V2 path: curriculum-filtered pool, same alternation among eligible rules
 *
 * Empty eligible pool (Stage 1/2) → fail-safe:
 *   { valid: false, reason: 'PROGRAM_V2_NO_CURRICULUM_ELIGIBLE_DEFENSE_RULE' }
 *
 * Invalid stage → fail-safe.
 * Unknown policy → fail-safe.
 * V1 fallback YOK.
 */
export function selectDefenseRuleV2({ exposureCounter, curriculumStage, generationPolicyVersion }) {
  if (generationPolicyVersion !== GENERATION_POLICY_VERSIONS.V2) {
    return { valid: false, reason: 'PROGRAM_UNKNOWN_GENERATION_POLICY' };
  }
  if (!V2_DEFENSE_SELECTOR_SUPPORTED_STAGES.includes(curriculumStage)) {
    return { valid: false, reason: 'PROGRAM_V2_INVALID_DEFENSE_CURRICULUM_STAGE' };
  }

  const eligible = getV2DefenseEligibleRules(curriculumStage);
  if (eligible.length === 0) {
    return { valid: false, reason: 'PROGRAM_V2_NO_CURRICULUM_ELIGIBLE_DEFENSE_RULE' };
  }

  // Same alternation as V1, but among eligible rules only
  const idx = exposureCounter % eligible.length;
  const rule = eligible[idx];

  return {
    valid: true,
    defenseRuleId: rule.id,
    incomingThreatType: rule.incomingThreatType,
    defenseMoveId: rule.defenseMoveId,
    counterMoveIds: rule.counterMoveIds.slice(),
    opponentStanceRelation: rule.opponentStanceRelation,
    workingRange: 'mid',
  };
}