/**
 * BOKS HAREKET GEÇİŞ MATRİSİ V1 (Whitelist)
 * --------------------------------------------------------------
 * 12 hareketin 10 saldırı hareketi arasındaki onaylı strike→strike
 * geçişler. Slip bu matriste YOKTUR (PART 9).
 * Yönlüdür; reverse otomatik üretilmez. Unlisted = fail-closed
 * (NOT_APPROVED_FOR_APP_LIBRARY), "fiziksel olarak imkânsız" denmez.
 * Kombinasyon üretmez; yalnız pair whitelist'tir.
 * --------------------------------------------------------------
 */
import { BOXING_MOVES, BOXING_MOVE_IDS } from '../library/boxingMoves';
import { getTechniqueProfile } from '../technical/boxingTechniqueProfiles';
import { BOXING_RANGE_CLASSES } from '@/config/architecture';
import {
  BOXING_TRANSITION_MATRIX_VERSION, BOXING_TRANSITION_SOURCE_CLASSES,
} from '@/config/architecture';
import { BOXING_TRANSITION_VERDICTS } from '../technical/boxingTechnicalConstitution';

const V = BOXING_TRANSITION_VERDICTS;
const SRC = BOXING_TRANSITION_SOURCE_CLASSES;
const R = BOXING_RANGE_CLASSES;
const I = BOXING_MOVE_IDS;

/** Beklenen 17 canonical transition ID seti. */
export const BOXING_TRANSITION_IDS = Object.freeze([
  'BOX_TR_JAB_JAB',
  'BOX_TR_JAB_CROSS',
  'BOX_TR_JAB_BODY_CROSS',
  'BOX_TR_LEAD_HOOK_CROSS',
  'BOX_TR_CROSS_JAB',
  'BOX_TR_JAB_CROSS_BODY',
  'BOX_TR_CROSS_BODY_JAB',
  'BOX_TR_CROSS_LEAD_HOOK',
  'BOX_TR_CROSS_LEAD_BODY_HOOK',
  'BOX_TR_REAR_UPPERCUT_LEAD_HOOK',
  'BOX_TR_LEAD_HOOK_REAR_UPPERCUT',
  'BOX_TR_LEAD_UPPERCUT_REAR_HOOK',
  'BOX_TR_REAR_HOOK_LEAD_UPPERCUT',
  'BOX_TR_LEAD_BODY_HOOK_REAR_HOOK',
  'BOX_TR_REAR_BODY_HOOK_LEAD_HOOK',
  'BOX_TR_REAR_HOOK_LEAD_HOOK',
  'BOX_TR_LEAD_HOOK_CROSS_BODY',
]);

