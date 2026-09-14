/**
 * ONAYLI KUVVET ANTRENMAN İSKELETLERİ V1
 * --------------------------------------------------------------
 * Authoritative source: ordered exerciseIds ARRAY. Sıra değiştirilemez.
 * Template = skeleton ONLY: set/rep/rest/duration/kg YOK.
 * 9 canonical hareketin dışına çıkılmaz. Max 1 ROW_VARIANT/template.
 * Kullanıcı ekipmanına göre daraltılmaz; runtime filter ayrı.
 * --------------------------------------------------------------
 */
import { STRENGTH_EXERCISES, isStrengthExerciseAvailable } from '../library/strengthExercises';
import { evaluateStrengthSessionBalance } from '../technical/strengthSessionValidator';
import { STRENGTH_EXERCISE_BY_ID } from '../technical/strengthTechnicalConstitution';
import {
  STRENGTH_TEMPLATE_LIBRARY_VERSION, STRENGTH_TEMPLATE_SOURCE_CLASSES,
  STRENGTH_ALTERNATIVE_GROUPS, STRENGTH_MOVEMENT_PATTERNS, STRENGTH_BODY_REGIONS,
  STRENGTH_DENSITY_CLASSES,
} from '@/config/architecture';

const EX_BY_ID = STRENGTH_EXERCISE_BY_ID;
const ALL_EQUIPMENT = ['dumbbell', 'barbell', 'ez_bar'];

