/**
 * KUVVET TEKNİK ANAYASASI V1
 * --------------------------------------------------------------
 * 9 authoritative hareket üzerinden ileride üretilecek kuvvet
 * antrenmanlarının DENGE / TUTARLILIK kuralları. Fizyoloji simülatörü
 * DEĞİLDİR: kalp atışı/kas hasarı/form ölçümü yoktur. Yalnız program
 * yapısını denetler. Kg önermez. Boxing kataloguna write yapmaz.
 * --------------------------------------------------------------
 */
import { STRENGTH_EXERCISES, STRENGTH_EXERCISE_IDS } from '../library/strengthExercises';
import {
  STRENGTH_MOVEMENT_PATTERNS, STRENGTH_BODY_REGIONS, STRENGTH_PRESCRIPTION_TYPES,
  STRENGTH_ALTERNATIVE_GROUPS, STRENGTH_LATERALITY,
} from '@/config/architecture';

/** Anayasa versiyonu (kod-level; DB schema'dan ayrı). */
export const STRENGTH_TECHNICAL_CONSTITUTION_VERSION = 1;

/** Uzun dönem ihmal edilmemesi gereken fonksiyonel patternler. */
export const STRENGTH_COVERAGE_PATTERNS = Object.freeze([
  STRENGTH_MOVEMENT_PATTERNS.PUSH,
  STRENGTH_MOVEMENT_PATTERNS.ROW,
  STRENGTH_MOVEMENT_PATTERNS.SQUAT,
  STRENGTH_MOVEMENT_PATTERNS.LUNGE,
  STRENGTH_MOVEMENT_PATTERNS.HINGE,
  STRENGTH_MOVEMENT_PATTERNS.CORE_ANTI_EXTENSION,
  STRENGTH_MOVEMENT_PATTERNS.CORE_LATERAL_STABILITY,
]);

/** Normal bir strength seansında aynı alternativeGroup'tan maksimum hareket. */
export const MAX_PER_ALTERNATIVE_GROUP_PER_SESSION = Object.freeze({
  [STRENGTH_ALTERNATIVE_GROUPS.ROW_VARIANTS]: 1,
});

/** Combined (Boks+Kuvvet) günü varsayılan blok sırası (boxing-first). */
export const COMBINED_DAY_DEFAULT_ORDER = Object.freeze([
  'warmup',
  'boxing_technique',
  'strength',
  'core_cooldown',
]);

/** Kg önerme politikası: uygulama external load reçete ETMEZ. */
export const STRENGTH_KG_POLICY = Object.freeze({
  APP_PRESCRIBES_EXTERNAL_LOAD: false,
  FORBIDDEN_LOAD_FIELDS: Object.freeze([
    'recommendedKg', 'prescribedKg', 'startingWeightKg',
    'autoLoadKg', 'targetWeight', 'oneRepMaxTarget',
  ]),
});

/** Unilateral hareketler iki tarafı da gerektirir (boxing stance'tan bağımsız). */
export const STRENGTH_SIDE_SEMANTICS = Object.freeze({
  BOTH_SIDES_REQUIRED: 'both_sides_required',
  UNILATERAL_LATERALITIES: Object.freeze([
    STRENGTH_LATERALITY.UNILATERAL,
    STRENGTH_LATERALITY.ISOMETRIC_UNILATERAL,
  ]),
});

/** Recovery için saate değil mantıksal denetim kavramlarına güven. */
export const STRENGTH_RECOVERY_CONCEPTS = Object.freeze({
  ADJACENT_DAY_REPEAT: 'adjacent_day_repeat',
  SHORT_RECOVERY_WINDOW: 'short_recovery_window',
  REPEATED_PATTERN_DENSITY: 'repeated_pattern_density',
});

/** Core placement prensibi: compound hareketlerden sonra (sabit sıra değil). */
export const STRENGTH_CORE_PLACEMENT = Object.freeze({
  PREFERRED_POSITION: 'after_compound',
  HARD_ORDER: false,
});

/** Authoritative hareket indeksi. */
export const STRENGTH_EXERCISE_BY_ID = Object.freeze(
  Object.fromEntries(STRENGTH_EXERCISES.map((e) => [e.id, e]))
);

export const STRENGTH_CANONICAL_EXERCISE_COUNT = STRENGTH_EXERCISES.length;
export { STRENGTH_EXERCISE_IDS };