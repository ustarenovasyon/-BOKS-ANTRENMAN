/**
 * BOXING TECHNIQUE CURRICULUM — SOURCE OF TRUTH (PART 21)
 * --------------------------------------------------------------
 * Boks tekniklerinin hangi curriculum stage'de açıldığını tanımlayan
 * merkezi, deterministic, tek-source-of-truth veri modeli.
 *
 * PART 21'de bu model selector'a BAĞLANMAZ.
 * Aktif generation policy hâlâ V1.
 * Selector, progression, generator, audit, preview değişmez.
 *
 * Invariants:
 *  - Unlock monotonicity: allowedTechniques(stage N) ⊇ allowedTechniques(stage N-1)
 *  - Prerequisite = pedagojik metadata, runtime gate DEĞİLDİR
 *  - Runtime eligibility: introducedStage <= currentStage
 *  - Unknown movement → fail-safe (null/false), asla Stage 1 değil
 *  - Invalid stage → fail-safe, asla clamp değil
 *  - Combo requiredStage movement'lardan DERIVE edilir, elle yazılmaz
 *  - Stage 5/6 yeni hareket açmaz (mevcut teknikler açık kalır)
 *
 * Circular import YOK: yalnız boxingMoves.js'ten import eder.
 * PART 32: Footwork (Step In/Out/Lead-side/Rear-side) eklendi.
 * Pivot/angle hâlâ YOK (ayrı architecture PART gerektirir).
 * Savunma genişletme YOK (Block/Parry/Roll ayrı PART).
 * --------------------------------------------------------------
 */
import { BOXING_MOVE_IDS, BOXING_MOVES } from '@/features/boxing/library/boxingMoves';

/** Curriculum model versiyonu (DB schema version'dan ayrı). */
export const BOXING_TECHNIQUE_CURRICULUM_VERSION = 1;

/**
 * 6 curriculum stage. Immutable. Magic number yerine bu kullanılır.
 * Stage ID'ler değiştirilemez.
 */
export const BOXING_CURRICULUM_STAGES = Object.freeze({
  FUNDAMENTALS: 1,
  BASIC_COMBINATION: 2,
  DEFENSE_INTEGRATION: 3,
  ADVANCED_STRIKE_INTEGRATION: 4,
  RHYTHM_ADVANCED: 5,
  PERFORMANCE: 6,
});

/** Stage ID → stage key (display/debug için). */
export const BOXING_CURRICULUM_STAGE_NAMES = Object.freeze({
  [BOXING_CURRICULUM_STAGES.FUNDAMENTALS]: 'fundamentals',
  [BOXING_CURRICULUM_STAGES.BASIC_COMBINATION]: 'basic_combination',
  [BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION]: 'defense_integration',
  [BOXING_CURRICULUM_STAGES.ADVANCED_STRIKE_INTEGRATION]: 'advanced_strike_integration',
  [BOXING_CURRICULUM_STAGES.RHYTHM_ADVANCED]: 'rhythm_advanced',
  [BOXING_CURRICULUM_STAGES.PERFORMANCE]: 'performance',
});

/** Tüm geçerli stage'ler. */
const VALID_STAGES = Object.freeze(new Set(Object.values(BOXING_CURRICULUM_STAGES)));

/**
 * Merkezi curriculum mapping: moveId → curriculum entry.
 *
 * introducedStage: hareketin ilk açıldığı stage (runtime eligibility source of truth).
 * prerequisites: pedagojik referans movement ID'leri. Runtime gate DEĞİLDİR.
 *
 * Prerequisite graph bir DAG'dir — tüm prerequisite kenarları
 * daha erken açılan hareketlere işaret eder. Circular dependency YASAK.
 */
const CURRICULUM_ENTRIES = Object.freeze({
  // --- Stage 1: Fundamentals ---
  [BOXING_MOVE_IDS.JAB]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.FUNDAMENTALS, prerequisites: Object.freeze([]) }),
  [BOXING_MOVE_IDS.CROSS]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.FUNDAMENTALS, prerequisites: Object.freeze([BOXING_MOVE_IDS.JAB]) }),

  // --- Stage 2: Basic Combination ---
  [BOXING_MOVE_IDS.LEAD_HOOK]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.CROSS]) }),
  [BOXING_MOVE_IDS.REAR_HOOK]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.CROSS]) }),
  [BOXING_MOVE_IDS.JAB_BODY]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.JAB]) }),
  [BOXING_MOVE_IDS.CROSS_BODY]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.CROSS]) }),
  [BOXING_MOVE_IDS.CATCH_LEAD]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS]) }),
  [BOXING_MOVE_IDS.CATCH_REAR]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS]) }),

  // --- Stage 3: Defense Integration ---
  [BOXING_MOVE_IDS.SLIP_LEAD]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS]) }),
  [BOXING_MOVE_IDS.SLIP_REAR]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS]) }),
  [BOXING_MOVE_IDS.LEAD_BODY_HOOK]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.LEAD_HOOK]) }),
  [BOXING_MOVE_IDS.REAR_BODY_HOOK]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.REAR_HOOK]) }),

  // --- Stage 4: Advanced Strike Integration ---
  [BOXING_MOVE_IDS.LEAD_UPPERCUT]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.ADVANCED_STRIKE_INTEGRATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.LEAD_HOOK]) }),
  [BOXING_MOVE_IDS.REAR_UPPERCUT]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.ADVANCED_STRIKE_INTEGRATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.REAR_HOOK]) }),

  // --- PART 32: Footwork curriculum entries ---
  // Stage 1: Basic translation steps (prereq: none — truly foundational).
  [BOXING_MOVE_IDS.STEP_IN]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.FUNDAMENTALS, prerequisites: Object.freeze([]) }),
  [BOXING_MOVE_IDS.STEP_OUT]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.FUNDAMENTALS, prerequisites: Object.freeze([]) }),
  // Stage 2: Lateral steps (prereq: basic forward/backward steps).
  [BOXING_MOVE_IDS.STEP_LEAD_SIDE]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.STEP_IN, BOXING_MOVE_IDS.STEP_OUT]) }),
  [BOXING_MOVE_IDS.STEP_REAR_SIDE]: Object.freeze({ introducedStage: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION, prerequisites: Object.freeze([BOXING_MOVE_IDS.STEP_IN, BOXING_MOVE_IDS.STEP_OUT]) }),
});

