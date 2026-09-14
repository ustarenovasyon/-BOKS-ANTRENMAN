/**
 * AUTHORITATIVE 9 KUVVET HAREKETİ KÜTÜPHANESİ
 * --------------------------------------------------------------
 * Sabit, idempotent, görselsiz. Kullanıcının PART 3'te seçtiği
 * STRENGTH_EQUIPMENT enum değerleriyle birebir uyumludur.
 * Bu Partta set/tekrar/kg/template/program ÜRETİLMEZ.
 * Uygulama yük (kg) reçete etmez.
 * --------------------------------------------------------------
 */
import {
  STRENGTH_MOVEMENT_PATTERNS, STRENGTH_BODY_REGIONS, STRENGTH_UPPER_BODY_ROLES,
  STRENGTH_LOWER_BODY_PATTERNS, STRENGTH_LATERALITY, STRENGTH_PRESCRIPTION_TYPES,
  STRENGTH_MOVEMENT_FAMILIES, STRENGTH_ALTERNATIVE_GROUPS, STRENGTH_EQUIPMENT,
  STRENGTH_EXERCISE_LIBRARY_VERSION,
} from '@/config/architecture';

const MP = STRENGTH_MOVEMENT_PATTERNS;
const BR = STRENGTH_BODY_REGIONS;
const UR = STRENGTH_UPPER_BODY_ROLES;
const LP = STRENGTH_LOWER_BODY_PATTERNS;
const LAT = STRENGTH_LATERALITY;
const PT = STRENGTH_PRESCRIPTION_TYPES;
const MF = STRENGTH_MOVEMENT_FAMILIES;
const AG = STRENGTH_ALTERNATIVE_GROUPS;
const EQ = STRENGTH_EQUIPMENT;

/** Stabil canonical ID'ler. */
export const STRENGTH_EXERCISE_IDS = Object.freeze({
  PUSHUP: 'STR_PUSHUP',
  SQUAT: 'STR_SQUAT',
  REVERSE_LUNGE: 'STR_REVERSE_LUNGE',
  ROMANIAN_DEADLIFT: 'STR_ROMANIAN_DEADLIFT',
  ONE_ARM_DUMBBELL_ROW: 'STR_ONE_ARM_DUMBBELL_ROW',
  BARBELL_BENT_OVER_ROW: 'STR_BARBELL_BENT_OVER_ROW',
  EZ_BAR_BENT_OVER_ROW: 'STR_EZ_BAR_BENT_OVER_ROW',
  PLANK: 'STR_PLANK',
  SIDE_PLANK: 'STR_SIDE_PLANK',
});

const I = STRENGTH_EXERCISE_IDS;

/** Ekipman uyumluluğu kontrolü (program ÜRETMEZ, yalnız eligibility). */
export function isStrengthExerciseAvailable(exercise, availableEquipment) {
  if (!exercise || exercise.requiresExternalEquipment === false) return true;
  const allowed = exercise.allowedEquipment || [];
  const have = Array.isArray(availableEquipment) ? availableEquipment : [];
  return allowed.some((e) => have.includes(e));
}