/** Tam 17 yetkili transition tanımı. */
export const BOXING_TRANSITIONS = Object.freeze([
  { id: 'BOX_TR_JAB_JAB', fromMoveId: I.JAB, toMoveId: I.JAB, verdict: V.ALLOWED, allowedRanges: [R.LONG, R.MID], preferredWorkingRange: R.LONG, requirements: [], technicalTags: ['DOUBLE_LEAD_STRAIGHT', 'SAME_SIDE_REPEAT', 'STRAIGHT_CHAIN'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 1 },
  { id: 'BOX_TR_JAB_CROSS', fromMoveId: I.JAB, toMoveId: I.CROSS, verdict: V.ALLOWED, allowedRanges: [R.LONG, R.MID], preferredWorkingRange: R.LONG, requirements: [], technicalTags: ['LEAD_TO_REAR', 'STRAIGHT_CHAIN'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 2 },
  { id: 'BOX_TR_JAB_BODY_CROSS', fromMoveId: I.JAB_BODY, toMoveId: I.CROSS, verdict: V.ALLOWED, allowedRanges: [R.LONG, R.MID], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['BODY_TO_HEAD', 'LEAD_TO_REAR', 'LEVEL_CHANGE'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 3 },
  { id: 'BOX_TR_LEAD_HOOK_CROSS', fromMoveId: I.LEAD_HOOK, toMoveId: I.CROSS, verdict: V.ALLOWED, allowedRanges: [R.MID], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['HOOK_TO_STRAIGHT', 'LEAD_TO_REAR', 'ROTATIONAL_CONTINUITY'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 4 },
  { id: 'BOX_TR_CROSS_JAB', fromMoveId: I.CROSS, toMoveId: I.JAB, verdict: V.ALLOWED, allowedRanges: [R.LONG, R.MID], preferredWorkingRange: R.LONG, requirements: [], technicalTags: ['REAR_TO_LEAD', 'STRAIGHT_CHAIN', 'RECOVERABLE_RETURN'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 5 },
  { id: 'BOX_TR_JAB_CROSS_BODY', fromMoveId: I.JAB, toMoveId: I.CROSS_BODY, verdict: V.ALLOWED, allowedRanges: [R.LONG, R.MID], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['HEAD_TO_BODY', 'LEAD_TO_REAR', 'LEVEL_CHANGE'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 6 },
  { id: 'BOX_TR_CROSS_BODY_JAB', fromMoveId: I.CROSS_BODY, toMoveId: I.JAB, verdict: V.ALLOWED, allowedRanges: [R.LONG, R.MID], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['BODY_TO_HEAD', 'REAR_TO_LEAD', 'LEVEL_CHANGE'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 7 },
  { id: 'BOX_TR_CROSS_LEAD_HOOK', fromMoveId: I.CROSS, toMoveId: I.LEAD_HOOK, verdict: V.ALLOWED, allowedRanges: [R.MID], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['STRAIGHT_TO_HOOK', 'REAR_TO_LEAD', 'ROTATIONAL_CONTINUITY'], sourceClass: SRC.FOUNDATIONAL_MANUAL_EXAMPLE, sourceRef: 'AIBA_COACH_MANUAL_2_5_5', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 8 },
  { id: 'BOX_TR_CROSS_LEAD_BODY_HOOK', fromMoveId: I.CROSS, toMoveId: I.LEAD_BODY_HOOK, verdict: V.ALLOWED, allowedRanges: [R.MID], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['STRAIGHT_TO_BODY_HOOK', 'REAR_TO_LEAD', 'HEAD_TO_BODY', 'ROTATIONAL_CONTINUITY'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 9 },
  { id: 'BOX_TR_REAR_UPPERCUT_LEAD_HOOK', fromMoveId: I.REAR_UPPERCUT, toMoveId: I.LEAD_HOOK, verdict: V.ALLOWED, allowedRanges: [R.CLOSE, R.MID], preferredWorkingRange: R.CLOSE, requirements: [], technicalTags: ['UPPERCUT_TO_HOOK', 'REAR_TO_LEAD', 'CLOSE_RANGE_ALTERNATION'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 10 },
  { id: 'BOX_TR_LEAD_HOOK_REAR_UPPERCUT', fromMoveId: I.LEAD_HOOK, toMoveId: I.REAR_UPPERCUT, verdict: V.ALLOWED, allowedRanges: [R.CLOSE, R.MID], preferredWorkingRange: R.CLOSE, requirements: [], technicalTags: ['HOOK_TO_UPPERCUT', 'LEAD_TO_REAR', 'CLOSE_RANGE_ALTERNATION'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 11 },
  { id: 'BOX_TR_LEAD_UPPERCUT_REAR_HOOK', fromMoveId: I.LEAD_UPPERCUT, toMoveId: I.REAR_HOOK, verdict: V.ALLOWED, allowedRanges: [R.CLOSE, R.MID], preferredWorkingRange: R.CLOSE, requirements: [], technicalTags: ['UPPERCUT_TO_HOOK', 'LEAD_TO_REAR', 'CLOSE_RANGE_ALTERNATION'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 12 },
  { id: 'BOX_TR_REAR_HOOK_LEAD_UPPERCUT', fromMoveId: I.REAR_HOOK, toMoveId: I.LEAD_UPPERCUT, verdict: V.ALLOWED, allowedRanges: [R.CLOSE, R.MID], preferredWorkingRange: R.CLOSE, requirements: [], technicalTags: ['HOOK_TO_UPPERCUT', 'REAR_TO_LEAD', 'CLOSE_RANGE_ALTERNATION'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 13 },
  { id: 'BOX_TR_LEAD_BODY_HOOK_REAR_HOOK', fromMoveId: I.LEAD_BODY_HOOK, toMoveId: I.REAR_HOOK, verdict: V.ALLOWED, allowedRanges: [R.MID, R.CLOSE], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['BODY_TO_HEAD', 'LEAD_TO_REAR', 'HOOK_CHAIN', 'LEVEL_CHANGE'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 14 },
  { id: 'BOX_TR_REAR_BODY_HOOK_LEAD_HOOK', fromMoveId: I.REAR_BODY_HOOK, toMoveId: I.LEAD_HOOK, verdict: V.ALLOWED, allowedRanges: [R.MID, R.CLOSE], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['BODY_TO_HEAD', 'REAR_TO_LEAD', 'HOOK_CHAIN', 'LEVEL_CHANGE'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 15 },
  { id: 'BOX_TR_REAR_HOOK_LEAD_HOOK', fromMoveId: I.REAR_HOOK, toMoveId: I.LEAD_HOOK, verdict: V.ALLOWED, allowedRanges: [R.MID, R.CLOSE], preferredWorkingRange: R.MID, requirements: [], technicalTags: ['HOOK_CHAIN', 'REAR_TO_LEAD', 'ROTATIONAL_CONTINUITY'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 16 },
  { id: 'BOX_TR_LEAD_HOOK_CROSS_BODY', fromMoveId: I.LEAD_HOOK, toMoveId: I.CROSS_BODY, verdict: V.CONDITIONAL, allowedRanges: [R.MID], preferredWorkingRange: R.MID, requirements: ['working_range_mid_required', 'level_change_required'], technicalTags: ['HOOK_TO_BODY_STRAIGHT', 'LEAD_TO_REAR', 'HEAD_TO_BODY', 'LEVEL_CHANGE'], sourceClass: SRC.CURATED_TECHNICAL, sourceRef: 'APP_CURATED_TRANSITION_V1', approved: true, active: true, matrixVersion: BOXING_TRANSITION_MATRIX_VERSION, sortOrder: 17 },
]);

const MOVE_BY_ID = Object.freeze(Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m])));
const SLIP_IDS = new Set([I.SLIP_LEAD, I.SLIP_REAR]);
const VALID_RANGE_VALUES = Object.values(BOXING_RANGE_CLASSES);

/** from/to compatible range kesişimi. */
function compatibleIntersection(moveId) {
  const p = getTechniqueProfile(moveId);
  return p?.compatibleRanges ? new Set(p.compatibleRanges) : null;
}

/** Authoritative 17 transition setin geçerliliğini seed öncesi doğrular. */
export function validateTransitionLibrary(transitions) {
  if (!Array.isArray(transitions) || transitions.length !== 17) {
    return { valid: false, error: 'Transition library tam 17 kayıt içermeli.' };
  }
  const ids = new Set();
  const sortOrders = new Set();
  for (const t of transitions) {
    if (!t.id) return { valid: false, error: 'Eksik transition id.' };
    if (ids.has(t.id)) return { valid: false, error: `Tekrarlanan id: ${t.id}` };
    ids.add(t.id);
    if (!MOVE_BY_ID[t.fromMoveId]) return { valid: false, error: `${t.id}: geçersiz fromMoveId.` };
    if (!MOVE_BY_ID[t.toMoveId]) return { valid: false, error: `${t.id}: geçersiz toMoveId.` };
    if (SLIP_IDS.has(t.fromMoveId) || SLIP_IDS.has(t.toMoveId)) {
      return { valid: false, error: `${t.id}: Slip saldırı matrisinde olamaz.` };
    }
    if (MOVE_BY_ID[t.fromMoveId].allowedInAttackCombinationLibrary !== true) {
      return { valid: false, error: `${t.id}: fromMove attack-eligible değil.` };
    }
    if (MOVE_BY_ID[t.toMoveId].allowedInAttackCombinationLibrary !== true) {
      return { valid: false, error: `${t.id}: toMove attack-eligible değil.` };
    }
    if (t.verdict !== V.ALLOWED && t.verdict !== V.CONDITIONAL) {
      return { valid: false, error: `${t.id}: geçersiz verdict.` };
    }
    if (t.sourceClass !== SRC.FOUNDATIONAL_MANUAL_EXAMPLE && t.sourceClass !== SRC.CURATED_TECHNICAL) {
      return { valid: false, error: `${t.id}: geçersiz sourceClass.` };
    }
    if (!Array.isArray(t.allowedRanges) || t.allowedRanges.length === 0) {
      return { valid: false, error: `${t.id}: allowedRanges boş.` };
    }
    if (!t.allowedRanges.every((r) => VALID_RANGE_VALUES.includes(r))) {
      return { valid: false, error: `${t.id}: geçersiz range değeri.` };
    }
    // allowedRanges ⊆ intersection(from.compatible, to.compatible)
    const fromC = compatibleIntersection(t.fromMoveId);
    const toC = compatibleIntersection(t.toMoveId);
    if (fromC && toC) {
      for (const r of t.allowedRanges) {
        if (!fromC.has(r) || !toC.has(r)) {
          return { valid: false, error: `${t.id}: allowedRanges compatible intersection dışında (${r}).` };
        }
      }
    }
    if (!t.allowedRanges.includes(t.preferredWorkingRange)) {
      return { valid: false, error: `${t.id}: preferredWorkingRange allowedRanges içinde değil.` };
    }
    if (t.verdict === V.CONDITIONAL && (!Array.isArray(t.requirements) || t.requirements.length === 0)) {
      return { valid: false, error: `${t.id}: CONDITIONAL transition requirements boş olamaz.` };
    }
    if (typeof t.sortOrder !== 'number') return { valid: false, error: `${t.id}: sortOrder sayı değil.` };
    if (sortOrders.has(t.sortOrder)) return { valid: false, error: `${t.id}: tekrarlanan sortOrder.` };
    sortOrders.add(t.sortOrder);
    if (t.approved !== true) return { valid: false, error: `${t.id}: approved true olmalı.` };
    if (t.active !== true) return { valid: false, error: `${t.id}: active true olmalı.` };
    if (t.matrixVersion !== BOXING_TRANSITION_MATRIX_VERSION) {
      return { valid: false, error: `${t.id}: matrixVersion uyumsuz.` };
    }
  }
  for (const id of BOXING_TRANSITION_IDS) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical transition id: ${id}` };
  }
  return { valid: true };
}