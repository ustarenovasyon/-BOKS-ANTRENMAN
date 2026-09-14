/**
 * BOKS SAVUNMA / KONTRA SİSTEMİ V1
 * --------------------------------------------------------------
 * Slip Lead / Slip Rear KULLANICININ kendi Lead/Rear tarafına slip.
 * Threat (rakip saldırısı) user move DEĞİLDİR; boxing_moves'a eklenmez.
 * Threat, defenseMove, counterMove ayrı field'lardır.
 * Attack transition/combination matrix'ine KARIŞMAZ.
 * V1 yalnız SAME_STANCE + straight threat. 2 rule.
 * --------------------------------------------------------------
 */
import { BOXING_MOVES, BOXING_MOVE_IDS } from '../library/boxingMoves';
import { BOXING_MOVEMENT_TYPES } from '@/config/architecture';
import {
  BOXING_DEFENSE_COUNTER_LIBRARY_VERSION, BOXING_DEFENSE_SOURCE_CLASSES,
  BOXING_THREAT_TYPES, BOXING_OPPONENT_STANCE_RELATIONS, BOXING_DEFENSE_REQUIREMENTS,
} from '@/config/architecture';

const I = BOXING_MOVE_IDS;
const MOVE_BY_ID = Object.freeze(Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m])));
const SLIP_IDS = new Set([I.SLIP_LEAD, I.SLIP_REAR]);

const REQ = BOXING_DEFENSE_REQUIREMENTS;
const TAG = (extra) => Object.freeze(['SAME_STANCE', 'STRAIGHT_THREAT', 'OUTSIDE_LINE_DRILL', 'SLIP_TO_COUNTER', ...extra]);

/** Tam 2 yetkili defense/counter rule. */
export const DEFENSE_COUNTER_RULES = Object.freeze([
  {
    id: 'BOX_DEF_001',
    opponentStanceRelation: BOXING_OPPONENT_STANCE_RELATIONS.SAME_STANCE,
    incomingThreatType: BOXING_THREAT_TYPES.OPPONENT_LEAD_STRAIGHT,
    defenseMoveId: I.SLIP_REAR,
    counterMoveIds: Object.freeze([I.CROSS]),
    allowedWorkingRanges: Object.freeze(['long', 'mid']),
    preferredWorkingRange: 'mid',
    requirements: Object.freeze([REQ.OPPONENT_STANCE_SAME_REQUIRED, REQ.GUARD_RECOVERY_REQUIRED, REQ.BALANCE_RECOVERY_REQUIRED]),
    technicalTags: TAG(['LEAD_THREAT_CONTEXT']),
    sourceClass: BOXING_DEFENSE_SOURCE_CLASSES.APP_CURATED_DEFENSE_V1,
    approved: true,
    active: true,
    libraryVersion: BOXING_DEFENSE_COUNTER_LIBRARY_VERSION,
    sortOrder: 1,
    userActionCount: 2,
  },
  {
    id: 'BOX_DEF_002',
    opponentStanceRelation: BOXING_OPPONENT_STANCE_RELATIONS.SAME_STANCE,
    incomingThreatType: BOXING_THREAT_TYPES.OPPONENT_REAR_STRAIGHT,
    defenseMoveId: I.SLIP_LEAD,
    counterMoveIds: Object.freeze([I.LEAD_HOOK]),
    allowedWorkingRanges: Object.freeze(['mid']),
    preferredWorkingRange: 'mid',
    requirements: Object.freeze([REQ.OPPONENT_STANCE_SAME_REQUIRED, REQ.GUARD_RECOVERY_REQUIRED, REQ.BALANCE_RECOVERY_REQUIRED]),
    technicalTags: TAG(['REAR_THREAT_CONTEXT']),
    sourceClass: BOXING_DEFENSE_SOURCE_CLASSES.APP_CURATED_DEFENSE_V1,
    approved: true,
    active: true,
    libraryVersion: BOXING_DEFENSE_COUNTER_LIBRARY_VERSION,
    sortOrder: 2,
    userActionCount: 2,
  },
]);

