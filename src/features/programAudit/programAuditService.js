/**
 * PROGRAM AUDIT SERVICE (PART 17)
 * --------------------------------------------------------------
 * runProgramAudit(programId): load → pre-fingerprint → pure audit →
 * post-fingerprint mutation check → idempotency → atomic persist +
 * status transition. Engine error → status değişmez.
 * Generator ÇAĞRILMAZ. Offline. Atomic transaction.
 * --------------------------------------------------------------
 */
import { LOCAL_PROGRAM_AUDIT_ENGINE_VERSION, PROGRAM_AUDIT_OUTCOMES, AUDIT_REASON_CODES } from './programAuditConstants';
import { loadProgramSnapshot } from './programAuditLoader';
import { auditProgramSnapshot } from './programAuditEngine';
import { computeBlueprintFingerprint } from '@/features/programGeneration/blueprintFingerprint';
import { stableHash } from '@/features/programGeneration/deterministicSelection';
import { programAuditRepository } from '@/lib/localData/repositories';
import { localDb } from '@/lib/localData/localDb';
import { nowIso } from '@/lib/localData/time';
import { PROGRAM_STATUS, LOCAL_DB } from '@/config/architecture';

const S = LOCAL_DB.STORES;

export function computeAuditId(programVersion) {
  if (!programVersion) return null;
  return `AUD_${stableHash([programVersion.id, programVersion.blueprintFingerprint, String(LOCAL_PROGRAM_AUDIT_ENGINE_VERSION)].join('|'))}`;
}

/** Idempotent: aynı version+fingerprint+engine → same auditId. */
export async function loadExistingAudit(programId) {
  const snap = await loadProgramSnapshot(programId);
  if (!snap.found || !snap.programVersion) return null;
  const auditId = computeAuditId(snap.programVersion);
  const existing = await programAuditRepository.getById(auditId);
  return existing || null;
}

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
 * Orchestration. Returns { success, outcome, ... }.
 * success=false → engine technical error (status mutate EDİLMEZ).
 */
export async function runProgramAudit(programId) {
  const snap = await loadProgramSnapshot(programId);
  if (!snap.found) return { success: false, outcome: null, reason: snap.reason || AUDIT_REASON_CODES.AUDIT_PROGRAM_NOT_FOUND };
  if (!snap.programVersion) return { success: false, outcome: null, reason: AUDIT_REASON_CODES.AUDIT_VERSION_NOT_FOUND };

  const { program, programVersion, programDays, workoutBlocks } = snap;
  const auditId = computeAuditId(programVersion);

  // Idempotent: existing audit for same identity → return, no write.
  const existing = await programAuditRepository.getById(auditId);
  if (existing) return { success: true, idempotent: true, auditId, ...existing, programId, programVersionId: programVersion.id };

  // Pre-fingerprint: loaded snapshot must match persisted fingerprint.
  // beforeFp !== persistedFp → input mismatch (persistence/read-back issue),
  // NOT a mutation. Audit engine'i başlatma, status mutate etme.
  const beforeFp = computeBlueprintFingerprint({ program, programVersion, programDays, workoutBlocks }, programVersion.generationSeed);
  if (beforeFp !== programVersion.blueprintFingerprint) {
    return { success: false, outcome: null, reason: AUDIT_REASON_CODES.AUDIT_INPUT_FINGERPRINT_MISMATCH, programId, programVersionId: programVersion.id, beforeFp, persistedFp: programVersion.blueprintFingerprint };
  }

  // Pure audit (engine error → no status change)
  let result;
  try {
    result = auditProgramSnapshot({ program, programVersion, programDays, workoutBlocks });
  } catch (e) {
    return { success: false, outcome: null, reason: AUDIT_REASON_CODES.AUDIT_ENGINE_ERROR, error: String(e), programId, programVersionId: programVersion.id };
  }

  // Post-fingerprint mutation check:
  // afterFp !== beforeFp → audit engine mutated the snapshot.
  const afterFp = computeBlueprintFingerprint({ program, programVersion, programDays, workoutBlocks }, programVersion.generationSeed);
  if (afterFp !== beforeFp) {
    return { success: false, outcome: null, reason: AUDIT_REASON_CODES.AUDIT_MUTATED_BLUEPRINT, programId, programVersionId: programVersion.id, beforeFp, afterFp };
  }

  const outcome = result.outcome;
  const now = nowIso();
  const auditRecord = {
    id: auditId,
    programId: program.id,
    programVersionId: programVersion.id,
    auditEngineVersion: LOCAL_PROGRAM_AUDIT_ENGINE_VERSION,
    blueprintFingerprint: programVersion.blueprintFingerprint,
    outcome,
    criticalIssueCount: result.criticalIssueCount,
    warningCount: result.warningCount,
    findings: result.findings,
    checkSummary: result.checkSummary,
    auditFingerprint: result.auditFingerprint,
    engineVersionsSnapshot: programVersion.engineVersions || {},
    createdAt: now,
    completedAt: now,
  };

  // Sadece REVIEW_REQUIRED flow'da status transition yap.
  if (program.status !== PROGRAM_STATUS.REVIEW_REQUIRED) {
    // ACTIVE/PAUSED/COMPLETED → status değiştirme; audit result'u döndür.
    return { success: true, idempotent: false, persisted: false, statusUnchanged: true, auditId, ...result, programId, programVersionId: programVersion.id };
  }

  const newStatus = outcome === PROGRAM_AUDIT_OUTCOMES.PASS ? PROGRAM_STATUS.READY_FOR_APPROVAL : PROGRAM_STATUS.REVIEW_FAILED;

  try {
    await localDb.withTransaction([S.PROGRAM_AUDITS, S.PROGRAMS, S.PROGRAM_VERSIONS], 'readwrite', async (stores) => {
      // Optimistic concurrency: re-read inside tx.
      const curProgram = await getReq(stores[S.PROGRAMS], program.id);
      const curVersion = await getReq(stores[S.PROGRAM_VERSIONS], programVersion.id);
      if (!curProgram || curProgram.currentVersionId !== programVersion.id) throw new Error(AUDIT_REASON_CODES.AUDIT_PROGRAM_CHANGED_DURING_AUDIT);
      if (!curVersion || curVersion.blueprintFingerprint !== programVersion.blueprintFingerprint) throw new Error(AUDIT_REASON_CODES.AUDIT_PROGRAM_CHANGED_DURING_AUDIT);

      await putReq(stores[S.PROGRAM_AUDITS], auditRecord);
      curProgram.status = newStatus;
      curProgram.updatedAt = now;
      await putReq(stores[S.PROGRAMS], curProgram);
      curVersion.status = newStatus;
      curVersion.updatedAt = now;
      await putReq(stores[S.PROGRAM_VERSIONS], curVersion);
    });
  } catch (e) {
    const msg = String(e && e.message || e);
    if (msg === AUDIT_REASON_CODES.AUDIT_PROGRAM_CHANGED_DURING_AUDIT) {
      return { success: false, outcome: null, reason: AUDIT_REASON_CODES.AUDIT_PROGRAM_CHANGED_DURING_AUDIT, programId, programVersionId: programVersion.id };
    }
    return { success: false, outcome: null, reason: AUDIT_REASON_CODES.AUDIT_ENGINE_ERROR, error: msg, programId, programVersionId: programVersion.id };
  }

  return { success: true, idempotent: false, persisted: true, auditId, newStatus, ...result, programId, programVersionId: programVersion.id };
}