/** Ham 16 tanım (id, label, sortOrder, exerciseIds). */
const RAW_TEMPLATES = [
  // --- 3 hareket (4) ---
  { id: 'STR_TEMPLATE_03_001', label: 'K-301', sortOrder: 1, exerciseIds: ['STR_SQUAT', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW'] },
  { id: 'STR_TEMPLATE_03_002', label: 'K-302', sortOrder: 2, exerciseIds: ['STR_ROMANIAN_DEADLIFT', 'STR_PUSHUP', 'STR_PLANK'] },
  { id: 'STR_TEMPLATE_03_003', label: 'K-303', sortOrder: 3, exerciseIds: ['STR_REVERSE_LUNGE', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_SIDE_PLANK'] },
  { id: 'STR_TEMPLATE_03_004', label: 'K-304', sortOrder: 4, exerciseIds: ['STR_SQUAT', 'STR_EZ_BAR_BENT_OVER_ROW', 'STR_PLANK'] },
  // --- 4 hareket (6) ---
  { id: 'STR_TEMPLATE_04_001', label: 'K-401', sortOrder: 5, exerciseIds: ['STR_SQUAT', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_PLANK'] },
  { id: 'STR_TEMPLATE_04_002', label: 'K-402', sortOrder: 6, exerciseIds: ['STR_ROMANIAN_DEADLIFT', 'STR_REVERSE_LUNGE', 'STR_EZ_BAR_BENT_OVER_ROW', 'STR_SIDE_PLANK'] },
  { id: 'STR_TEMPLATE_04_003', label: 'K-403', sortOrder: 7, exerciseIds: ['STR_REVERSE_LUNGE', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_PLANK'] },
  { id: 'STR_TEMPLATE_04_004', label: 'K-404', sortOrder: 8, exerciseIds: ['STR_SQUAT', 'STR_ROMANIAN_DEADLIFT', 'STR_BARBELL_BENT_OVER_ROW', 'STR_SIDE_PLANK'] },
  { id: 'STR_TEMPLATE_04_005', label: 'K-405', sortOrder: 9, exerciseIds: ['STR_SQUAT', 'STR_PUSHUP', 'STR_EZ_BAR_BENT_OVER_ROW', 'STR_SIDE_PLANK'] },
  { id: 'STR_TEMPLATE_04_006', label: 'K-406', sortOrder: 10, exerciseIds: ['STR_ROMANIAN_DEADLIFT', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_PLANK'] },
  // --- 5 hareket (4) ---
  { id: 'STR_TEMPLATE_05_001', label: 'K-501', sortOrder: 11, exerciseIds: ['STR_SQUAT', 'STR_ROMANIAN_DEADLIFT', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_PLANK'] },
  { id: 'STR_TEMPLATE_05_002', label: 'K-502', sortOrder: 12, exerciseIds: ['STR_REVERSE_LUNGE', 'STR_ROMANIAN_DEADLIFT', 'STR_PUSHUP', 'STR_EZ_BAR_BENT_OVER_ROW', 'STR_SIDE_PLANK'] },
  { id: 'STR_TEMPLATE_05_003', label: 'K-503', sortOrder: 13, exerciseIds: ['STR_SQUAT', 'STR_REVERSE_LUNGE', 'STR_PUSHUP', 'STR_BARBELL_BENT_OVER_ROW', 'STR_PLANK'] },
  { id: 'STR_TEMPLATE_05_004', label: 'K-504', sortOrder: 14, exerciseIds: ['STR_ROMANIAN_DEADLIFT', 'STR_REVERSE_LUNGE', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_SIDE_PLANK'] },
  // --- 6 hareket (2) ---
  { id: 'STR_TEMPLATE_06_001', label: 'K-601', sortOrder: 15, exerciseIds: ['STR_SQUAT', 'STR_ROMANIAN_DEADLIFT', 'STR_PUSHUP', 'STR_ONE_ARM_DUMBBELL_ROW', 'STR_PLANK', 'STR_SIDE_PLANK'] },
  { id: 'STR_TEMPLATE_06_002', label: 'K-602', sortOrder: 16, exerciseIds: ['STR_REVERSE_LUNGE', 'STR_ROMANIAN_DEADLIFT', 'STR_PUSHUP', 'STR_BARBELL_BENT_OVER_ROW', 'STR_PLANK', 'STR_SIDE_PLANK'] },
];

export const STRENGTH_TEMPLATE_IDS = Object.freeze(RAW_TEMPLATES.map((t) => t.id));

const FORBIDDEN_PRESCRIPTION_KEYS = ['sets', 'reps', 'seconds', 'restSeconds', 'rest', 'durationMinutes', 'weight', 'kg', 'recommendedKg', 'defaultKg', 'workingWeight', 'startingLoad', 'targetLoad'];

function densityClass(count) {
  if (count <= 3) return STRENGTH_DENSITY_CLASSES.LOW;
  if (count <= 5) return STRENGTH_DENSITY_CLASSES.MODERATE;
  return STRENGTH_DENSITY_CLASSES.HIGH;
}

function buildTemplate(raw) {
  const ids = raw.exerciseIds;
  const exercises = ids.map((id) => EX_BY_ID[id]);
  const movementPatterns = [];
  const bodyRegions = [];
  const lower = new Set();
  const upper = new Set();
  const core = new Set();
  const equipment = new Set();
  for (const ex of exercises) {
    if (!movementPatterns.includes(ex.movementPattern)) movementPatterns.push(ex.movementPattern);
    if (!bodyRegions.includes(ex.bodyRegion)) bodyRegions.push(ex.bodyRegion);
    if (ex.bodyRegion === STRENGTH_BODY_REGIONS.LOWER) lower.add(ex.movementPattern);
    else if (ex.bodyRegion === STRENGTH_BODY_REGIONS.UPPER) upper.add(ex.movementPattern);
    else if (ex.bodyRegion === STRENGTH_BODY_REGIONS.CORE) core.add(ex.movementPattern);
    (ex.allowedEquipment || []).forEach((e) => equipment.add(e));
  }
  return Object.freeze({
    id: raw.id,
    label: raw.label,
    exerciseIds: Object.freeze(ids.slice()),
    movementCount: ids.length,
    approved: true,
    active: true,
    libraryVersion: STRENGTH_TEMPLATE_LIBRARY_VERSION,
    sourceClass: STRENGTH_TEMPLATE_SOURCE_CLASSES.APP_APPROVED_STRENGTH_TEMPLATE_V1,
    sortOrder: raw.sortOrder,
    movementPatterns: Object.freeze(movementPatterns),
    bodyRegions: Object.freeze(bodyRegions),
    lowerBodyPatternCount: lower.size,
    upperBodyPatternCount: upper.size,
    corePatternCount: core.size,
    requiredEquipmentOptions: Object.freeze([...equipment]),
    sequenceKey: ids.join('>'),
    exerciseSetKey: ids.slice().sort().join('>'),
    densityClass: densityClass(ids.length),
  });
}

/** Tam 16 yetkili template (derived alanlarla). */
export const STRENGTH_TEMPLATES = Object.freeze(RAW_TEMPLATES.map(buildTemplate));

/** Runtime eligibility: template içindeki her hareket availableEquipment ile yapılabilir mi. */
export function isStrengthTemplateAvailable(template, availableEquipment) {
  if (!template || !Array.isArray(template.exerciseIds)) return false;
  return template.exerciseIds.every((id) => {
    const ex = EX_BY_ID[id];
    return ex && isStrengthExerciseAvailable(ex, availableEquipment);
  });
}

const EXPECTED_DISTRIBUTION = { 3: 4, 4: 6, 5: 4, 6: 2 };

/** Authoritative 16 template setin geçerliliğini seed öncesi doğrular. */
export function validateStrengthTemplateLibrary(templates) {
  if (!Array.isArray(templates) || templates.length !== 16) {
    return { valid: false, error: 'Template library tam 16 kayıt içermeli.' };
  }
  const ids = new Set();
  const sortOrders = new Set();
  const sequenceKeys = new Set();
  const exerciseSetKeys = new Set();
  const distribution = {};
  const libraryPatterns = new Set();
  const libraryRowVariants = new Set();
  let plankSeen = false;
  let sidePlankSeen = false;
  const warnings = [];

  for (const t of templates) {
    if (!t.id) return { valid: false, error: 'Eksik template id.' };
    if (ids.has(t.id)) return { valid: false, error: `Tekrarlanan id: ${t.id}` };
    ids.add(t.id);
    if (!Array.isArray(t.exerciseIds) || t.exerciseIds.length < 3 || t.exerciseIds.length > 6) {
      return { valid: false, error: `${t.id}: exerciseIds 3–6 arası olmalı.` };
    }
    if (t.movementCount !== t.exerciseIds.length) {
      return { valid: false, error: `${t.id}: movementCount length ile eşleşmiyor.` };
    }
    // Yasaklı prescription/kg alanları.
    for (const k of FORBIDDEN_PRESCRIPTION_KEYS) {
      if (Object.prototype.hasOwnProperty.call(t, k)) {
        return { valid: false, error: `${t.id}: yasaklı alan ${k}.` };
      }
    }
    const seenInTemplate = new Set();
    let rowVariantCount = 0;
    let lastNonCoreIdx = -1;
    let firstCoreIdx = t.exerciseIds.length;
    for (let i = 0; i < t.exerciseIds.length; i++) {
      const ex = EX_BY_ID[t.exerciseIds[i]];
      if (!ex) return { valid: false, error: `${t.id}: bilinmeyen hareket ${t.exerciseIds[i]}.` };
      if (ex.approved !== true || ex.active !== true) return { valid: false, error: `${t.id}: inactive exercise ${ex.id}.` };
      if (seenInTemplate.has(ex.id)) return { valid: false, error: `${t.id}: duplicate exercise ${ex.id}.` };
      seenInTemplate.add(ex.id);
      if (ex.alternativeGroup === STRENGTH_ALTERNATIVE_GROUPS.ROW_VARIANTS) {
        rowVariantCount += 1;
        libraryRowVariants.add(ex.id);
      }
      libraryPatterns.add(ex.movementPattern);
      if (ex.id === 'STR_PLANK') plankSeen = true;
      if (ex.id === 'STR_SIDE_PLANK') sidePlankSeen = true;
      if (ex.isCoreExercise) {
        if (firstCoreIdx === t.exerciseIds.length) firstCoreIdx = i;
      } else {
        lastNonCoreIdx = i;
      }
    }
    if (rowVariantCount > 1) return { valid: false, error: `${t.id}: max 1 ROW_VARIANT (bulunan ${rowVariantCount}).` };
    // Core ordering: non-core exercise bir core'dan sonra gelemez.
    if (firstCoreIdx < t.exerciseIds.length && lastNonCoreIdx > firstCoreIdx) {
      return { valid: false, error: `${t.id}: core hareket sonda olmalı.` };
    }
    // Lower-body density: 5/6 hareketli template'lerde 3 lower pattern olmaz.
    if ((t.movementCount === 5 || t.movementCount === 6) && t.lowerBodyPatternCount >= 3) {
      return { valid: false, error: `${t.id}: 3 lower pattern yığılmış (V1 kuralı).` };
    }
    if (sequenceKeys.has(t.sequenceKey)) return { valid: false, error: `${t.id}: duplicate sequence.` };
    sequenceKeys.add(t.sequenceKey);
    if (exerciseSetKeys.has(t.exerciseSetKey)) return { valid: false, error: `${t.id}: duplicate exercise set.` };
    exerciseSetKeys.add(t.exerciseSetKey);
    if (typeof t.sortOrder !== 'number') return { valid: false, error: `${t.id}: sortOrder sayı değil.` };
    if (sortOrders.has(t.sortOrder)) return { valid: false, error: `${t.id}: tekrarlanan sortOrder.` };
    sortOrders.add(t.sortOrder);
    if (t.approved !== true) return { valid: false, error: `${t.id}: approved true olmalı.` };
    if (t.active !== true) return { valid: false, error: `${t.id}: active true olmalı.` };
    if (t.libraryVersion !== STRENGTH_TEMPLATE_LIBRARY_VERSION) return { valid: false, error: `${t.id}: libraryVersion uyumsuz.` };
    if (t.sourceClass !== STRENGTH_TEMPLATE_SOURCE_CLASSES.APP_APPROVED_STRENGTH_TEMPLATE_V1) return { valid: false, error: `${t.id}: sourceClass uyumsuz.` };
    // Constitution validation (catalog context: all-equipment; user-independent).
    const sessionResult = evaluateStrengthSessionBalance({ exerciseIds: t.exerciseIds, availableEquipment: ALL_EQUIPMENT });
    if (!sessionResult.valid) {
      return { valid: false, error: `${t.id}: constitution validation fail (${sessionResult.reasons.join(',')}).` };
    }
    if (sessionResult.warnings.length > 0) {
      warnings.push({ id: t.id, warnings: sessionResult.warnings.slice() });
    }
    distribution[t.movementCount] = (distribution[t.movementCount] || 0) + 1;
  }

  for (const k of Object.keys(EXPECTED_DISTRIBUTION)) {
    if (distribution[k] !== EXPECTED_DISTRIBUTION[k]) {
      return { valid: false, error: `Dağılım hatası: movementCount ${k} = ${distribution[k]} (beklenen ${EXPECTED_DISTRIBUTION[k]}).` };
    }
  }
  // Library-level pattern coverage 7/7.
  for (const p of Object.values(STRENGTH_MOVEMENT_PATTERNS)) {
    if (!libraryPatterns.has(p)) return { valid: false, error: `Library pattern coverage eksik: ${p}` };
  }
  // 3 row variant temsil.
  if (libraryRowVariants.size !== 3) return { valid: false, error: `3 Row variant temsil edilmeli (bulunan ${libraryRowVariants.size}).` };
  if (!plankSeen || !sidePlankSeen) return { valid: false, error: 'Plank ve Side Plank temsil edilmeli.' };
  for (const id of STRENGTH_TEMPLATE_IDS) {
    if (!ids.has(id)) return { valid: false, error: `Eksik canonical template id: ${id}` };
  }
  return { valid: true, warnings };
}