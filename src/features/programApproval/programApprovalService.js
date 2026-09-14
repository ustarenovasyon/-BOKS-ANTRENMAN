/**
 * PROGRAM APPROVAL SERVICE (PART 18)
 * --------------------------------------------------------------
 * approveProgram(programId):
 *   load current → verify READY_FOR_APPROVAL + locked=false →
 *   verify matching PASS audit (same versionId + fingerprint + engine) →
 *   recompute fingerprint guard → atomic lock + ACTIVE.
 *
 * Blueprint'i MUTATE ETMEZ. ProgramDays/WorkoutBlocks değişmez.
 * Yalnız lifecycle/approval metadata değişir.
 * Idempotent: zaten ACTIVE+locked ise ALREADY_ACTIVE döner.
 * --------------------------------------------------------------
 */
import {
  PROGRAM_STATUS, PROGRAM_APPROVAL_ENGINE_VERSION, LOCAL_DB,
} from '@/config/architecture';
import { computeBlueprintFingerprint } from '@/features/programGeneration/blueprintFingerprint';
import { loadExistingAudit } from '@/features/programAudit/programAuditService';
import { loadProgramSnapshot } from '@/features/programAudit/programAuditLoader';
import { PROGRAM_AUDIT_OUTCOMES, LOCAL_PROGRAM_AUDIT_ENGINE_VERSION } from '@/features/programAudit/programAuditConstants';
import { APPROVAL_REASON_CODES } from './programApprovalConstants';
import { programRepository, programVersionRepository } from '@/lib/localData/repositories';
import { localDb } from '@/lib/localData/localDb';
import { nowIso } from '@/lib/localData/time';

const RC = APPROVAL_REASON_CODES;
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
 * Main approval entry point.
 * Returns { success, ... } | { success:false, reason, ... }.
 */
export async function approveProgram(programId) {
  // 1. Load program + current version
  const program = await programRepository.getById(programId);
  if (!program) return { success: false, reason: RC.APPROVAL_PROGRAM_NOT_FOUND };

  const version = await programVersionRepository.getById(program.currentVersionId);
  if (!version) return { success: false, reason: RC.APPROVAL_VERSION_NOT_FOUND };

  // 2. Idempotency: already ACTIVE + locked → ALREADY_ACTIVE
  if (program.status === PROGRAM_STATUS.ACTIVE && version.locked === true && version.status === PROGRAM_STATUS.ACTIVE) {
    return { success: true, idempotent: true, alreadyActive: true, programId, versionId: version.id };
  }

  // 3. Precondition: READY_FOR_APPROVAL
  if (program.status !== PROGRAM_STATUS.READY_FOR_APPROVAL) {
    return { success: false, reason: RC.APPROVAL_NOT_READY };
  }
  if (version.status !== PROGRAM_STATUS.READY_FOR_APPROVAL) {
    return { success: false, reason: RC.APPROVAL_NOT_READY };
  }
  if (version.locked === true) {
    return { success: false, reason: RC.APPROVAL_VERSION_LOCKED };
  }
  if (program.currentVersionId !== version.id) {
    return { success: false, reason: RC.APPROVAL_VERSION_MISMATCH };
  }

  // 4. Matching PASS audit verification
  const audit = await loadExistingAudit(programId);
  if (!audit) return { success: false, reason: RC.APPROVAL_AUDIT_NOT_FOUND };
  if (audit.outcome !== PROGRAM_AUDIT_OUTCOMES.PASS) {
    return { success: false, reason: RC.APPROVAL_AUDIT_NOT_PASS };
  }
  if (audit.auditEngineVersion !== LOCAL_PROGRAM_AUDIT_ENGINE_VERSION) {
    return { success: false, reason: RC.APPROVAL_AUDIT_ENGINE_MISMATCH };
  }
  if (audit.programVersionId !== version.id) {
    return { success: false, reason: RC.APPROVAL_AUDIT_VERSION_MISMATCH };
  }
  if (audit.blueprintFingerprint !== version.blueprintFingerprint) {
    return { success: false, reason: RC.APPROVAL_AUDIT_FINGERPRINT_MISMATCH };
  }

  // 5. Fingerprint guard: recompute from persisted content
  const snap = await loadProgramSnapshot(programId);
  if (!snap.found || !snap.programVersion) {
    return { success: false, reason: RC.APPROVAL_FINGERPRINT_MISMATCH };
  }
  const computedFp = computeBlueprintFingerprint(
    { program: snap.program, programVersion: snap.programVersion, programDays: snap.programDays, workoutBlocks: snap.workoutBlocks },
    snap.programVersion.generationSeed,
  );
  if (computedFp !== version.blueprintFingerprint || computedFp !== audit.blueprintFingerprint) {
    return { success: false, reason: RC.APPROVAL_FINGERPRINT_MISMATCH };
  }

  // 6. Atomic approval transaction: ACTIVE + locked + metadata
  const now = nowIso();
  const approvedAuditId = audit.id;
  const approvedBlueprintFingerprint = version.blueprintFingerprint;

  try {
    await localDb.withTransaction([S.PROGRAMS, S.PROGRAM_VERSIONS], 'readwrite', async (stores) => {
      // Optimistic concurrency: re-read inside tx
      const curProgram = await getReq(stores[S.PROGRAMS], program.id);
      const curVersion = await getReq(stores[S.PROGRAM_VERSIONS], version.id);
      if (!curProgram || !curVersion) throw new Error('APPROVAL_PROGRAM_CHANGED');
      if (curProgram.currentVersionId !== version.id) throw new Error('APPROVAL_PROGRAM_CHANGED');
      if (curProgram.status !== PROGRAM_STATUS.READY_FOR_APPROVAL || curVersion.status !== PROGRAM_STATUS.READY_FOR_APPROVAL) {
        throw new Error('APPROVAL_PROGRAM_CHANGED');
      }
      if (curVersion.locked === true) throw new Error('APPROVAL_PROGRAM_CHANGED');

      curProgram.status = PROGRAM_STATUS.ACTIVE;
      curProgram.updatedAt = now;
      curProgram.approvedAt = now;
      curProgram.activatedAt = now;
      curProgram.approvedAuditId = approvedAuditId;
      curProgram.approvedBlueprintFingerprint = approvedBlueprintFingerprint;
      curProgram.approvalEngineVersion = PROGRAM_APPROVAL_ENGINE_VERSION;
      await putReq(stores[S.PROGRAMS], curProgram);

      curVersion.status = PROGRAM_STATUS.ACTIVE;
      curVersion.locked = true;
      curVersion.updatedAt = now;
      curVersion.approvedAt = now;
      curVersion.activatedAt = now;
      curVersion.approvedAuditId = approvedAuditId;
      curVersion.approvedBlueprintFingerprint = approvedBlueprintFingerprint;
      curVersion.approvalEngineVersion = PROGRAM_APPROVAL_ENGINE_VERSION;
      await putReq(stores[S.PROGRAM_VERSIONS], curVersion);
    });
  } catch (e) {
    const msg = String(e && e.message || e);
    if (msg === 'APPROVAL_PROGRAM_CHANGED') {
      return { success: false, reason: RC.APPROVAL_NOT_READY };
    }
    return { success: false, reason: RC.APPROVAL_TRANSACTION_FAILED, error: msg };
  }

  return {
    success: true,
    idempotent: false,
    programId: program.id,
    versionId: version.id,
    status: PROGRAM_STATUS.ACTIVE,
    locked: true,
    approvedAuditId,
    approvedBlueprintFingerprint,
  };
}