/**
 * SON ONAYLI 52 BOKS SALDIRI KOMBİNASYONU KÜTÜPHANESİ V1
 * --------------------------------------------------------------
 * Authoritative source-of-truth: moveIds ARRAY'İNİN SIRASIDIR.
 * Sıra değiştirilemez. Slip YOKTUR (PART 9). Defense/counter YOK.
 * Her adjacent pair PART 7 transition matrix'ten geçer (52/52).
 * Orthodox/Southpaw duplicate YOK; Lead/Rear semantic ile tek kayıt.
 * Görsel/timer/cadence/difficulty/kg YOK. Sadece canonical katalog.
 * --------------------------------------------------------------
 */
import { BOXING_MOVES, BOXING_MOVE_IDS } from '../library/boxingMoves';
import { BOXING_TRANSITIONS } from '../transitions/boxingTransitions';
import { BOXING_TRANSITION_VERDICTS } from '../technical/boxingTechnicalConstitution';
import {
  BOXING_COMBINATION_LIBRARY_VERSION, BOXING_COMBINATION_SOURCE_CLASSES,
  BOXING_COMBINATION_CATEGORY,
} from '@/config/architecture';

const I = BOXING_MOVE_IDS;

const MOVE_BY_ID = Object.freeze(Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m])));
const SLIP_IDS = new Set([I.SLIP_LEAD, I.SLIP_REAR]);

/** Yönlü transition pair indeksi (from>to). */
const PAIR_INDEX = Object.freeze(
  Object.fromEntries(BOXING_TRANSITIONS.map((t) => [`${t.fromMoveId}>${t.toMoveId}`, t]))
);

