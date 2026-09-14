/**
 * V2 SUPPLEMENTAL DEFENSE RULES — CATCH FAMILY (PART 30)
 * --------------------------------------------------------------
 * Stage-2 fundamental Catch defense rules. Pure Catch semantics:
 * receive/stop incoming straight punch on the glove. No redirect,
 * no parry, no deflect.
 *
 * V1 defense catalog (BOX_DEF_001/002 Slip rules) is UNTOUCHED.
 * V1 validator contract (SLIP_IDS only, exactly 2 rules) is UNTOUCHED.
 * V2 supplemental rules live in this separate catalog with a dedicated
 * validator. V2 selector combines V1 + V2 supplemental candidate pools.
 *
 * Rules:
 *  BOX_V2_DEF_001: Catch Rear + Cross (vs opponent lead straight)
 *  BOX_V2_DEF_002: Catch Lead + Lead Hook (vs opponent rear straight)
 *
 * requiredStage derived via PART 21 getDefenseRuleRequiredStage:
 *  BOX_V2_DEF_001: max(Catch_Rear=2, Cross=1) = 2
 *  BOX_V2_DEF_002: max(Catch_Lead=2, Lead_Hook=2) = 2
 * --------------------------------------------------------------
 */
import { BOXING_MOVES, BOXING_MOVE_IDS } from '@/features/boxing/library/boxingMoves';
import {
  BOXING_MOVEMENT_TYPES, BOXING_FAMILIES, BOXING_THREAT_TYPES,
  BOXING_OPPONENT_STANCE_RELATIONS, BOXING_DEFENSE_REQUIREMENTS,
  BOXING_DEFENSE_SOURCE_CLASSES, BOXING_RANGE_CLASSES,
  BOXING_V2_SUPPLEMENTAL_DEFENSE_LIBRARY_VERSION,
} from '@/config/architecture';

const I = BOXING_MOVE_IDS;
const REQ = BOXING_DEFENSE_REQUIREMENTS;
const TAG = (extra) => Object.freeze(['SAME_STANCE', 'STRAIGHT_THREAT', 'CATCH_TO_COUNTER', ...extra]);

const MOVE_BY_ID = Object.freeze(Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m])));

const VALID_THREATS = Object.values(BOXING_THREAT_TYPES);
const VALID_STANCE_RELATIONS = Object.values(BOXING_OPPONENT_STANCE_RELATIONS);
const VALID_REQUIREMENTS = Object.values(BOXING_DEFENSE_REQUIREMENTS);
const VALID_RANGES = Object.values(BOXING_RANGE_CLASSES);

/** Exactly 2 V2 supplemental Catch defense rules. */
export const BOXING_V2_SUPPLEMENTAL_DEFENSE_RULES = Object.freeze([
  {
    id: 'BOX_V2_DEF_001',
    opponentStanceRelation: BOXING_OPPONENT_STANCE_RELATIONS.SAME_STANCE,
    incomingThreatType: BOXING_THREAT_TYPES.OPPONENT_LEAD_STRAIGHT,
    defenseMoveId: I.CATCH_REAR,
    counterMoveIds: Object.freeze([I.CROSS]),
    allowedWorkingRanges: Object.freeze([BOXING_RANGE_CLASSES.LONG, BOXING_RANGE_CLASSES.MID]),
    preferredWorkingRange: BOXING_RANGE_CLASSES.MID,
    requirements: Object.freeze([REQ.OPPONENT_STANCE_SAME_REQUIRED, REQ.GUARD_RECOVERY_REQUIRED, REQ.BALANCE_RECOVERY_REQUIRED]),
    technicalTags: TAG(['LEAD_THREAT_CONTEXT']),
    sourceClass: BOXING_DEFENSE_SOURCE_CLASSES.APP_CURATED_DEFENSE_V2_SUPPLEMENTAL,
    approved: true,
    active: true,
    libraryVersion: BOXING_V2_SUPPLEMENTAL_DEFENSE_LIBRARY_VERSION,
    sortOrder: 1,
    userActionCount: 2,
  },
  {
    id: 'BOX_V2_DEF_002',
    opponentStanceRelation: BOXING_OPPONENT_STANCE_RELATIONS.SAME_STANCE,
    incomingThreatType: BOXING_THREAT_TYPES.OPPONENT_REAR_STRAIGHT,
    defenseMoveId: I.CATCH_LEAD,
    counterMoveIds: Object.freeze([I.LEAD_HOOK]),
    allowedWorkingRanges: Object.freeze([BOXING_RANGE_CLASSES.MID]),
    preferredWorkingRange: BOXING_RANGE_CLASSES.MID,
    requirements: Object.freeze([REQ.OPPONENT_STANCE_SAME_REQUIRED, REQ.GUARD_RECOVERY_REQUIRED, REQ.BALANCE_RECOVERY_REQUIRED]),
    technicalTags: TAG(['REAR_THREAT_CONTEXT']),
    sourceClass: BOXING_DEFENSE_SOURCE_CLASSES.APP_CURATED_DEFENSE_V2_SUPPLEMENTAL,
    approved: true,
    active: true,
    libraryVersion: BOXING_V2_SUPPLEMENTAL_DEFENSE_LIBRARY_VERSION,
    sortOrder: 2,
    userActionCount: 2,
  },
]);

export const BOXING_V2_SUPPLEMENTAL_DEFENSE_RULE_IDS = Object.freeze(
  BOXING_V2_SUPPLEMENTAL_DEFENSE_RULES.map((r) => r.id)
);

