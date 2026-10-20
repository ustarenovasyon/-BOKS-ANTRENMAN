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

function footworkPrescriptionSignature(block) {
  if (!Object.prototype.hasOwnProperty.call(block, 'footworkPrescription')) return '';
  const actions = block.footworkPrescription?.actions;
  if (!Array.isArray(actions)) return ':FWP[invalid]';
  const actionSig = actions.map((action) => `${action?.phase || ''}>${action?.movementId || ''}`).join(',');
  return `:FWP[${actionSig}]`;
}

export function getBlueprintFingerprintSignature(blueprint, seed) {
  const { programVersion, programDays, workoutBlocks } = blueprint;
  const days = canonicalDays(programDays);
  const blocks = canonicalBlocks(programDays, workoutBlocks);
  const daySig = days
    .map((d) => `${d.trainingOrdinal}|${d.plannedDate}|${d.sessionRole}|${d.phaseId}|${d.progressionFocus}|${d.defenseEligible ? 1 : 0}`)
    .join(';');
  const blockSig = blocks
    .map((b) => `${b.programDayId}:${b.orderIndex}:${b.type}:${b.plannedSeconds}:${b.combinationId || b.defenseRuleId || b.exerciseId || b.templateId || b.footworkMoveId || ''}${footworkPrescriptionSignature(b)}`)
    .join(';');
  const sig = [seed, programVersion.programStartDate, programVersion.endDateExclusive, programVersion.totalPlannedTrainingSessions, daySig, blockSig].join('||');
  return { sig, seed, startDate: programVersion.programStartDate, endDate: programVersion.endDateExclusive, total: programVersion.totalPlannedTrainingSessions, daySig, blockSig, daysOrder: days.map((d) => d.trainingOrdinal), blocksOrder: blocks.map((b) => `${b.programDayId}:${b.orderIndex}:${b.type}`) };
}

export function stableObjectString(value) {
  if(value === undefined)return 'undefined';
  if(value === null || typeof value !== 'object')return JSON.stringify(value);
  if(Array.isArray(value))return '['+value.map(stableObjectString).join(',')+']';
  return '{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+stableObjectString(value[key])).join(',')+'}';
}
export function computeBlueprintFingerprint(blueprint, seed) {
  if(blueprint.programVersion.generationPolicyVersion===2) {
    const {programVersion:v,programDays,workoutBlocks}=blueprint;
    const signature={seed,policy:2,settings:v.settingsSnapshot,engineVersions:v.engineVersions,start:v.programStartDate,end:v.endDateExclusive,total:v.totalPlannedTrainingSessions,days:canonicalDays(programDays),blocks:canonicalBlocks(programDays,workoutBlocks)};
    return `FP_${stableHash(stableObjectString(signature)).toString(16)}`;
  }
  const { sig } = getBlueprintFingerprintSignature(blueprint, seed);
  return `FP_${stableHash(sig).toString(16)}`;
}