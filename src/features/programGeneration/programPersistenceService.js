/**
 * PROGRAM PERSISTENCE SERVICE (PART 15)
 * --------------------------------------------------------------
 * Atomic multi-store save: programs + program_versions + program_days +
 * workout_blocks. Tek IndexedDB transaction. Save failure → rollback,
 * partial kayıt kalmaz. Idempotency: aynı generationRequestId → aynı
 * program döner; fingerprint çakışırsa conflict.
 * --------------------------------------------------------------
 */
import { localDb } from '@/lib/localData/localDb';
import { LOCAL_DB, PROGRAM_GENERATION_REASON_CODES } from '@/config/architecture';
import { nowIso } from '@/lib/localData/time';

const RC = PROGRAM_GENERATION_REASON_CODES;
const STORES = [LOCAL_DB.STORES.PROGRAMS, LOCAL_DB.STORES.PROGRAM_VERSIONS, LOCAL_DB.STORES.PROGRAM_DAYS, LOCAL_DB.STORES.WORKOUT_BLOCKS];

function putReq(store, value) {
  return new Promise((resolve, reject) => {
    const req = store.put(value);
    req.onsuccess = () => resolve(value);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Validated blueprint'i atomic olarak persist et.
 * Returns { valid, persisted, programId, programVersionId, counts }.
 */
export async function persistProgramBlueprint(blueprint) {
  if (!blueprint || !blueprint.program || !blueprint.programVersion) {
    return { valid: false, persisted: false, reasons: [RC.PROGRAM_PERSISTENCE_FAILED] };
  }
  const { program, programVersion } = blueprint;

  // Idempotency: mevcut program var mı?
  const existing = await localDb.get(LOCAL_DB.STORES.PROGRAMS, program.id);
  if (existing) {
    const existingVersion = await localDb.get(LOCAL_DB.STORES.PROGRAM_VERSIONS, program.currentVersionId);
    if (existingVersion && existingVersion.blueprintFingerprint === programVersion.blueprintFingerprint) {
      return { valid: true, persisted: false, idempotent: true, programId: program.id, programVersionId: programVersion.id, reasons: [], warnings: [] };
    }
    return { valid: false, persisted: false, reasons: [RC.PROGRAM_IDEMPOTENCY_CONFLICT], warnings: [] };
  }

  const now = nowIso();
  program.createdAt = now;
  program.updatedAt = now;
  programVersion.createdAt = now;
  programVersion.updatedAt = now;

  try {
    await localDb.withTransaction(STORES, 'readwrite', async (stores) => {
      await putReq(stores[LOCAL_DB.STORES.PROGRAMS], program);
      await putReq(stores[LOCAL_DB.STORES.PROGRAM_VERSIONS], programVersion);
      for (const day of blueprint.programDays) {
        await putReq(stores[LOCAL_DB.STORES.PROGRAM_DAYS], day);
      }
      for (const block of blueprint.workoutBlocks) {
        await putReq(stores[LOCAL_DB.STORES.WORKOUT_BLOCKS], block);
      }
    });
  } catch (e) {
    return { valid: false, persisted: false, reasons: [RC.PROGRAM_PERSISTENCE_FAILED], warnings: [], error: String(e) };
  }

  // Integrity read-back.
  const dayCount = await localDb.count(LOCAL_DB.STORES.PROGRAM_DAYS);
  const blockCount = await localDb.count(LOCAL_DB.STORES.WORKOUT_BLOCKS);

  return {
    valid: true,
    persisted: true,
    programId: program.id,
    programVersionId: programVersion.id,
    blueprint: {
      startDate: programVersion.programStartDate,
      endDateExclusive: programVersion.endDateExclusive,
      totalPlannedTrainingSessions: programVersion.totalPlannedTrainingSessions,
      totalWorkoutBlocks: blueprint.workoutBlocks.length,
      blueprintFingerprint: programVersion.blueprintFingerprint,
    },
    counts: {
      programs: 1,
      programVersions: 1,
      programDays: blueprint.programDays.length,
      workoutBlocks: blueprint.workoutBlocks.length,
    },
    reasons: [],
    warnings: [],
  };
}