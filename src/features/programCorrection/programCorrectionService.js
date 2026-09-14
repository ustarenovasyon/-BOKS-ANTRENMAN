/**
 * PROGRAM CORRECTION SERVICE (PART 18)
 * --------------------------------------------------------------
 * correctFailedProgram(programId):
 *   load failed version → verify source fingerprint →
 *   deterministic rebuild with same settings + same calendar + new seed →
 *   validate → atomic persist as NEW ProgramVersion (N+1) →
 *   Program.status = REVIEW_REQUIRED. Source version UNTOUCHED.
 *
 * AI/cloud YOK. Kullanıcı ayarları DEĞİŞMEZ.
 * Old audited version MUTATE EDİLMEZ. Correction = NEW VERSION.
 * Idempotent: aynı (programId, sourceVersionId, sourceAuditId, engineVersion)
 * için duplicate corrected version oluşturmaz.
 * --------------------------------------------------------------
 */
import {
  PROGRAM_STATUS, PROGRAM_CORRECTION_ENGINE_VERSION, LOCAL_DB,
} from '@/config/architecture';
import { generateProgramBlueprint } from '@/features/programGeneration/programGenerationEngine';
import { validateFullProgramBlueprint } from '@/features/programGeneration/programBlueprintValidator';
import { computeBlueprintFingerprint } from '@/features/programGeneration/blueprintFingerprint';
import { stableHash } from '@/features/programGeneration/deterministicSelection';
import { loadExistingAudit } from '@/features/programAudit/programAuditService';
import { loadProgramSnapshot } from '@/features/programAudit/programAuditLoader';
import { PROGRAM_AUDIT_OUTCOMES } from '@/features/programAudit/programAuditConstants';
import { CORRECTION_REASON_CODES } from './programCorrectionConstants';
import {
  programRepository, programVersionRepository,
} from '@/lib/localData/repositories';
import { localDb } from '@/lib/localData/localDb';
import { nowIso } from '@/lib/localData/time';

const RC = CORRECTION_REASON_CODES;
const S = LOCAL_DB.STORES;

function putReq(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve(value);
    req.onerror = () => reject(req.error);
  });
}

