/**
 * BOKS TEKNİK ANAYASASI (Constitution)
 * --------------------------------------------------------------
 * Bu Part TRANSITION/COMBINATION kaydı ÜRETMEZ. Yalnızca sonraki
 * transition/combination/progression/audit motorlarının uyması gereken
 * kuralları, boyutları ve enum'ları tanımlar.
 *
 * Kod-level'dır; yeni IndexedDB store gerektirmez (DB v2 kalır).
 * Deterministic + offline. AI/kamera/sensör YOKTUR.
 * Gerçek kullanıcının formunu doğrulamaz; yalnızca programın/kombinasyonun
 * mantıksal-biyomekanik tutarlılığına yardımcı olur.
 * --------------------------------------------------------------
 */
import {
  BOXING_FAMILIES, BOXING_RANGE_CLASSES,
} from '@/config/architecture';
import { BOXING_TECHNICAL_CONSTITUTION_VERSION } from '@/config/architecture';

export { BOXING_TECHNICAL_CONSTITUTION_VERSION };

/** PART 7 transition motorunun kullanacağı tek verdict seti. */
export const BOXING_TRANSITION_VERDICTS = Object.freeze({
  ALLOWED: 'allowed',
  CONDITIONAL: 'conditional',
  FORBIDDEN: 'forbidden',
});

/**
 * Bilinmeyen/verilmemiş geçiş default'u: fail-closed.
 * Matrix'te olmayan pair otomatik APPROVED sayılmaz.
 */
export const BOXING_UNKNOWN_TRANSITION_VERDICT = 'not_approved';

/** Koşullu geçiş neden kodları. */
export const BOXING_CONDITION_CODES = Object.freeze({
  RANGE_ADJUSTMENT_REQUIRED: 'range_adjustment_required',
  FOOTWORK_CONTEXT_REQUIRED: 'footwork_context_required',
  LEVEL_CHANGE_REQUIRED: 'level_change_required',
  RECOVERY_REQUIRED: 'recovery_required',
  DEFENSE_CONTEXT_REQUIRED: 'defense_context_required',
  ADVANCED_COORDINATION_REQUIRED: 'advanced_coordination_required',
  // PART 7: T17 conditional şartı (geriye uyumlu ekleme).
  WORKING_RANGE_MID_REQUIRED: 'working_range_mid_required',
});

/** Reddedilmiş geçiş neden kodları. */
export const BOXING_REJECTION_REASONS = Object.freeze({
  ATTACK_LIBRARY_INELIGIBLE: 'attack_library_ineligible',
  INCOMPATIBLE_RANGE: 'incompatible_range',
  UNMODELED_DEFENSIVE_CONTEXT: 'unmodeled_defensive_context',
  UNSTABLE_TECHNICAL_EXIT: 'unstable_technical_exit',
  INVALID_MOVEMENT_ID: 'invalid_movement_id',
  // PART 7: whitelist'te olmayan pair (fail-closed).
  PAIR_NOT_WHITELISTED: 'pair_not_whitelisted',
});

/**
 * Teknik değerlendirme boyutları. Tek bir isNatural boolean'ına
 * indirgenmez; neden uygun/uygunsuz olduğu boyutlu olarak takip edilir.
 */
export const BOXING_TECHNICAL_DIMENSIONS = Object.freeze([
  'stance',
  'lead_rear_relationship',
  'range',
  'movement_family',
  'target_level',
  'posture_base',
  'balance',
  'rotational_continuity',
  'guard_continuity',
  'recovery',
  'side_repetition',
  'distance_transition',
  'defense_context',
  'fatigue_robustness',
  'combination_entry',
  'combination_exit',
]);

/** Stabil kural tanımlayıcıları (audit sonucunda ihlal referansı için). */
export const BOXING_TECH_RULE_IDS = Object.freeze({
  STANCE_001: 'BOX_TECH_STANCE_001',
  RANGE_001: 'BOX_TECH_RANGE_001',
  GUARD_001: 'BOX_TECH_GUARD_001',
  DEFENSE_001: 'BOX_TECH_DEFENSE_001',
  RECOVERY_001: 'BOX_TECH_RECOVERY_001',
});

/**
 * Kavramsal kinetik zincir (ölçüm/derece/newton DEĞİL).
 * Yumruk yalnız kol hareketi olarak modellenmez.
 */
export const BOXING_KINETIC_CHAIN = Object.freeze([
  'base_lower_body',
  'pelvis_hips',
  'torso',
  'shoulder',
  'arm',
  'fist',
]);

/**
 * Range modeli aile bazında. preferredRange = hareketin rangeClass'ı;
 * compatibleRanges = teknik olarak kullanılabilecek ek mesafeler.
 * Range overlap mantığı: ortak compatible range varsa geçiş range
 * nedeniyle otomatik yasaklanmaz.
 */
export const BOXING_FAMILY_RANGE_MODEL = Object.freeze({
  [BOXING_FAMILIES.STRAIGHT]: {
    preferredRange: BOXING_RANGE_CLASSES.LONG,
    compatibleRanges: [BOXING_RANGE_CLASSES.LONG, BOXING_RANGE_CLASSES.MID],
  },
  [BOXING_FAMILIES.HOOK]: {
    preferredRange: BOXING_RANGE_CLASSES.MID,
    compatibleRanges: [BOXING_RANGE_CLASSES.MID, BOXING_RANGE_CLASSES.CLOSE],
  },
  [BOXING_FAMILIES.UPPERCUT]: {
    preferredRange: BOXING_RANGE_CLASSES.CLOSE,
    compatibleRanges: [BOXING_RANGE_CLASSES.CLOSE, BOXING_RANGE_CLASSES.MID],
  },
  // Slip savunma bağlamına bağlıdır; kesin preferredRange verilmez.
  [BOXING_FAMILIES.SLIP]: {
    preferredRange: null,
    compatibleRanges: null,
  },
  // PART 32: Footwork — direction-based, not range-class-based.
  [BOXING_FAMILIES.FOOTWORK]: {
    preferredRange: null,
    compatibleRanges: null,
  },
});

/** Hareket sonrası teorik çıkış kalitesi (performans ölçümü değil). */
export const BOXING_RECOVERY_QUALITY = Object.freeze({
  NATURAL: 'natural',
  CONDITIONAL: 'conditional',
  POOR: 'poor',
});

/** Yorgunluk dayanıklılığı değerlendirme boyutu (PART 8+ için tanımlı). */
export const BOXING_FATIGUE_ROBUSTNESS = Object.freeze({
  HIGH: 'high',
  MODERATE: 'moderate',
  LOW: 'low',
});

/** Onaylı kombinasyon uzunluk sınırı (2–10 korunur; yeni kısıtlama eklenmez). */
export const BOXING_COMBINATION_LENGTH = Object.freeze({
  MIN: 2,
  MAX: 10,
});