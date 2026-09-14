/**
 * AUTHORITATIVE 18 BOKS HAREKETİ KÜTÜPHANESİ
 * --------------------------------------------------------------
 * Sabit, idempotent, görselsiz. Canonical isimler İNGİLİCE kalır.
 * ID'ler display name'den üretilmez; stabil domain ID'leridir.
 * Bu katalog sistem tarafından yönetilir; kullanıcı düzenleyemez.
 *
 * Bu Partta kombinasyon / geçiş / savunma+kontra KURULMAZ.
 * --------------------------------------------------------------
 */
import {
  BOXING_MOVEMENT_TYPES, BOXING_FAMILIES, BOXING_SIDE_ROLES,
  BOXING_TARGETS, BOXING_RANGE_CLASSES, BOXING_STANCES,
  BOXING_FOOTWORK_DIRECTIONS, BOXING_MOVE_LIBRARY_VERSION,
} from '@/config/architecture';

const MT = BOXING_MOVEMENT_TYPES;
const F = BOXING_FAMILIES;
const SR = BOXING_SIDE_ROLES;
const T = BOXING_TARGETS;
const R = BOXING_RANGE_CLASSES;
const D = BOXING_FOOTWORK_DIRECTIONS;

/** Stabil canonical ID'ler. */
export const BOXING_MOVE_IDS = Object.freeze({
  JAB: 'BOX_JAB',
  JAB_BODY: 'BOX_JAB_BODY',
  CROSS: 'BOX_CROSS',
  CROSS_BODY: 'BOX_CROSS_BODY',
  LEAD_HOOK: 'BOX_LEAD_HOOK',
  REAR_HOOK: 'BOX_REAR_HOOK',
  LEAD_BODY_HOOK: 'BOX_LEAD_BODY_HOOK',
  REAR_BODY_HOOK: 'BOX_REAR_BODY_HOOK',
  LEAD_UPPERCUT: 'BOX_LEAD_UPPERCUT',
  REAR_UPPERCUT: 'BOX_REAR_UPPERCUT',
  SLIP_LEAD: 'BOX_SLIP_LEAD',
  SLIP_REAR: 'BOX_SLIP_REAR',
  CATCH_LEAD: 'BOX_CATCH_LEAD',
  CATCH_REAR: 'BOX_CATCH_REAR',
  // PART 32: Footwork movements (translation steps, no pivot/angle yet).
  STEP_IN: 'BOX_STEP_IN',
  STEP_OUT: 'BOX_STEP_OUT',
  STEP_LEAD_SIDE: 'BOX_STEP_LEAD_SIDE',
  STEP_REAR_SIDE: 'BOX_STEP_REAR_SIDE',
});

const I = BOXING_MOVE_IDS;

/**
 * Stance'e göre fiziksel taraf çözümler (LEAD/REAR → LEFT/RIGHT).
 * Hareket kaydına fiziksel el SABİT yazılmaz; rol + stance ile çözümlenir.
 */
export function resolvePhysicalSide(stance, sideRole) {
  if (stance === BOXING_STANCES.ORTHODOX) {
    return sideRole === SR.LEAD ? 'LEFT' : 'RIGHT';
  }
  if (stance === BOXING_STANCES.SOUTHPAW) {
    return sideRole === SR.LEAD ? 'RIGHT' : 'LEFT';
  }
  return null;
}