function getReq(store, id) {
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deterministic correction key. Same (programId, sourceVersionId, sourceAuditId,
 * correctionEngineVersion) → same key → idempotent.
 */
export function computeCorrectionKey(programId, sourceVersionId, sourceAuditId) {
  return `CORRKEY_${stableHash([programId, sourceVersionId, sourceAuditId, String(PROGRAM_CORRECTION_ENGINE_VERSION)].join('|'))}`;
}

/**
 * Idempotency: existing corrected version for same correctionKey?
 */
async function findExistingCorrection(programId, correctionKey) {
  const versions = await programVersionRepository.getAllByIndex('by_programId', programId);
  return versions.find((v) => v.correctionKey === correctionKey) || null;
}

/**
 * Build generator input from failed version's settingsSnapshot.
 * Same settings; new requestId + new seed for deterministic-but-different rebuild.
 */
function buildCorrectionInput(settings, programId, correctionKey, programStartDate) {
  const requestId = `CORR_${correctionKey}`;
  return {
    programMode: settings.programMode,
    durationMonths: settings.durationMonths,
    daysPerWeek: settings.daysPerWeek,
    selectedWeekdays: [...settings.selectedWeekdays],
    sessionDurationMinutes: settings.sessionDurationMinutes,
    experienceLevel: settings.experienceLevel,
    difficulty: settings.difficulty,
    preferredTrainingTime: settings.preferredTrainingTime || null,
    boxingStance: settings.boxingStance || null,
    boxingMaxMoves: settings.boxingMaxMoves || null,
    strengthDaysPerWeek: settings.strengthDaysPerWeek || 0,
    availableEquipment: [...(settings.availableEquipment || [])],
    // Deterministic: use source version's resolved start date, NOT localCivilDate().
    // Same correction source → same programStartDate → same calendar → same fingerprint.
    generationLocalDate: programStartDate,
    generationRequestId: requestId,
    generationSeed: requestId,
  };
}

/**
 * Main correction entry point.
 * Returns { success, ... } | { success:false, reason, ... }.
 */
export async function correctFailedProgram(programId) {
  // 1. Load program + current failed version
  const program = await programRepository.getById(programId);
  if (!program) return { success: false, reason: RC.CORRECTION_PROGRAM_NOT_FOUND };

  if (program.status !== PROGRAM_STATUS.REVIEW_FAILED) {
    return { success: false, reason: RC.CORRECTION_NOT_REVIEW_FAILED };
  }

  const sourceVersion = await programVersionRepository.getById(program.currentVersionId);
  if (!sourceVersion) return { success: false, reason: RC.CORRECTION_VERSION_NOT_FOUND };

  // 2. Load + verify failed audit
  const sourceAudit = await loadExistingAudit(programId);
  if (!sourceAudit) return { success: false, reason: RC.CORRECTION_AUDIT_NOT_FOUND };
  if (sourceAudit.outcome !== PROGRAM_AUDIT_OUTCOMES.FAIL) {
    return { success: false, reason: RC.CORRECTION_AUDIT_NOT_FAILED };
  }

  // 3. Verify source fingerprint: recomputed == version == audit
  const snap = await loadProgramSnapshot(programId);
  if (!snap.found || !snap.programVersion) {
    return { success: false, reason: RC.CORRECTION_SOURCE_FINGERPRINT_MISMATCH };
  }
  const recomputedFp = computeBlueprintFingerprint(
    { program: snap.program, programVersion: snap.programVersion, programDays: snap.programDays, workoutBlocks: snap.workoutBlocks },
    snap.programVersion.generationSeed,
  );
  if (recomputedFp !== sourceVersion.blueprintFingerprint || sourceVersion.blueprintFingerprint !== sourceAudit.blueprintFingerprint) {
    return { success: false, reason: RC.CORRECTION_SOURCE_FINGERPRINT_MISMATCH };
  }

  // 4. Compute correctionKey + idempotency check
  const correctionKey = computeCorrectionKey(programId, sourceVersion.id, sourceAudit.id);
  const existing = await findExistingCorrection(programId, correctionKey);
  if (existing) {
    return { success: true, idempotent: true, correctedVersionId: existing.id, programId, correctionKey };
  }

  // 5. Deterministic rebuild with same settings + new seed
  const settings = sourceVersion.settingsSnapshot || {};
  const correctionInput = buildCorrectionInput(settings, programId, correctionKey, sourceVersion.programStartDate);
  const gen = generateProgramBlueprint(correctionInput);
  if (!gen.valid) {
    return { success: false, reason: RC.CORRECTION_REBUILD_FAILED, rebuildReasons: gen.reasons };
  }

  // 6. Override: same Program ID, new Version ID, versionNumber N+1, correction metadata
  const blueprint = gen.blueprint;
  const newVersionId = `PRV_CORR_${correctionKey}`;
  const newProgramDayPrefix = `PRD_${newVersionId}`;

  // Override program ID to existing
  blueprint.program.id = program.id;
  blueprint.programVersion.programId = program.id;
  blueprint.programVersion.id = newVersionId;
  blueprint.programVersion.versionNumber = (sourceVersion.versionNumber || 1) + 1;
  blueprint.programVersion.status = PROGRAM_STATUS.REVIEW_REQUIRED;
  blueprint.programVersion.locked = false;

  // Correction metadata (additive, NOT in fingerprint)
  blueprint.programVersion.correctionOfVersionId = sourceVersion.id;
  blueprint.programVersion.correctionSourceAuditId = sourceAudit.id;
  blueprint.programVersion.correctionEngineVersion = PROGRAM_CORRECTION_ENGINE_VERSION;
  blueprint.programVersion.correctionKey = correctionKey;

  // Remap day IDs + version linkage
  const dayIdMap = new Map();
  for (const day of blueprint.programDays) {
    const oldDayId = day.id;
    const newDayId = `${newProgramDayPrefix}_${day.trainingOrdinal}`;
    dayIdMap.set(oldDayId, newDayId);
    day.id = newDayId;
    day.programVersionId = newVersionId;
  }
  // Remap block programDayId
  for (const block of blueprint.workoutBlocks) {
    block.programDayId = dayIdMap.get(block.programDayId) || block.programDayId;
  }

  // 7. Validate corrected blueprint (generator's own validation)
  const validation = validateFullProgramBlueprint(blueprint);
  if (!validation.valid) {
    return { success: false, reason: RC.CORRECTION_VALIDATION_FAILED, validationReasons: validation.reasons };
  }

  // 8. Atomic persistence: Program update + new Version + new Days + new Blocks
  const now = nowIso();
  blueprint.program.updatedAt = now;
  blueprint.program.status = PROGRAM_STATUS.REVIEW_REQUIRED;
  blueprint.program.currentVersionId = newVersionId;
  blueprint.programVersion.createdAt = now;
  blueprint.programVersion.updatedAt = now;

  try {
    await localDb.withTransaction([S.PROGRAMS, S.PROGRAM_VERSIONS, S.PROGRAM_DAYS, S.WORKOUT_BLOCKS], 'readwrite', async (stores) => {
      // Optimistic concurrency: re-read program inside tx
      const curProgram = await getReq(stores[S.PROGRAMS], program.id);
      if (!curProgram || curProgram.currentVersionId !== sourceVersion.id) {
        throw new Error('CORRECTION_PROGRAM_CHANGED');
      }
      if (curProgram.status !== PROGRAM_STATUS.REVIEW_FAILED) {
        throw new Error('CORRECTION_PROGRAM_CHANGED');
      }

      await putReq(stores[S.PROGRAMS], blueprint.program);
      await putReq(stores[S.PROGRAM_VERSIONS], blueprint.programVersion);
      for (const day of blueprint.programDays) {
        await putReq(stores[S.PROGRAM_DAYS], day);
      }
      for (const block of blueprint.workoutBlocks) {
        await putReq(stores[S.WORKOUT_BLOCKS], block);
      }
    });
  } catch (e) {
    const msg = String(e && e.message || e);
    if (msg === 'CORRECTION_PROGRAM_CHANGED') {
      return { success: false, reason: RC.CORRECTION_PERSISTENCE_FAILED };
    }
    return { success: false, reason: RC.CORRECTION_PERSISTENCE_FAILED, error: msg };
  }

  return {
    success: true,
    idempotent: false,
    persisted: true,
    correctedVersionId: newVersionId,
    programId: program.id,
    correctionKey,
    sourceVersionId: sourceVersion.id,
    sourceAuditId: sourceAudit.id,
    newStatus: PROGRAM_STATUS.REVIEW_REQUIRED,
    versionNumber: blueprint.programVersion.versionNumber,
    blueprintFingerprint: blueprint.programVersion.blueprintFingerprint,
  };
}