/**
 * Dedicated V2 supplemental defense validator (PART 30).
 * Does NOT weaken V1 validator. Separate contract.
 *
 * Checks: exact 2 rules, unique IDs, approved/active, correct V2 sourceClass,
 * supported library version, defenseMove resolves + movementType=defense +
 * family=catch + defense-system enabled, counter list non-empty + counters
 * resolve + strike + approved/active + attack-library compatible,
 * userActionCount formula, supported threat/stance, working-range validity,
 * no duplicate semantic rule.
 */
export function validateV2SupplementalDefenseLibrary(rules) {
  if (!Array.isArray(rules) || rules.length !== 2) {
    return { valid: false, error: 'V2 supplemental defense library tam 2 rule içermeli.' };
  }
  const ids = new Set();
  const sortOrders = new Set();
  const semanticKeys = new Set();

  for (const r of rules) {
    if (!r.id) return { valid: false, error: 'Eksik rule id.' };
    if (ids.has(r.id)) return { valid: false, error: `Tekrarlanan id: ${r.id}` };
    ids.add(r.id);

    if (!VALID_STANCE_RELATIONS.includes(r.opponentStanceRelation)) {
      return { valid: false, error: `${r.id}: geçersiz opponentStanceRelation.` };
    }
    if (!VALID_THREATS.includes(r.incomingThreatType)) {
      return { valid: false, error: `${r.id}: geçersiz incomingThreatType.` };
    }

    // Defense move checks
    const defMove = MOVE_BY_ID[r.defenseMoveId];
    if (!defMove) return { valid: false, error: `${r.id}: bilinmeyen defenseMove ${r.defenseMoveId}.` };
    if (defMove.movementType !== BOXING_MOVEMENT_TYPES.DEFENSE) {
      return { valid: false, error: `${r.id}: defenseMove DEFENSE değil.` };
    }
    if (defMove.family !== BOXING_FAMILIES.CATCH) {
      return { valid: false, error: `${r.id}: defenseMove family CATCH değil.` };
    }
    if (defMove.allowedInDefenseSystem !== true) {
      return { valid: false, error: `${r.id}: defenseMove defense-system eligible değil.` };
    }

    // Counter checks
    if (!Array.isArray(r.counterMoveIds) || r.counterMoveIds.length === 0) {
      return { valid: false, error: `${r.id}: counterMoveIds boş.` };
    }
    for (const c of r.counterMoveIds) {
      const cm = MOVE_BY_ID[c];
      if (!cm) return { valid: false, error: `${r.id}: bilinmeyen counter ${c}.` };
      if (cm.movementType !== BOXING_MOVEMENT_TYPES.STRIKE) {
        return { valid: false, error: `${r.id}: counter STRIKE değil (${c}).` };
      }
      if (cm.allowedInAttackCombinationLibrary !== true) {
        return { valid: false, error: `${r.id}: counter attack-eligible değil (${c}).` };
      }
      if (cm.approved !== true || cm.active !== true) {
        return { valid: false, error: `${r.id}: counter approved/active değil (${c}).` };
      }
    }

    if (r.userActionCount !== r.counterMoveIds.length + 1) {
      return { valid: false, error: `${r.id}: userActionCount hatalı.` };
    }

    // Working range checks
    if (!Array.isArray(r.allowedWorkingRanges) || r.allowedWorkingRanges.length === 0) {
      return { valid: false, error: `${r.id}: allowedWorkingRanges boş.` };
    }
    if (!r.allowedWorkingRanges.every((w) => VALID_RANGES.includes(w))) {
      return { valid: false, error: `${r.id}: geçersiz workingRange.` };
    }
    if (!r.allowedWorkingRanges.includes(r.preferredWorkingRange)) {
      return { valid: false, error: `${r.id}: preferredWorkingRange allowedWorkingRanges içinde değil.` };
    }

    // Requirements
    if (!Array.isArray(r.requirements) || r.requirements.length === 0) {
      return { valid: false, error: `${r.id}: requirements boş.` };
    }
    if (!r.requirements.every((x) => VALID_REQUIREMENTS.includes(x))) {
      return { valid: false, error: `${r.id}: geçersiz requirement.` };
    }

    // Source class
    if (r.sourceClass !== BOXING_DEFENSE_SOURCE_CLASSES.APP_CURATED_DEFENSE_V2_SUPPLEMENTAL) {
      return { valid: false, error: `${r.id}: sourceClass uyumsuz.` };
    }

    // Library version
    if (r.libraryVersion !== BOXING_V2_SUPPLEMENTAL_DEFENSE_LIBRARY_VERSION) {
      return { valid: false, error: `${r.id}: libraryVersion uyumsuz.` };
    }

    // Sort order
    if (typeof r.sortOrder !== 'number') return { valid: false, error: `${r.id}: sortOrder sayı değil.` };
    if (sortOrders.has(r.sortOrder)) return { valid: false, error: `${r.id}: tekrarlanan sortOrder.` };
    sortOrders.add(r.sortOrder);

    // Approved/active
    if (r.approved !== true) return { valid: false, error: `${r.id}: approved true olmalı.` };
    if (r.active !== true) return { valid: false, error: `${r.id}: active true olmalı.` };

    // No duplicate semantic rule (stance + threat + defenseMove)
    const semanticKey = `${r.opponentStanceRelation}>${r.incomingThreatType}>${r.defenseMoveId}`;
    if (semanticKeys.has(semanticKey)) {
      return { valid: false, error: `${r.id}: yinelenen semantik rule.` };
    }
    semanticKeys.add(semanticKey);
  }

  // Canonical ID coverage
  for (const id of BOXING_V2_SUPPLEMENTAL_DEFENSE_RULE_IDS) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical V2 rule id: ${id}` };
  }

  return { valid: true };
}