/** Tam 9 yetkili hareket tanımı. */
export const STRENGTH_EXERCISES = Object.freeze([
  { id: I.PUSHUP, canonicalName: 'Şınav', displayName: 'Şınav', movementPattern: MP.PUSH, movementFamily: MF.PUSHUP, bodyRegion: BR.UPPER, upperBodyRole: UR.PUSH, lowerBodyPattern: LP.NONE, laterality: LAT.BILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: false, allowedEquipment: [], alternativeGroup: null, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 1, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.SQUAT, canonicalName: 'Squat', displayName: 'Squat', movementPattern: MP.SQUAT, movementFamily: MF.SQUAT, bodyRegion: BR.LOWER, upperBodyRole: UR.NONE, lowerBodyPattern: LP.SQUAT, laterality: LAT.BILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: false, allowedEquipment: [], alternativeGroup: null, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 2, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.REVERSE_LUNGE, canonicalName: 'Reverse Lunge', displayName: 'Reverse Lunge', movementPattern: MP.LUNGE, movementFamily: MF.LUNGE, bodyRegion: BR.LOWER, upperBodyRole: UR.NONE, lowerBodyPattern: LP.LUNGE, laterality: LAT.UNILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: false, allowedEquipment: [], alternativeGroup: null, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 3, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.ROMANIAN_DEADLIFT, canonicalName: 'Romanian Deadlift', displayName: 'Romanian Deadlift', movementPattern: MP.HINGE, movementFamily: MF.HIP_HINGE, bodyRegion: BR.LOWER, upperBodyRole: UR.NONE, lowerBodyPattern: LP.HINGE, laterality: LAT.BILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: true, allowedEquipment: [EQ.DUMBBELL, EQ.BARBELL, EQ.EZ_BAR], alternativeGroup: null, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 4, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.ONE_ARM_DUMBBELL_ROW, canonicalName: 'One-Arm Dumbbell Row', displayName: 'One-Arm Dumbbell Row', movementPattern: MP.ROW, movementFamily: MF.ROW, bodyRegion: BR.UPPER, upperBodyRole: UR.PULL, lowerBodyPattern: LP.NONE, laterality: LAT.UNILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: true, allowedEquipment: [EQ.DUMBBELL], alternativeGroup: AG.ROW_VARIANTS, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 5, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.BARBELL_BENT_OVER_ROW, canonicalName: 'Barbell Bent-Over Row', displayName: 'Barbell Bent-Over Row', movementPattern: MP.ROW, movementFamily: MF.ROW, bodyRegion: BR.UPPER, upperBodyRole: UR.PULL, lowerBodyPattern: LP.NONE, laterality: LAT.BILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: true, allowedEquipment: [EQ.BARBELL], alternativeGroup: AG.ROW_VARIANTS, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 6, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.EZ_BAR_BENT_OVER_ROW, canonicalName: 'Z Bar Bent-Over Row', displayName: 'Z Bar Bent-Over Row', movementPattern: MP.ROW, movementFamily: MF.ROW, bodyRegion: BR.UPPER, upperBodyRole: UR.PULL, lowerBodyPattern: LP.NONE, laterality: LAT.BILATERAL, prescriptionType: PT.REPS, requiresExternalEquipment: true, allowedEquipment: [EQ.EZ_BAR], alternativeGroup: AG.ROW_VARIANTS, isCoreExercise: false, isIsometric: false, isCompound: true, appPrescribesExternalLoad: false, sortOrder: 7, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.PLANK, canonicalName: 'Plank', displayName: 'Plank', movementPattern: MP.CORE_ANTI_EXTENSION, movementFamily: MF.FRONT_CORE_STABILITY, bodyRegion: BR.CORE, upperBodyRole: UR.NONE, lowerBodyPattern: LP.NONE, laterality: LAT.ISOMETRIC_BILATERAL, prescriptionType: PT.TIME, requiresExternalEquipment: false, allowedEquipment: [], alternativeGroup: null, isCoreExercise: true, isIsometric: true, isCompound: false, appPrescribesExternalLoad: false, sortOrder: 8, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
  { id: I.SIDE_PLANK, canonicalName: 'Side Plank', displayName: 'Side Plank', movementPattern: MP.CORE_LATERAL_STABILITY, movementFamily: MF.LATERAL_CORE_STABILITY, bodyRegion: BR.CORE, upperBodyRole: UR.NONE, lowerBodyPattern: LP.NONE, laterality: LAT.ISOMETRIC_UNILATERAL, prescriptionType: PT.TIME, requiresExternalEquipment: false, allowedEquipment: [], alternativeGroup: null, isCoreExercise: true, isIsometric: true, isCompound: false, appPrescribesExternalLoad: false, sortOrder: 9, approved: true, active: true, libraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION },
]);

const FORBIDDEN_LOAD_KEYS = ['recommendedKg', 'defaultKg', 'startingWeight', 'loadKg', 'autoWeight', 'recommendedLoad'];
const VALID_EQUIPMENT = Object.values(STRENGTH_EQUIPMENT);

/** Authoritative setin geçerliliğini seed öncesi doğrular. */
export function validateStrengthExerciseLibrary(moves) {
  if (!Array.isArray(moves) || moves.length !== 9) {
    return { valid: false, error: 'Kütüphane tam 9 kayıt içermeli.' };
  }
  const ids = new Set();
  const sortOrders = new Set();
  const validPatterns = Object.values(MP);
  const validRegions = Object.values(BR);
  const validUpper = Object.values(UR);
  const validLower = Object.values(LP);
  const validLaterality = Object.values(LAT);
  const validPrescription = Object.values(PT);
  const validFamilies = Object.values(MF);

  for (const m of moves) {
    if (!m.id) return { valid: false, error: 'Eksik id.' };
    if (ids.has(m.id)) return { valid: false, error: `Tekrarlanan id: ${m.id}` };
    ids.add(m.id);
    if (!m.canonicalName) return { valid: false, error: `${m.id}: canonicalName eksik.` };
    if (!validPatterns.includes(m.movementPattern)) return { valid: false, error: `${m.id}: geçersiz movementPattern.` };
    if (!validFamilies.includes(m.movementFamily)) return { valid: false, error: `${m.id}: geçersiz movementFamily.` };
    if (!validRegions.includes(m.bodyRegion)) return { valid: false, error: `${m.id}: geçersiz bodyRegion.` };
    if (!validUpper.includes(m.upperBodyRole)) return { valid: false, error: `${m.id}: geçersiz upperBodyRole.` };
    if (!validLower.includes(m.lowerBodyPattern)) return { valid: false, error: `${m.id}: geçersiz lowerBodyPattern.` };
    if (!validLaterality.includes(m.laterality)) return { valid: false, error: `${m.id}: geçersiz laterality.` };
    if (!validPrescription.includes(m.prescriptionType)) return { valid: false, error: `${m.id}: geçersiz prescriptionType.` };
    const eq = m.allowedEquipment || [];
    if (!eq.every((e) => VALID_EQUIPMENT.includes(e))) return { valid: false, error: `${m.id}: geçersiz allowedEquipment.` };
    if (typeof m.sortOrder !== 'number') return { valid: false, error: `${m.id}: sortOrder sayı değil.` };
    if (sortOrders.has(m.sortOrder)) return { valid: false, error: `${m.id}: tekrarlanan sortOrder.` };
    sortOrders.add(m.sortOrder);
    if (m.approved !== true) return { valid: false, error: `${m.id}: approved true olmalı.` };
    if (m.active !== true) return { valid: false, error: `${m.id}: active true olmalı.` };
    if (m.appPrescribesExternalLoad !== false) return { valid: false, error: `${m.id}: appPrescribesExternalLoad false olmalı.` };
    for (const k of FORBIDDEN_LOAD_KEYS) {
      if (k in m) return { valid: false, error: `${m.id}: yasaklı yük alanı ${k}.` };
    }
  }
  for (const id of Object.values(STRENGTH_EXERCISE_IDS)) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical id: ${id}` };
  }
  return { valid: true };
}