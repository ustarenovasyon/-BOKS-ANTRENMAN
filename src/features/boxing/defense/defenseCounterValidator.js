/**
 * DEFENSE COUNTER VALIDATOR (pure, deterministic, offline)
 * --------------------------------------------------------------
 * Threat context zorunlu. V1 yalnız SAME_STANCE + straight threat.
 * Unknown rule/threat/stance → fail-closed. Rule mutate edilemez.
 * Attack transition matrix'i bypass etmez; ayrı defense context.
 * --------------------------------------------------------------
 */
import { DEFENSE_COUNTER_RULES } from './defenseCounterRules';
import {
  BOXING_THREAT_TYPES, BOXING_OPPONENT_STANCE_RELATIONS,
} from '@/config/architecture';

const RULE_INDEX = Object.freeze(
  Object.fromEntries(DEFENSE_COUNTER_RULES.map((r) => [`${r.opponentStanceRelation}>${r.incomingThreatType}`, r]))
);

function baseResult(input) {
  return {
    valid: false,
    verdict: null,
    ruleId: null,
    reasons: [],
    warnings: [],
    requirements: [],
    incomingThreatType: input?.incomingThreatType || null,
    defenseMoveId: input?.defenseMoveId || null,
    counterMoveIds: Array.isArray(input?.counterMoveIds) ? input.counterMoveIds.slice() : [],
  };
}

/**
 * input: { opponentStanceRelation, incomingThreatType, defenseMoveId, counterMoveIds, workingRange }
 */
export function validateDefenseCounterRule(input = {}) {
  const result = baseResult(input);

  // Threat context zorunlu (Slip+Counter tek başına yeterli değil).
  if (!input.incomingThreatType) {
    result.verdict = 'not_approved';
    result.reasons.push('defense_context_required');
    return result;
  }

  // Opponent stance relation V1'de yalnız SAME_STANCE.
  if (input.opponentStanceRelation !== BOXING_OPPONENT_STANCE_RELATIONS.SAME_STANCE) {
    result.verdict = 'not_approved';
    result.reasons.push('unsupported_opponent_stance_context');
    return result;
  }

  // Threat type V1'de yalnız iki straight threat.
  if (!Object.values(BOXING_THREAT_TYPES).includes(input.incomingThreatType)) {
    result.verdict = 'not_approved';
    result.reasons.push('unsupported_threat_type');
    return result;
  }

  // Rule lookup (stance + threat). Unknown pair fail-closed.
  const rule = RULE_INDEX[`${input.opponentStanceRelation}>${input.incomingThreatType}`];
  if (!rule) {
    result.verdict = 'not_approved';
    result.reasons.push('pair_not_whitelisted');
    return result;
  }

  result.ruleId = rule.id;
  result.requirements = rule.requirements.slice();

  // Defense move exact match (yanlış slip reddedilir).
  if (input.defenseMoveId !== rule.defenseMoveId) {
    result.verdict = 'not_approved';
    result.reasons.push('defense_move_mismatch');
    return result;
  }

  // Counter moves exact match (sıra dahil).
  const expected = rule.counterMoveIds;
  const given = Array.isArray(input.counterMoveIds) ? input.counterMoveIds : [];
  if (given.length !== expected.length || !given.every((c, i) => c === expected[i])) {
    result.verdict = 'not_approved';
    result.reasons.push('counter_mismatch');
    return result;
  }

  // Range context: whitelist dışı fail-closed.
  if (input.workingRange && !rule.allowedWorkingRanges.includes(input.workingRange)) {
    result.verdict = 'not_approved';
    result.reasons.push('incompatible_range');
    return result;
  }

  result.verdict = 'allowed';
  result.valid = true;
  return result;
}