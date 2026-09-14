/**
 * BOKS TEKNİK PROFİLLERİ (18 hareket)
 * --------------------------------------------------------------
 * Her hareket için yalnız anayasa düzeyinde eklenen metadata tutulur.
 * family/sideRole/target/movementType hareket kaydından okunur (tek kaynak);
 * burada gereksiz duplicate edilmez.
 * Range preferred/compatible, aile bazlı range modelinden üretilir.
 * Slip için kesin preferredRange verilmez (savunma bağlamına bağlı).
 * --------------------------------------------------------------
 */
import { BOXING_MOVES } from '../library/boxingMoves';
import { BOXING_MOVEMENT_TYPES } from '@/config/architecture';
import { BOXING_FAMILY_RANGE_MODEL, BOXING_TECHNICAL_CONSTITUTION_VERSION } from './boxingTechnicalConstitution';

function buildProfiles() {
  const profiles = {};
  for (const move of BOXING_MOVES) {
    const rangeModel = BOXING_FAMILY_RANGE_MODEL[move.family] || { preferredRange: null, compatibleRanges: null };
    profiles[move.id] = Object.freeze({
      movementId: move.id,
      constitutionVersion: BOXING_TECHNICAL_CONSTITUTION_VERSION,
      preferredRange: rangeModel.preferredRange,
      compatibleRanges: rangeModel.compatibleRanges,
      requiresStableBase: true,
      requiresGuardContinuity: true,
      requiresRecoverableExit: true,
      // Defense hareketi geçerli kullanım için savunma bağlamı gerektirir.
      defenseContextRequired: move.movementType === BOXING_MOVEMENT_TYPES.DEFENSE,
    });
  }
  return Object.freeze(profiles);
}

export const BOXING_TECHNIQUE_PROFILES = buildProfiles();

/** Hareket ID'sine göre teknik profil döner; bilinmeyen ID → null. */
export function getTechniqueProfile(moveId) {
  return BOXING_TECHNIQUE_PROFILES[moveId] || null;
}