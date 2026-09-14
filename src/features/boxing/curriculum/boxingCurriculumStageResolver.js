/**
 * BOXING CURRICULUM STAGE RESOLVER (PART 22)
 * --------------------------------------------------------------
 * Bir programın belirli bir boxing exposure'ında hangi curriculum
 * stage'in aktif olması gerektiini deterministic olarak çözer.
 *
 * Stage progression:
 *  - global training ordinal DEĞİLDİR
 *  - round count DEĞİLDİR
 *  - UI phase label DEĞİLDİR
 *  - sahte performance score DEĞİLDİR
 *
 * Stage progression = duration policy + boxing exposure ordinal
 *
 * PART 22'de bu resolver generator'a BAĞLANMAZ.
 * Selector, progression, generator, audit, preview değişmez.
 * V1 generation output değişmez.
 *
 * Boxing exposure = sessionRole BOXING_ONLY_DAY veya
 * COMBINED_BOXING_STRENGTH_DAY olan gün.
 * Strength-only gün boxing exposure DEĞİLDİR.
 * --------------------------------------------------------------
 */
import { WEEKLY_SESSION_ROLES, EXPERIENCE_LEVELS, PROGRAM_DURATION_MONTHS } from '@/config/architecture';
import { BOXING_CURRICULUM_STAGES, getCurriculumStageName } from './boxingTechniqueCurriculum';

/** Stage 1 introduction window: ilk 2 boxing exposure. */
const STAGE_1_INTRO_EXPOSURES = 2;

/** Boxing exposure sayılan session role'leri. */
const BOXING_EXPOSURE_ROLES = Object.freeze(new Set([
  WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY,
  WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY,
]));

/**
 * Duration → maximum curriculum stage (Beginner).
 * 1M → Stage 2, 3M → Stage 3, 6M → Stage 4.
 * Stage 5/6 1/3/6 programlarda çıkmaz.
 */
export const BEGINNER_DURATION_MAX_STAGE = Object.freeze({
  [PROGRAM_DURATION_MONTHS.ONE]: BOXING_CURRICULUM_STAGES.BASIC_COMBINATION,
  [PROGRAM_DURATION_MONTHS.THREE]: BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION,
  [PROGRAM_DURATION_MONTHS.SIX]: BOXING_CURRICULUM_STAGES.ADVANCED_STRIKE_INTEGRATION,
});

const VALID_DURATIONS = Object.freeze(new Set(Object.values(PROGRAM_DURATION_MONTHS)));

function isValidPositiveInt(n) {
  return Number.isInteger(n) && n > 0;
}

// ============================================================
// BOUNDARY COMPUTATION — deterministic integer boundaries
// ============================================================

/** 1-month: stage1End = min(2, total). Max stage = 2. */
function computeBoundaries1Month(total) {
  return { stage1End: Math.min(STAGE_1_INTRO_EXPOSURES, total) };
}

/** 3-month: stage1End = min(2, total), stage2End = max(stage1End, floor(total*2/3)). Max stage = 3. */
function computeBoundaries3Month(total) {
  const stage1End = Math.min(STAGE_1_INTRO_EXPOSURES, total);
  let stage2End = Math.max(stage1End, Math.floor(total * 2 / 3));
  // CONTIGUITY (no stage skip): if exposures remain beyond Stage 1, Stage 2 must get at least 1.
  if (total > stage1End) {
    stage2End = Math.min(Math.max(stage2End, stage1End + 1), total);
  }
  return { stage1End, stage2End };
}

/** 6-month: stage1End = min(2, total), stage2End = max(stage1End, floor(total/3)), stage3End = max(stage2End, floor(total*2/3)). Max stage = 4. */
function computeBoundaries6Month(total) {
  const stage1End = Math.min(STAGE_1_INTRO_EXPOSURES, total);
  let stage2End = Math.max(stage1End, Math.floor(total / 3));
  let stage3End = Math.max(stage2End, Math.floor(total * 2 / 3));
  // CONTIGUITY (no stage skip): each stage must get at least 1 exposure if exposures remain.
  if (total > stage1End) {
    stage2End = Math.min(Math.max(stage2End, stage1End + 1), total);
  }
  if (total > stage2End) {
    stage3End = Math.min(Math.max(stage3End, stage2End + 1), total);
  }
  return { stage1End, stage2End, stage3End };
}

// ============================================================
// STAGE RESOLVER — pure, deterministic, fail-safe
// ============================================================

/**
 * Bir boxing exposure ordinali için curriculum stage çözer.
 *
 * @param {object} input
 * @param {number} input.durationMonths — 1, 3, veya 6
 * @param {string} input.experienceLevel — 'beginner' (diğerleri henüz tanımlı değil)
 * @param {number} input.boxingExposureOrdinal — 1-based
 * @param {number} input.totalBoxingExposures — pozitif integer
 * @returns {{ valid: boolean, stage: number|null, stageKey: string|null, ... }}
 */
