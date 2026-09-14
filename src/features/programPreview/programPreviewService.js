/**
 * PROGRAM PREVIEW SERVICE (PART 16)
 * --------------------------------------------------------------
 * READ-ONLY. Persisted Program/Version/Days/Blocks okur.
 * Generation engine ÇAĞIRMAZ. Regenerate YOK.
 * Structural integrity guard + fingerprint recompute/compare.
 * --------------------------------------------------------------
 */
import {
  programRepository, programVersionRepository, programDayRepository, workoutBlockRepository,
} from '@/lib/localData/repositories';
import { WEEKLY_SESSION_ROLES, WORKOUT_BLOCK_TYPES } from '@/config/architecture';
import { computeBlueprintFingerprint } from '@/features/programGeneration/blueprintFingerprint';
import { resolveGenerationPolicyVersion } from '@/features/programGeneration/generationPolicyResolver';
import { PREVIEWABLE_STATUSES } from './previewLabels';
import { buildProgramPreviewViewModel } from './previewViewModel';

const ROLE_BOXING = WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY;
const ROLE_STRENGTH = WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY;
const ROLE_COMBINED = WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY;

const KNOWN_BLOCK_TYPES = new Set(Object.values(WORKOUT_BLOCK_TYPES));

function fail(reason, extra = {}) {
  return { valid: false, reason, ...extra };
}

/**
 * Persisted program'ı read-only yükle + integrity doğrula.
 * Returns { valid:true, viewModel } | { valid:false, reason }.
 */
export async function loadProgramPreview(programId) {
  if (!programId) return fail('PREVIEW_PROGRAM_NOT_FOUND');

  let program;
  try {
    program = await programRepository.getById(programId);
  } catch (e) {
    return fail('PREVIEW_READ_FAILED', { error: String(e) });
  }
  if (!program) return fail('PREVIEW_PROGRAM_NOT_FOUND');

  let version;
  try {
    version = await programVersionRepository.getById(program.currentVersionId);
  } catch (e) {
    return fail('PREVIEW_READ_FAILED', { error: String(e) });
  }
  if (!version) return fail('PREVIEW_VERSION_NOT_FOUND');

  // PART 20: Generation policy version check (fail-closed for unsupported/inactive).
  const policy = resolveGenerationPolicyVersion(version);
  if (!policy.resolved || !policy.active) {
    return fail('PREVIEW_UNSUPPORTED_GENERATION_POLICY_VERSION', {
      generationPolicyVersion: version.generationPolicyVersion ?? null,
    });
  }

  // currentVersionId exact — guess YOK.
  if (version.programId !== program.id) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
  if (!PREVIEWABLE_STATUSES.includes(program.status) || !PREVIEWABLE_STATUSES.includes(version.status)) {
    return fail('PREVIEW_NOT_PREVIEWABLE');
  }

  let days;
  try {
    days = await programDayRepository.getAllByIndex('by_programVersionId', version.id);
  } catch (e) {
    return fail('PREVIEW_READ_FAILED', { error: String(e) });
  }

  // Count match.
  const total = version.totalPlannedTrainingSessions;
  if (!Number.isInteger(total) || total < 1) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
  if (!Array.isArray(days) || days.length !== total) return fail('PREVIEW_DATA_INTEGRITY_FAILED');

  // Orphan protection + version match.
  for (const d of days) {
    if (d.programVersionId !== version.id) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
  }

  // Duplicate day id.
  const dayIds = new Set();
  for (const d of days) {
    if (dayIds.has(d.id)) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
    dayIds.add(d.id);
  }

  // Ordinals contiguous 1..N (copy sort, mutate YOK).
  const sortedDays = [...days].sort((a, b) => a.trainingOrdinal - b.trainingOrdinal);
  for (let i = 0; i < sortedDays.length; i++) {
    if (sortedDays[i].trainingOrdinal !== i + 1) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
  }

  // Dates ascending (string civil-date compare, source same format).
  for (let i = 1; i < sortedDays.length; i++) {
    if (sortedDays[i].plannedDate < sortedDays[i - 1].plannedDate) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
  }

  // Load blocks per day + integrity.
  const blocksByDay = new Map();
  for (const day of sortedDays) {
    let bs;
    try {
      bs = await workoutBlockRepository.getAllByIndex('by_programDayId', day.id);
    } catch (e) {
      return fail('PREVIEW_READ_FAILED', { error: String(e) });
    }
    if (!Array.isArray(bs) || bs.length === 0) return fail('PREVIEW_MISSING_WORKOUT_BLOCKS');
    // orphan
    for (const b of bs) {
      if (b.programDayId !== day.id) return fail('PREVIEW_DATA_INTEGRITY_FAILED');
      if (!KNOWN_BLOCK_TYPES.has(b.type)) return fail('PREVIEW_UNKNOWN_BLOCK_TYPE');
    }
    // orderIndex contiguous 0-based (copy sort, mutate YOK).
    const ordered = [...bs].sort((a, b) => a.orderIndex - b.orderIndex);
    for (let i = 0; i < ordered.length; i++) {
      if (ordered[i].orderIndex !== i) return fail('PREVIEW_INVALID_BLOCK_ORDER');
    }
    // role/block composition guard (preview-level, formal audit PART 17).
    const types = new Set(ordered.map((b) => b.type));
    if (day.sessionRole === ROLE_BOXING && types.has(WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE)) {
      return fail('PREVIEW_DATA_INTEGRITY_FAILED');
    }
    if (day.sessionRole === ROLE_STRENGTH && (types.has(WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK) || types.has(WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK))) {
      return fail('PREVIEW_DATA_INTEGRITY_FAILED');
    }
    blocksByDay.set(day.id, ordered);
  }

  // Fingerprint recompute from persisted content + compare (silent repair YOK).
  const blueprint = { program, programVersion: version, programDays: sortedDays, workoutBlocks: sortedDays.flatMap((d) => blocksByDay.get(d.id)) };
  const computed = computeBlueprintFingerprint(blueprint, version.generationSeed);
  if (computed !== version.blueprintFingerprint) {
    return fail('PREVIEW_FINGERPRINT_MISMATCH', { computed, expected: version.blueprintFingerprint });
  }

  const viewModel = buildProgramPreviewViewModel({ program, version, sortedDays, blocksByDay });
  return { valid: true, viewModel, blocksByDay };
}