/** Tam 18 yetkili hareket tanımı (14 strike/defense + 4 footwork). */
export const BOXING_MOVES = Object.freeze([
  { id: I.JAB, canonicalName: 'Jab', displayName: 'Jab', movementType: MT.STRIKE, family: F.STRAIGHT, sideRole: SR.LEAD, target: T.HEAD, rangeClass: R.LONG, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: I.JAB_BODY, sortOrder: 1, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.JAB_BODY, canonicalName: 'Jab Body', displayName: 'Jab Body', movementType: MT.STRIKE, family: F.STRAIGHT, sideRole: SR.LEAD, target: T.BODY, rangeClass: R.LONG, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: I.JAB, bodyVariantId: null, sortOrder: 2, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.CROSS, canonicalName: 'Cross', displayName: 'Cross', movementType: MT.STRIKE, family: F.STRAIGHT, sideRole: SR.REAR, target: T.HEAD, rangeClass: R.LONG, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: I.CROSS_BODY, sortOrder: 3, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.CROSS_BODY, canonicalName: 'Cross Body', displayName: 'Cross Body', movementType: MT.STRIKE, family: F.STRAIGHT, sideRole: SR.REAR, target: T.BODY, rangeClass: R.LONG, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: I.CROSS, bodyVariantId: null, sortOrder: 4, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.LEAD_HOOK, canonicalName: 'Lead Hook', displayName: 'Lead Hook', movementType: MT.STRIKE, family: F.HOOK, sideRole: SR.LEAD, target: T.HEAD, rangeClass: R.MID, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: I.LEAD_BODY_HOOK, sortOrder: 5, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.REAR_HOOK, canonicalName: 'Rear Hook', displayName: 'Rear Hook', movementType: MT.STRIKE, family: F.HOOK, sideRole: SR.REAR, target: T.HEAD, rangeClass: R.MID, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: I.REAR_BODY_HOOK, sortOrder: 6, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.LEAD_BODY_HOOK, canonicalName: 'Lead Body Hook', displayName: 'Lead Body Hook', movementType: MT.STRIKE, family: F.HOOK, sideRole: SR.LEAD, target: T.BODY, rangeClass: R.MID, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: I.LEAD_HOOK, bodyVariantId: null, sortOrder: 7, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.REAR_BODY_HOOK, canonicalName: 'Rear Body Hook', displayName: 'Rear Body Hook', movementType: MT.STRIKE, family: F.HOOK, sideRole: SR.REAR, target: T.BODY, rangeClass: R.MID, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: I.REAR_HOOK, bodyVariantId: null, sortOrder: 8, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.LEAD_UPPERCUT, canonicalName: 'Lead Uppercut', displayName: 'Lead Uppercut', movementType: MT.STRIKE, family: F.UPPERCUT, sideRole: SR.LEAD, target: T.HEAD, rangeClass: R.CLOSE, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: null, sortOrder: 9, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.REAR_UPPERCUT, canonicalName: 'Rear Uppercut', displayName: 'Rear Uppercut', movementType: MT.STRIKE, family: F.UPPERCUT, sideRole: SR.REAR, target: T.HEAD, rangeClass: R.CLOSE, isDefensive: false, allowedInAttackCombinationLibrary: true, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: null, sortOrder: 10, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.SLIP_LEAD, canonicalName: 'Slip Lead', displayName: 'Slip Lead', movementType: MT.DEFENSE, family: F.SLIP, sideRole: SR.LEAD, target: T.NONE, rangeClass: R.VARIABLE, isDefensive: true, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: null, sortOrder: 11, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.SLIP_REAR, canonicalName: 'Slip Rear', displayName: 'Slip Rear', movementType: MT.DEFENSE, family: F.SLIP, sideRole: SR.REAR, target: T.NONE, rangeClass: R.VARIABLE, isDefensive: true, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: null, sortOrder: 12, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.CATCH_LEAD, canonicalName: 'Catch Lead', displayName: 'Catch Lead', movementType: MT.DEFENSE, family: F.CATCH, sideRole: SR.LEAD, target: T.NONE, rangeClass: R.MID, isDefensive: true, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: null, sortOrder: 13, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.CATCH_REAR, canonicalName: 'Catch Rear', displayName: 'Catch Rear', movementType: MT.DEFENSE, family: F.CATCH, sideRole: SR.REAR, target: T.NONE, rangeClass: R.MID, isDefensive: true, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: true, headVariantId: null, bodyVariantId: null, sortOrder: 14, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  // PART 32: Footwork movements (first-class technique registry, attack/defense isolated).
  { id: I.STEP_IN, canonicalName: 'Step In', displayName: 'Step In', movementType: MT.FOOTWORK, family: F.FOOTWORK, sideRole: SR.LEAD, target: T.NONE, rangeClass: R.VARIABLE, direction: D.FORWARD, isDefensive: false, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: false, headVariantId: null, bodyVariantId: null, sortOrder: 15, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.STEP_OUT, canonicalName: 'Step Out', displayName: 'Step Out', movementType: MT.FOOTWORK, family: F.FOOTWORK, sideRole: SR.REAR, target: T.NONE, rangeClass: R.VARIABLE, direction: D.BACKWARD, isDefensive: false, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: false, headVariantId: null, bodyVariantId: null, sortOrder: 16, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.STEP_LEAD_SIDE, canonicalName: 'Lead-side Step', displayName: 'Lead-side Step', movementType: MT.FOOTWORK, family: F.FOOTWORK, sideRole: SR.LEAD, target: T.NONE, rangeClass: R.VARIABLE, direction: D.LATERAL_LEAD, isDefensive: false, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: false, headVariantId: null, bodyVariantId: null, sortOrder: 17, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
  { id: I.STEP_REAR_SIDE, canonicalName: 'Rear-side Step', displayName: 'Rear-side Step', movementType: MT.FOOTWORK, family: F.FOOTWORK, sideRole: SR.REAR, target: T.NONE, rangeClass: R.VARIABLE, direction: D.LATERAL_REAR, isDefensive: false, allowedInAttackCombinationLibrary: false, allowedInDefenseSystem: false, headVariantId: null, bodyVariantId: null, sortOrder: 18, approved: true, active: true, libraryVersion: BOXING_MOVE_LIBRARY_VERSION },
]);

/** Authoritative setin geçerliliğini seed öncesi doğrular. */
export function validateBoxingMoveLibrary(moves) {
  const EXPECTED_MOVE_COUNT = Object.keys(BOXING_MOVE_IDS).length;
  if (!Array.isArray(moves) || moves.length !== EXPECTED_MOVE_COUNT) {
    return { valid: false, error: `Kütüphane tam ${EXPECTED_MOVE_COUNT} kayıt içermeli.` };
  }
  const ids = new Set();
  const sortOrders = new Set();
  const validTypes = Object.values(MT);
  const validFamilies = Object.values(F);
  const validRoles = Object.values(SR);
  const validTargets = Object.values(T);
  const validRanges = Object.values(R);
  const validDirections = Object.values(BOXING_FOOTWORK_DIRECTIONS);
  for (const m of moves) {
    if (!m.id) return { valid: false, error: 'Eksik id.' };
    if (ids.has(m.id)) return { valid: false, error: `Tekrarlanan id: ${m.id}` };
    ids.add(m.id);
    if (!m.canonicalName) return { valid: false, error: `${m.id}: canonicalName eksik.` };
    if (!validTypes.includes(m.movementType)) return { valid: false, error: `${m.id}: geçersiz movementType.` };
    if (!validFamilies.includes(m.family)) return { valid: false, error: `${m.id}: geçersiz family.` };
    if (!validRoles.includes(m.sideRole)) return { valid: false, error: `${m.id}: geçersiz sideRole.` };
    if (!validTargets.includes(m.target)) return { valid: false, error: `${m.id}: geçersiz target.` };
    if (!validRanges.includes(m.rangeClass)) return { valid: false, error: `${m.id}: geçersiz rangeClass.` };
    // PART 32: Footwork movements require a valid structured direction.
    if (m.movementType === MT.FOOTWORK) {
      if (!m.direction || !validDirections.includes(m.direction)) {
        return { valid: false, error: `${m.id}: geçersiz direction (footwork movement).` };
      }
    }
    if (typeof m.sortOrder !== 'number') return { valid: false, error: `${m.id}: sortOrder sayı değil.` };
    if (sortOrders.has(m.sortOrder)) return { valid: false, error: `${m.id}: tekrarlanan sortOrder.` };
    sortOrders.add(m.sortOrder);
    if (m.approved !== true) return { valid: false, error: `${m.id}: approved true olmalı.` };
    if (m.active !== true) return { valid: false, error: `${m.id}: active true olmalı.` };
  }
  for (const id of Object.values(BOXING_MOVE_IDS)) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical id: ${id}` };
  }
  return { valid: true };
}