/**
 * BLUEPRINT FINGERPRINT (PART 15 / PART 16)
 * --------------------------------------------------------------
 * Tek canonical fingerprint implementation. Hem generator (PART 15)
 * hem Preview integrity recompute (PART 16) burayı kullanır.
 * Duplicate hash implementation YOK.
 * --------------------------------------------------------------
 */
import { stableHash } from './deterministicSelection';

/**
 * Blueprint fingerprint: seed + start + end + total + daySig + blockSig.
 * Timestamp/createdAt hariç — yalnız plan içeriği.
 *
 * Canonical normalization: programDays sorted by trainingOrdinal ASC,
 * workoutBlocks sorted by (day trainingOrdinal ASC, orderIndex ASC).
 * Raw IndexedDB return order'a güvenilmez.
 */
function canonicalDays(programDays) {
  return [...programDays].sort((a, b) => (a.trainingOrdinal || 0) - (b.trainingOrdinal || 0));
}

function canonicalBlocks(programDays, workoutBlocks) {
  const dayOrdinal = new Map();
  for (const d of programDays) dayOrdinal.set(d.id, d.trainingOrdinal || 0);
  return [...workoutBlocks].sort((a, b) => {
    const ao = dayOrdinal.get(a.programDayId) ?? 0;
    const bo = dayOrdinal.get(b.programDayId) ?? 0;
    if (ao !== bo) return ao - bo;
    return (a.orderIndex || 0) - (b.orderIndex || 0);
  });
}

export function getBlueprintFingerprintSignature(blueprint, seed) {
  const { programVersion, programDays, workoutBlocks } = blueprint;
  const days = canonicalDays(programDays);
  const blocks = canonicalBlocks(programDays, workoutBlocks);
  const daySig = days
    .map((d) => `${d.trainingOrdinal}|${d.plannedDate}|${d.sessionRole}|${d.phaseId}|${d.progressionFocus}|${d.defenseEligible ? 1 : 0}`)
    .join(';');
  const blockSig = blocks
    .map((b) => `${b.programDayId}:${b.orderIndex}:${b.type}:${b.plannedSeconds}:${b.combinationId || b.defenseRuleId || b.exerciseId || b.templateId || ''}`)
    .join(';');
  const sig = [seed, programVersion.programStartDate, programVersion.endDateExclusive, programVersion.totalPlannedTrainingSessions, daySig, blockSig].join('||');
  return { sig, seed, startDate: programVersion.programStartDate, endDate: programVersion.endDateExclusive, total: programVersion.totalPlannedTrainingSessions, daySig, blockSig, daysOrder: days.map((d) => d.trainingOrdinal), blocksOrder: blocks.map((b) => `${b.programDayId}:${b.orderIndex}:${b.type}`) };
}

export function computeBlueprintFingerprint(blueprint, seed) {
  const { sig } = getBlueprintFingerprintSignature(blueprint, seed);
  return `FP_${stableHash(sig).toString(16)}`;
}