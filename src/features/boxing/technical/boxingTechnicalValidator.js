/**
 * BOKS TEKNİK VALIDATOR (pure, deterministic, offline)
 * --------------------------------------------------------------
 * PART 6: Yalnız anayasal ihlalleri tespit eder.
 * Spesifik pair kararı (Jab→Cross APPROVED) ÜRETMEZ — bu PART 7'nin yetkisidir.
 * Bilinmeyen/verilmemiş geçiş fail-closed: NOT_APPROVED.
 * AI/kamera/sensör/realtime pose detection YOKTUR.
 * --------------------------------------------------------------
 */
import { BOXING_MOVES, resolvePhysicalSide } from '../library/boxingMoves';
import { BOXING_MOVEMENT_TYPES, BOXING_FAMILIES, BOXING_TARGETS, BOXING_STANCES, BOXING_FOOTWORK_DIRECTIONS } from '@/config/architecture';
import { getTechniqueProfile } from './boxingTechniqueProfiles';
import {
  BOXING_TRANSITION_VERDICTS, BOXING_REJECTION_REASONS, BOXING_CONDITION_CODES,
  BOXING_COMBINATION_LENGTH,
} from './boxingTechnicalConstitution';

export { resolvePhysicalSide };

function isKnownMove(move) {
  return !!move && !!move.id && getTechniqueProfile(move.id) !== null;
}

function emptyResult() {
  return { valid: false, verdict: 'not_approved', reasons: [], warnings: [], requirements: [] };
}

/**
 * İki hareket arasındaki teknik ilişkiyi değerlendirir.
 * Spesifik pair APPROVE etmez; yalnızca anayasal ihlal/koşul tespit eder.
 * Sonuç daima fail-closed: valid=false (onay PART 7'nin yetkisinde).
 */
export function evaluateTechnicalRelationship(moveA, moveB, context = {}) {
  const result = emptyResult();

  if (!moveA || !moveB || !isKnownMove(moveA) || !isKnownMove(moveB)) {
    result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
    result.reasons.push(BOXING_REJECTION_REASONS.INVALID_MOVEMENT_ID);
    return result;
  }

  // Saldırı kombinasyonu bağlamında savunma hareketi (Slip) uygun değildir.
  if (context.attackCombination) {
    const aIneligible = moveA.allowedInAttackCombinationLibrary === false;
    const bIneligible = moveB.allowedInAttackCombinationLibrary === false;
    if (aIneligible || bIneligible) {
      result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
      result.reasons.push(BOXING_REJECTION_REASONS.ATTACK_LIBRARY_INELIGIBLE);
      return result;
    }
  }

  // Savunma hareketi, savunma bağlamı olmadan rastgele dizilemez.
  const aDefense = moveA.movementType === BOXING_MOVEMENT_TYPES.DEFENSE;
  const bDefense = moveB.movementType === BOXING_MOVEMENT_TYPES.DEFENSE;
  if ((aDefense || bDefense) && !context.defenseContext) {
    result.verdict = BOXING_TRANSITION_VERDICTS.CONDITIONAL;
    result.requirements.push(BOXING_CONDITION_CODES.DEFENSE_CONTEXT_REQUIRED);
    return result;
  }

  // Range overlap: ortak compatible range yoksa koşullu (yasak değil).
  const pa = getTechniqueProfile(moveA.id);
  const pb = getTechniqueProfile(moveB.id);
  if (pa.compatibleRanges && pb.compatibleRanges) {
    const overlap = pa.compatibleRanges.some((r) => pb.compatibleRanges.includes(r));
    if (!overlap) {
      result.verdict = BOXING_TRANSITION_VERDICTS.CONDITIONAL;
      result.requirements.push(BOXING_CONDITION_CODES.RANGE_ADJUSTMENT_REQUIRED);
      return result;
    }
  }

  // Same-side tekrar, target değişimi, Lead/Rear alternasyonu burada
  // YASAKLANMAZ — spesifik karar PART 7'ye bırakılır.
  return result;
}

/**
 * Saldırı kombinasyonu dizisini anayasal olarak doğrular.
 * Motor sıralamayı DEĞİŞTIREMEZ; yalnızca değerlendirme yapar.
 */