// ============================================================
// HELPER API — MINIMAL, DETERMINISTIC, FAIL-SAFE
// ============================================================

/**
 * Stage geçerli mi? Sadece 1–6 integer'ları geçerli.
 * "2" (string), null, undefined, NaN, 0, -1, 7, 999 → invalid.
 */
export function isValidCurriculumStage(stage) {
  return Number.isInteger(stage) && VALID_STAGES.has(stage);
}

/**
 * A. Movement curriculum entry.
 * Unknown ID → null (fail-safe, sessizce Stage 1 değil).
 */
export function getTechniqueCurriculumEntry(moveId) {
  return CURRICULUM_ENTRIES[moveId] || null;
}

/**
 * B. Movement introducedStage.
 * Unknown movement → null (asla Stage 1 değil).
 */
export function getTechniqueIntroducedStage(moveId) {
  const entry = CURRICULUM_ENTRIES[moveId];
  return entry ? entry.introducedStage : null;
}

/**
 * C. Technique eligibility.
 * Runtime eligibility: introducedStage <= stage.
 * Unknown movement → false. Invalid stage → false.
 */
export function isTechniqueAllowedAtStage(moveId, stage) {
  if (!isValidCurriculumStage(stage)) return false;
  const entry = CURRICULUM_ENTRIES[moveId];
  if (!entry) return false;
  return entry.introducedStage <= stage;
}

/**
 * D. Allowed technique set for a stage.
 * Stage yükseldikçe set monotonik büyür (unlock monotonicity).
 * Invalid stage → boş array. SortOrder'a göre sıralı.
 */
export function getAllowedTechniqueIdsForStage(stage) {
  if (!isValidCurriculumStage(stage)) return [];
  return BOXING_MOVES
    .filter((m) => {
      const entry = CURRICULUM_ENTRIES[m.id];
      return entry && entry.introducedStage <= stage;
    })
    .map((m) => m.id);
}

/**
 * E. Combo/sequence required stage (DERIVED).
 * max(introducedStage(move1), introducedStage(move2), ...)
 * Elle combo'lara yazılmaz — movement'lardan derive edilir.
 * Unknown movement → null (fail-safe, otomatik başlangıç sayılmaz).
 */
export function getComboRequiredStage(moveIds) {
  if (!Array.isArray(moveIds) || moveIds.length === 0) return null;
  let maxStage = 0;
  for (const moveId of moveIds) {
    const entry = CURRICULUM_ENTRIES[moveId];
    if (!entry) return null;
    if (entry.introducedStage > maxStage) maxStage = entry.introducedStage;
  }
  return maxStage > 0 ? maxStage : null;
}

/**
 * F. Defense rule required stage (DERIVED).
 * max(defense move stage, counter move stages).
 * Manual duplicate defense curriculum stage YOK.
 */
export function getDefenseRuleRequiredStage(rule) {
  if (!rule || !rule.defenseMoveId) return null;
  const allMoveIds = [rule.defenseMoveId, ...(Array.isArray(rule.counterMoveIds) ? rule.counterMoveIds : [])];
  return getComboRequiredStage(allMoveIds);
}

/**
 * Stage display name (debug/display için).
 * Invalid stage → null.
 */
export function getCurriculumStageName(stage) {
  if (!isValidCurriculumStage(stage)) return null;
  return BOXING_CURRICULUM_STAGE_NAMES[stage];
}

/**
 * Curriculum coverage validation.
 * Tüm movement library ID'leri mapping'de tam olarak bir kez bulunmalı.
 * Missing = 0, extra = 0, duplicate = 0.
 */
export function validateCurriculumCoverage() {
  const libraryIds = BOXING_MOVES.map((m) => m.id);
  const librarySet = new Set(libraryIds);
  const curriculumIds = Object.keys(CURRICULUM_ENTRIES);

  const missing = libraryIds.filter((id) => !CURRICULUM_ENTRIES[id]);
  const extra = curriculumIds.filter((id) => !librarySet.has(id));

  return {
    valid: missing.length === 0 && extra.length === 0,
    libraryCount: libraryIds.length,
    curriculumCount: curriculumIds.length,
    missing: Object.freeze(missing),
    extra: Object.freeze(extra),
  };
}