export function resolveBoxingCurriculumStage({ durationMonths, experienceLevel, boxingExposureOrdinal, totalBoxingExposures } = {}) {
  // Validate duration
  if (!VALID_DURATIONS.has(durationMonths)) {
    return { valid: false, reason: 'invalid_duration_months', stage: null, stageKey: null };
  }
  // Validate experience — only Beginner defined for V2 curriculum
  if (experienceLevel !== EXPERIENCE_LEVELS.BEGINNER) {
    return { valid: false, reason: 'curriculum_timeline_not_defined_for_experience_level', stage: null, stageKey: null };
  }
  // Validate total
  if (!isValidPositiveInt(totalBoxingExposures)) {
    return { valid: false, reason: 'invalid_total_boxing_exposures', stage: null, stageKey: null };
  }
  // Validate ordinal
  if (!isValidPositiveInt(boxingExposureOrdinal) || boxingExposureOrdinal > totalBoxingExposures) {
    return { valid: false, reason: 'invalid_boxing_exposure_ordinal', stage: null, stageKey: null };
  }

  let stage;
  if (durationMonths === PROGRAM_DURATION_MONTHS.ONE) {
    const { stage1End } = computeBoundaries1Month(totalBoxingExposures);
    stage = boxingExposureOrdinal <= stage1End
      ? BOXING_CURRICULUM_STAGES.FUNDAMENTALS
      : BOXING_CURRICULUM_STAGES.BASIC_COMBINATION;
  } else if (durationMonths === PROGRAM_DURATION_MONTHS.THREE) {
    const { stage1End, stage2End } = computeBoundaries3Month(totalBoxingExposures);
    if (boxingExposureOrdinal <= stage1End) stage = BOXING_CURRICULUM_STAGES.FUNDAMENTALS;
    else if (boxingExposureOrdinal <= stage2End) stage = BOXING_CURRICULUM_STAGES.BASIC_COMBINATION;
    else stage = BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION;
  } else {
    // 6-month
    const { stage1End, stage2End, stage3End } = computeBoundaries6Month(totalBoxingExposures);
    if (boxingExposureOrdinal <= stage1End) stage = BOXING_CURRICULUM_STAGES.FUNDAMENTALS;
    else if (boxingExposureOrdinal <= stage2End) stage = BOXING_CURRICULUM_STAGES.BASIC_COMBINATION;
    else if (boxingExposureOrdinal <= stage3End) stage = BOXING_CURRICULUM_STAGES.DEFENSE_INTEGRATION;
    else stage = BOXING_CURRICULUM_STAGES.ADVANCED_STRIKE_INTEGRATION;
  }

  return {
    valid: true,
    stage,
    stageKey: getCurriculumStageName(stage),
    boxingExposureOrdinal,
    totalBoxingExposures,
    durationMonths,
    experienceLevel,
  };
}

/**
 * Bir duration için curriculum stage boundary'lerini çözer (test/debug için).
 * Invalid input → null.
 */
export function resolveCurriculumBoundaries(durationMonths, experienceLevel, totalBoxingExposures) {
  if (!VALID_DURATIONS.has(durationMonths)) return null;
  if (experienceLevel !== EXPERIENCE_LEVELS.BEGINNER) return null;
  if (!isValidPositiveInt(totalBoxingExposures)) return null;

  if (durationMonths === PROGRAM_DURATION_MONTHS.ONE) {
    return { ...computeBoundaries1Month(totalBoxingExposures), maxStage: BEGINNER_DURATION_MAX_STAGE[durationMonths] };
  }
  if (durationMonths === PROGRAM_DURATION_MONTHS.THREE) {
    return { ...computeBoundaries3Month(totalBoxingExposures), maxStage: BEGINNER_DURATION_MAX_STAGE[durationMonths] };
  }
  return { ...computeBoundaries6Month(totalBoxingExposures), maxStage: BEGINNER_DURATION_MAX_STAGE[durationMonths] };
}

// ============================================================
// BOXING EXPOSURE INDEX HELPERS — pure, not connected to generator
// ============================================================

/**
 * Bir program day boxing exposure mu?
 * Canonical sessionRole enum üzerinden — UI text değil.
 * BOXING_ONLY_DAY ve COMBINED_BOXING_STRENGTH_DAY → true.
 * STRENGTH_ONLY_DAY → false.
 */
export function isBoxingExposureDay(day) {
  return !!(day && BOXING_EXPOSURE_ROLES.has(day.sessionRole));
}

/**
 * Program boyunca boxing exposure map'i hesaplar.
 * trainingOrdinal'a göre sıralar, boxing exposure günleri 1-based numaralandırır.
 *
 * @returns {{ exposures: Array, totalBoxingExposures: number }}
 * exposures: [{ dayId, trainingOrdinal, sessionRole, isBoxingExposure, boxingExposureOrdinal }]
 */
export function computeBoxingExposureMap(programDays) {
  if (!Array.isArray(programDays)) return { exposures: [], totalBoxingExposures: 0 };
  const sortedDays = [...programDays].sort((a, b) => (a.trainingOrdinal || 0) - (b.trainingOrdinal || 0));
  const exposures = [];
  let counter = 0;
  for (const day of sortedDays) {
    const isBoxing = isBoxingExposureDay(day);
    let ordinal = null;
    if (isBoxing) {
      counter += 1;
      ordinal = counter;
    }
    exposures.push({
      dayId: day.id,
      trainingOrdinal: day.trainingOrdinal,
      sessionRole: day.sessionRole,
      isBoxingExposure: isBoxing,
      boxingExposureOrdinal: ordinal,
    });
  }
  return { exposures, totalBoxingExposures: counter };
}

/**
 * Belirli bir gün için boxing exposure index'i döndürür.
 * Boxing exposure değilse boxingExposureOrdinal = null.
 * Gün bulunamazsa → null.
 */
export function deriveBoxingExposureIndex(programDays, targetDayId) {
  const map = computeBoxingExposureMap(programDays);
  const entry = map.exposures.find((e) => e.dayId === targetDayId);
  if (!entry) return null;
  return {
    isBoxingExposure: entry.isBoxingExposure,
    boxingExposureOrdinal: entry.boxingExposureOrdinal,
    totalBoxingExposures: map.totalBoxingExposures,
  };
}