/** Ham 52 tanım (id, moveIds, sortOrder, requiredContext). */
const RAW_COMBINATIONS = [
  // --- 2 hamle (9) ---
  { id: 'BOX_COMBO_02_001', sortOrder: 1, moveIds: [I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_02_002', sortOrder: 2, moveIds: [I.JAB_BODY, I.CROSS] },
  { id: 'BOX_COMBO_02_003', sortOrder: 3, moveIds: [I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_02_004', sortOrder: 4, moveIds: [I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_02_005', sortOrder: 5, moveIds: [I.CROSS, I.LEAD_BODY_HOOK] },
  { id: 'BOX_COMBO_02_006', sortOrder: 6, moveIds: [I.REAR_UPPERCUT, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_02_007', sortOrder: 7, moveIds: [I.LEAD_UPPERCUT, I.REAR_HOOK] },
  { id: 'BOX_COMBO_02_008', sortOrder: 8, moveIds: [I.LEAD_BODY_HOOK, I.REAR_HOOK] },
  { id: 'BOX_COMBO_02_009', sortOrder: 9, moveIds: [I.REAR_BODY_HOOK, I.LEAD_HOOK] },
  // --- 3 hamle (10) ---
  { id: 'BOX_COMBO_03_001', sortOrder: 10, moveIds: [I.JAB, I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_03_002', sortOrder: 11, moveIds: [I.JAB, I.CROSS, I.JAB] },
  { id: 'BOX_COMBO_03_003', sortOrder: 12, moveIds: [I.JAB, I.CROSS_BODY, I.JAB] },
  { id: 'BOX_COMBO_03_004', sortOrder: 13, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_03_005', sortOrder: 14, moveIds: [I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_03_006', sortOrder: 15, moveIds: [I.JAB_BODY, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_03_007', sortOrder: 16, moveIds: [I.JAB, I.CROSS, I.LEAD_BODY_HOOK] },
  { id: 'BOX_COMBO_03_008', sortOrder: 17, moveIds: [I.REAR_UPPERCUT, I.LEAD_HOOK, I.REAR_UPPERCUT] },
  { id: 'BOX_COMBO_03_009', sortOrder: 18, moveIds: [I.LEAD_UPPERCUT, I.REAR_HOOK, I.LEAD_UPPERCUT] },
  { id: 'BOX_COMBO_03_010', sortOrder: 19, moveIds: [I.LEAD_BODY_HOOK, I.REAR_HOOK, I.LEAD_HOOK] },
  // --- 4 hamle (8) ---
  { id: 'BOX_COMBO_04_001', sortOrder: 20, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_04_002', sortOrder: 21, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_04_003', sortOrder: 22, moveIds: [I.JAB, I.CROSS_BODY, I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_04_004', sortOrder: 23, moveIds: [I.JAB_BODY, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_04_005', sortOrder: 24, moveIds: [I.JAB, I.CROSS, I.LEAD_BODY_HOOK, I.REAR_HOOK] },
  { id: 'BOX_COMBO_04_006', sortOrder: 25, moveIds: [I.CROSS, I.LEAD_HOOK, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_04_007', sortOrder: 26, moveIds: [I.REAR_UPPERCUT, I.LEAD_HOOK, I.REAR_UPPERCUT, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_04_008', sortOrder: 27, moveIds: [I.LEAD_UPPERCUT, I.REAR_HOOK, I.LEAD_UPPERCUT, I.REAR_HOOK] },
  // --- 5 hamle (5) ---
  { id: 'BOX_COMBO_05_001', sortOrder: 28, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB] },
  { id: 'BOX_COMBO_05_002', sortOrder: 29, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_05_003', sortOrder: 30, moveIds: [I.JAB_BODY, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB] },
  { id: 'BOX_COMBO_05_004', sortOrder: 31, moveIds: [I.JAB, I.CROSS_BODY, I.JAB, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_05_005', sortOrder: 32, moveIds: [I.JAB, I.CROSS, I.LEAD_BODY_HOOK, I.REAR_HOOK, I.LEAD_HOOK] },
  // --- 6 hamle (6) ---
  { id: 'BOX_COMBO_06_001', sortOrder: 33, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB] },
  { id: 'BOX_COMBO_06_002', sortOrder: 34, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_06_003', sortOrder: 35, moveIds: [I.JAB, I.CROSS_BODY, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_06_004', sortOrder: 36, moveIds: [I.JAB_BODY, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_06_005', sortOrder: 37, moveIds: [I.JAB, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_06_006', sortOrder: 38, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS_BODY, I.JAB, I.CROSS], requiredContext: { workingRange: 'mid', levelChangeSupported: true } },
  // --- 7 hamle (5) ---
  { id: 'BOX_COMBO_07_001', sortOrder: 39, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_07_002', sortOrder: 40, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS_BODY, I.JAB] },
  { id: 'BOX_COMBO_07_003', sortOrder: 41, moveIds: [I.JAB, I.CROSS_BODY, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB] },
  { id: 'BOX_COMBO_07_004', sortOrder: 42, moveIds: [I.JAB_BODY, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB] },
  { id: 'BOX_COMBO_07_005', sortOrder: 43, moveIds: [I.JAB, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.LEAD_HOOK] },
  // --- 8 hamle (4) ---
  { id: 'BOX_COMBO_08_001', sortOrder: 44, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS_BODY, I.JAB] },
  { id: 'BOX_COMBO_08_002', sortOrder: 45, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  { id: 'BOX_COMBO_08_003', sortOrder: 46, moveIds: [I.JAB_BODY, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_08_004', sortOrder: 47, moveIds: [I.JAB, I.CROSS_BODY, I.JAB, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS] },
  // --- 9 hamle (3) ---
  { id: 'BOX_COMBO_09_001', sortOrder: 48, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS_BODY, I.JAB, I.CROSS] },
  { id: 'BOX_COMBO_09_002', sortOrder: 49, moveIds: [I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS_BODY, I.JAB, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_09_003', sortOrder: 50, moveIds: [I.JAB_BODY, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK] },
  // --- 10 hamle (2) ---
  { id: 'BOX_COMBO_10_001', sortOrder: 51, moveIds: [I.JAB, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS_BODY, I.JAB, I.CROSS, I.LEAD_HOOK] },
  { id: 'BOX_COMBO_10_002', sortOrder: 52, moveIds: [I.JAB_BODY, I.CROSS, I.JAB, I.CROSS, I.LEAD_HOOK, I.CROSS, I.JAB, I.CROSS_BODY, I.JAB, I.CROSS] },
];

/** Beklenen 52 canonical combination ID seti. */
export const BOXING_COMBINATION_IDS = Object.freeze(RAW_COMBINATIONS.map((c) => c.id));

/** Adjacent transition allowedRanges'lerinin deterministik intersection'ı. */
function deriveAllowedWorkingRanges(moveIds) {
  let allowed = null;
  for (let i = 0; i < moveIds.length - 1; i++) {
    const t = PAIR_INDEX[`${moveIds[i]}>${moveIds[i + 1]}`];
    if (!t) return [];
    allowed = allowed ? allowed.filter((r) => t.allowedRanges.includes(r)) : t.allowedRanges.slice();
    if (allowed.length === 0) return [];
  }
  return allowed || [];
}

function buildCombination(raw) {
  const moveIds = raw.moveIds;
  return Object.freeze({
    id: raw.id,
    moveIds: Object.freeze(moveIds.slice()),
    moveCount: moveIds.length,
    category: BOXING_COMBINATION_CATEGORY.ATTACK,
    approved: true,
    active: true,
    libraryVersion: BOXING_COMBINATION_LIBRARY_VERSION,
    sourceClass: BOXING_COMBINATION_SOURCE_CLASSES.APP_APPROVED_CORE_V1,
    sortOrder: raw.sortOrder,
    requiredContext: Object.freeze({ ...(raw.requiredContext || {}) }),
    displaySequence: moveIds.map((id) => (MOVE_BY_ID[id] ? MOVE_BY_ID[id].canonicalName : id)).join(' → '),
    allowedWorkingRanges: Object.freeze(deriveAllowedWorkingRanges(moveIds)),
    sequenceKey: moveIds.join('>'),
  });
}

/** Tam 52 yetkili combination (derived alanlarla). */
export const BOXING_COMBINATIONS = Object.freeze(RAW_COMBINATIONS.map(buildCombination));

const EXPECTED_DISTRIBUTION = Object.freeze({ 2: 9, 3: 10, 4: 8, 5: 5, 6: 6, 7: 5, 8: 4, 9: 3, 10: 2 });

/**
 * Authoritative 52 combination setin geçerliliğini seed öncesi doğrular.
 * Validation fail ise yarım library seed ETMEZ.
 */
export function validateCombinationLibrary(combos) {
  if (!Array.isArray(combos) || combos.length !== 52) {
    return { valid: false, error: 'Combination library tam 52 kayıt içermeli.' };
  }
  const ids = new Set();
  const sortOrders = new Set();
  const sequenceKeys = new Set();
  const distribution = {};
  let conditionalCount = 0;

  for (const c of combos) {
    if (!c.id) return { valid: false, error: 'Eksik combination id.' };
    if (ids.has(c.id)) return { valid: false, error: `Tekrarlanan id: ${c.id}` };
    ids.add(c.id);
    if (!Array.isArray(c.moveIds) || c.moveIds.length < 2 || c.moveIds.length > 10) {
      return { valid: false, error: `${c.id}: moveIds 2–10 arası olmalı.` };
    }
    if (c.moveCount !== c.moveIds.length) {
      return { valid: false, error: `${c.id}: moveCount moveIds.length ile eşleşmiyor.` };
    }
    for (const mid of c.moveIds) {
      if (!MOVE_BY_ID[mid]) return { valid: false, error: `${c.id}: bilinmeyen movement id ${mid}.` };
      if (SLIP_IDS.has(mid)) return { valid: false, error: `${c.id}: Slip içemez (${mid}).` };
      if (MOVE_BY_ID[mid].allowedInAttackCombinationLibrary !== true) {
        return { valid: false, error: `${c.id}: attack-eligible olmayan movement ${mid}.` };
      }
    }
    // Adjacent transition coverage (PART 7 whitelist).
    for (let i = 0; i < c.moveIds.length - 1; i++) {
      const pair = PAIR_INDEX[`${c.moveIds[i]}>${c.moveIds[i + 1]}`];
      if (!pair) {
        return { valid: false, error: `${c.id}: whitelist'te olmayan pair ${c.moveIds[i]}>${c.moveIds[i + 1]}.` };
      }
      if (pair.verdict === BOXING_TRANSITION_VERDICTS.CONDITIONAL) {
        conditionalCount += 1;
        if (c.id !== 'BOX_COMBO_06_006') {
          return { valid: false, error: `${c.id}: beklenmeyen conditional pair içeriyor.` };
        }
      }
    }
    if (c.id === 'BOX_COMBO_06_006') {
      if (c.requiredContext?.workingRange !== 'mid' || c.requiredContext?.levelChangeSupported !== true) {
        return { valid: false, error: 'BOX_COMBO_06_006: requiredContext eksik (mid + levelChangeSupported).' };
      }
    } else if (Object.keys(c.requiredContext || {}).length !== 0) {
      return { valid: false, error: `${c.id}: requiredContext boş olmalı.` };
    }
    if (!c.allowedWorkingRanges || c.allowedWorkingRanges.length === 0) {
      return { valid: false, error: `${c.id}: allowedWorkingRanges boş (range intersection).` };
    }
    if (sequenceKeys.has(c.sequenceKey)) {
      return { valid: false, error: `${c.id}: duplicate exact sequence.` };
    }
    sequenceKeys.add(c.sequenceKey);
    if (typeof c.sortOrder !== 'number') return { valid: false, error: `${c.id}: sortOrder sayı değil.` };
    if (sortOrders.has(c.sortOrder)) return { valid: false, error: `${c.id}: tekrarlanan sortOrder.` };
    sortOrders.add(c.sortOrder);
    if (c.approved !== true) return { valid: false, error: `${c.id}: approved true olmalı.` };
    if (c.active !== true) return { valid: false, error: `${c.id}: active true olmalı.` };
    if (c.category !== BOXING_COMBINATION_CATEGORY.ATTACK) return { valid: false, error: `${c.id}: category ATTACK olmalı.` };
    if (c.libraryVersion !== BOXING_COMBINATION_LIBRARY_VERSION) return { valid: false, error: `${c.id}: libraryVersion uyumsuz.` };
    if (c.sourceClass !== BOXING_COMBINATION_SOURCE_CLASSES.APP_APPROVED_CORE_V1) return { valid: false, error: `${c.id}: sourceClass uyumsuz.` };
    distribution[c.moveCount] = (distribution[c.moveCount] || 0) + 1;
  }

  if (conditionalCount !== 1) {
    return { valid: false, error: `Beklenen 1 conditional combination, bulunan ${conditionalCount}.` };
  }
  for (const k of Object.keys(EXPECTED_DISTRIBUTION)) {
    if (distribution[k] !== EXPECTED_DISTRIBUTION[k]) {
      return { valid: false, error: `Dağılım hatası: moveCount ${k} = ${distribution[k]} (beklenen ${EXPECTED_DISTRIBUTION[k]}).` };
    }
  }
  for (const id of BOXING_COMBINATION_IDS) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical combination id: ${id}` };
  }
  return { valid: true };
}