export const DEFENSE_COUNTER_RULE_IDS = Object.freeze(DEFENSE_COUNTER_RULES.map((r) => r.id));

const VALID_THREATS = Object.values(BOXING_THREAT_TYPES);
const VALID_STANCE_RELATIONS = Object.values(BOXING_OPPONENT_STANCE_RELATIONS);
const VALID_REQUIREMENTS = Object.values(BOXING_DEFENSE_REQUIREMENTS);

/** Authoritative 2 rule setin geçerliliğini seed öncesi doğrular. */
export function validateDefenseCounterLibrary(rules) {
  if (!Array.isArray(rules) || rules.length !== 2) {
    return { valid: false, error: 'Defense library tam 2 rule içermeli.' };
  }
  const ids = new Set();
  const sortOrders = new Set();
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
    if (!SLIP_IDS.has(r.defenseMoveId)) {
      return { valid: false, error: `${r.id}: defenseMove Slip olmalı.` };
    }
    const defMove = MOVE_BY_ID[r.defenseMoveId];
    if (!defMove || defMove.movementType !== BOXING_MOVEMENT_TYPES.DEFENSE) {
      return { valid: false, error: `${r.id}: defenseMove DEFENSE değil.` };
    }
    if (!Array.isArray(r.counterMoveIds) || r.counterMoveIds.length === 0) {
      return { valid: false, error: `${r.id}: counterMoveIds boş.` };
    }
    for (const c of r.counterMoveIds) {
      const cm = MOVE_BY_ID[c];
      if (!cm) return { valid: false, error: `${r.id}: bilinmeyen counter ${c}.` };
      if (cm.movementType !== BOXING_MOVEMENT_TYPES.STRIKE) return { valid: false, error: `${r.id}: counter STRIKE değil (${c}).` };
      if (cm.allowedInAttackCombinationLibrary !== true) return { valid: false, error: `${r.id}: counter attack-eligible değil (${c}).` };
      if (cm.approved !== true || cm.active !== true) return { valid: false, error: `${r.id}: counter approved/active değil (${c}).` };
    }
    if (r.userActionCount !== r.counterMoveIds.length + 1) {
      return { valid: false, error: `${r.id}: userActionCount hatalı.` };
    }
    if (!Array.isArray(r.allowedWorkingRanges) || r.allowedWorkingRanges.length === 0) {
      return { valid: false, error: `${r.id}: allowedWorkingRanges boş.` };
    }
    if (!r.allowedWorkingRanges.includes(r.preferredWorkingRange)) {
      return { valid: false, error: `${r.id}: preferredWorkingRange allowedWorkingRanges içinde değil.` };
    }
    if (!Array.isArray(r.requirements) || r.requirements.length === 0) {
      return { valid: false, error: `${r.id}: requirements boş.` };
    }
    if (!r.requirements.every((x) => VALID_REQUIREMENTS.includes(x))) {
      return { valid: false, error: `${r.id}: geçersiz requirement.` };
    }
    if (r.sourceClass !== BOXING_DEFENSE_SOURCE_CLASSES.APP_CURATED_DEFENSE_V1) {
      return { valid: false, error: `${r.id}: sourceClass uyumsuz.` };
    }
    if (typeof r.sortOrder !== 'number') return { valid: false, error: `${r.id}: sortOrder sayı değil.` };
    if (sortOrders.has(r.sortOrder)) return { valid: false, error: `${r.id}: tekrarlanan sortOrder.` };
    sortOrders.add(r.sortOrder);
    if (r.approved !== true) return { valid: false, error: `${r.id}: approved true olmalı.` };
    if (r.active !== true) return { valid: false, error: `${r.id}: active true olmalı.` };
    if (r.libraryVersion !== BOXING_DEFENSE_COUNTER_LIBRARY_VERSION) {
      return { valid: false, error: `${r.id}: libraryVersion uyumsuz.` };
    }
  }
  for (const id of DEFENSE_COUNTER_RULE_IDS) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical rule id: ${id}` };
  }
  return { valid: true };
}