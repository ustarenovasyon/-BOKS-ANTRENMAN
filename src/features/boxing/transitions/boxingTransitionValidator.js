/**
 * BOXING TRANSITION VALIDATOR (pure, deterministic, offline)
 * --------------------------------------------------------------
 * Pair lookup authoritative V1 whitelist (kod-level) üzerinden yapılır.
 * Yönlüdür; reverse otomatik üretilmez. Unlisted = fail-closed
 * (NOT_APPROVED_FOR_APP_LIBRARY). AI/random yok.
 * PART 6 teknik anayasasını bypass etmez.
 * Sırayı değiştiremez; yalnız değerlendirme yapar.
 * --------------------------------------------------------------
 */
import { BOXING_MOVES } from '../library/boxingMoves';
import { evaluateTechnicalRelationship } from '../technical/boxingTechnicalValidator';
import {
  BOXING_TRANSITION_VERDICTS, BOXING_REJECTION_REASONS, BOXING_CONDITION_CODES,
} from '../technical/boxingTechnicalConstitution';
import { BOXING_TRANSITIONS } from './boxingTransitions';

const MOVE_BY_ID = Object.freeze(Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m])));

/** Yönlü pair indeksi (from>to). */
const PAIR_INDEX = Object.freeze(
  Object.fromEntries(BOXING_TRANSITIONS.map((t) => [`${t.fromMoveId}>${t.toMoveId}`, t]))
);

function baseResult() {
  return { valid: false, verdict: null, transitionId: null, reasons: [], warnings: [], requirements: [], sourceClass: null };
}

function isAttackEligible(id) {
  const m = MOVE_BY_ID[id];
  return !!m && m.allowedInAttackCombinationLibrary === true;
}

/**
 * Tek pair saldırı geçişini değerlendirir.
 * context: { workingRange, levelChangeSupported, attackCombination }
 */
export function validateAttackTransition(fromMoveId, toMoveId, context = {}) {
  const result = baseResult();
  const from = MOVE_BY_ID[fromMoveId];
  const to = MOVE_BY_ID[toMoveId];

  if (!from || !to) {
    result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
    result.reasons.push(BOXING_REJECTION_REASONS.INVALID_MOVEMENT_ID);
    return result;
  }

  if (!isAttackEligible(fromMoveId) || !isAttackEligible(toMoveId)) {
    result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
    result.reasons.push(BOXING_REJECTION_REASONS.ATTACK_LIBRARY_INELIGIBLE);
    return result;
  }

  // PART 6 anayasal kontrol (bypass etmez).
  const tech = evaluateTechnicalRelationship(from, to, { attackCombination: true });
  if (tech.verdict === BOXING_TRANSITION_VERDICTS.FORBIDDEN) {
    result.verdict = tech.verdict;
    result.reasons.push(...tech.reasons);
    return result;
  }

  const transition = PAIR_INDEX[`${fromMoveId}>${toMoveId}`];
  if (!transition) {
    // Unlisted: fail-closed. "Fiziksel olarak imkânsız" denmez.
    result.verdict = 'not_approved';
    result.reasons.push(BOXING_REJECTION_REASONS.PAIR_NOT_WHITELISTED);
    return result;
  }

  result.transitionId = transition.id;
  result.sourceClass = transition.sourceClass;
  result.requirements = transition.requirements.slice();

  // Range context: allowedRanges dışında çalışma mesafesi fail-closed.
  if (context.workingRange && !transition.allowedRanges.includes(context.workingRange)) {
    result.verdict = 'not_approved';
    result.reasons.push(BOXING_REJECTION_REASONS.INCOMPATIBLE_RANGE);
    return result;
  }

  if (transition.verdict === BOXING_TRANSITION_VERDICTS.CONDITIONAL) {
    const unmet = [];
    for (const req of transition.requirements) {
      if (req === BOXING_CONDITION_CODES.WORKING_RANGE_MID_REQUIRED && context.workingRange !== 'mid') {
        unmet.push(req);
      }
      if (req === BOXING_CONDITION_CODES.LEVEL_CHANGE_REQUIRED && !context.levelChangeSupported) {
        unmet.push(req);
      }
    }
    if (unmet.length > 0) {
      result.verdict = BOXING_TRANSITION_VERDICTS.CONDITIONAL;
      result.reasons.push(...unmet);
      return result;
    }
    result.verdict = BOXING_TRANSITION_VERDICTS.CONDITIONAL;
    result.valid = true;
    return result;
  }

  result.verdict = BOXING_TRANSITION_VERDICTS.ALLOWED;
  result.valid = true;
  return result;
}

/**
 * Adjacent pair dizisini değerlendirir. Sırayı DEĞİŞTIREMEZ.
 * Her pair PART 7 whitelist'inden geçmelidir.
 */
export function validateTransitionSequence(moveIds, context = {}) {
  if (!Array.isArray(moveIds) || moveIds.length < 2) {
    return { valid: false, verdict: BOXING_TRANSITION_VERDICTS.FORBIDDEN, reasons: [BOXING_REJECTION_REASONS.INVALID_MOVEMENT_ID], steps: [] };
  }
  const steps = [];
  let allValid = true;
  for (let i = 0; i < moveIds.length - 1; i++) {
    const r = validateAttackTransition(moveIds[i], moveIds[i + 1], context);
    steps.push({ index: i, from: moveIds[i], to: moveIds[i + 1], ...r });
    if (!r.valid) allValid = false;
  }
  return { valid: allValid, verdict: allValid ? 'sequence_ok' : 'not_approved', reasons: [], steps };
}