export function validateAttackCombination(sequence, context = {}) {
  const result = emptyResult();

  if (!Array.isArray(sequence) || sequence.length === 0) {
    result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
    result.reasons.push(BOXING_REJECTION_REASONS.INVALID_MOVEMENT_ID);
    return result;
  }

  for (const move of sequence) {
    if (!isKnownMove(move)) {
      result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
      result.reasons.push(BOXING_REJECTION_REASONS.INVALID_MOVEMENT_ID);
      return result;
    }
  }

  // Attack combination attack-eligible strike ile başlamalı; Slip başlatamaz.
  const first = sequence[0];
  if (first.allowedInAttackCombinationLibrary === false) {
    result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
    result.reasons.push(BOXING_REJECTION_REASONS.ATTACK_LIBRARY_INELIGIBLE);
    return result;
  }
  for (const move of sequence) {
    if (move.allowedInAttackCombinationLibrary === false) {
      result.verdict = BOXING_TRANSITION_VERDICTS.FORBIDDEN;
      result.reasons.push(BOXING_REJECTION_REASONS.ATTACK_LIBRARY_INELIGIBLE);
      return result;
    }
  }

  // Uzunluk: anayasa yeni kısıtlama eklemez; 2–10 dışı yalnızca uyarı.
  if (sequence.length < BOXING_COMBINATION_LENGTH.MIN || sequence.length > BOXING_COMBINATION_LENGTH.MAX) {
    result.warnings.push('combination_length_outside_2_10');
  }

  // Çıkış: dengeli stance'e/guard'a dönülebilirliği anayasa kabul eder;
  // spesifik exit kararı PART 7/audit'e bırakılır.
  // Fail-closed: otomatik APPROVE yok.
  return result;
}

/**
 * Teknik anayasa self-check: çelişkileri otomatik tespit eder.
 */
export function runConstitutionSelfCheck() {
  const errors = [];
  const seen = new Set();

  for (const move of BOXING_MOVES) {
    const profile = getTechniqueProfile(move.id);
    if (!profile) {
      errors.push(`Eksik teknik profil: ${move.id}`);
      continue;
    }
    if (seen.has(move.id)) errors.push(`Tekrarlanan movement id: ${move.id}`);
    seen.add(move.id);

    if (move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE && move.allowedInAttackCombinationLibrary !== false) {
      errors.push(`Savunma hareketi attack-eligible işaretli: ${move.id}`);
    }
    if (move.family && move.family.includes('slip') && move.movementType !== BOXING_MOVEMENT_TYPES.DEFENSE) {
      errors.push(`Slip STRIKE olarak işaretli: ${move.id}`);
    }
    if (move.target === BOXING_TARGETS.BODY && move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE) {
      errors.push(`Savunma hareketine body target yazılmış: ${move.id}`);
    }
    if (move.movementType !== BOXING_MOVEMENT_TYPES.DEFENSE && move.movementType !== BOXING_MOVEMENT_TYPES.FOOTWORK && !profile.compatibleRanges) {
      errors.push(`Range set boş: ${move.id}`);
    }
    // PART 32: Footwork movement invariant checks.
    if (move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK) {
      if (move.family !== BOXING_FAMILIES.FOOTWORK) {
        errors.push(`Footwork movement family !== footwork: ${move.id}`);
      }
      if (move.target !== BOXING_TARGETS.NONE) {
        errors.push(`Footwork movement target !== none: ${move.id}`);
      }
      if (move.isDefensive !== false) {
        errors.push(`Footwork movement isDefensive !== false: ${move.id}`);
      }
      if (move.allowedInAttackCombinationLibrary !== false) {
        errors.push(`Footwork movement attack-eligible: ${move.id}`);
      }
      if (move.allowedInDefenseSystem !== false) {
        errors.push(`Footwork movement defense-system eligible: ${move.id}`);
      }
      const validDirections = Object.values(BOXING_FOOTWORK_DIRECTIONS);
      if (!move.direction || !validDirections.includes(move.direction)) {
        errors.push(`Footwork movement invalid direction: ${move.id}`);
      }
    }
  }

  if (seen.size !== BOXING_MOVES.length) {
    errors.push('Teknik profil coverage tam değil');
  }

  return { ok: errors.length === 0, coverage: seen.size, total: BOXING_MOVES.length, errors };
}