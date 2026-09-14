/**
 * PROGRESSION PHASE ENGINE (PART 13)
 * --------------------------------------------------------------
 * trainingOrdinal + totalPlannedTrainingSessions → phase.
 * Calendar/tarih bağımsız. Largest-remainder integer allocation.
 * Her ordinal tam 1 phase. Sum(phaseCounts) = total (exact).
 * --------------------------------------------------------------
 */
import { PROGRESSION_PHASES, PROGRAM_DURATION_MONTHS, PROGRESSION_REASON_CODES } from '@/config/architecture';
import { ACTIVE_PHASES, PHASE_WEIGHTS, activePhasesFor } from './progressionConstants';

const RC = PROGRESSION_REASON_CODES;

/**
 * Largest remainder: total → active phase session counts (integer, exact).
 */
export function allocatePhaseSessions(durationMonths, totalSessions) {
  const phases = activePhasesFor(durationMonths);
  if (!phases) return { valid: false, reasons: [RC.PROGRESSION_INVALID_DURATION] };
  if (!Number.isInteger(totalSessions) || totalSessions < 1) {
    return { valid: false, reasons: [RC.PROGRESSION_INVALID_TOTAL_SESSION_COUNT] };
  }
  if (totalSessions < phases.length) {
    return { valid: false, reasons: [RC.PROGRESSION_INSUFFICIENT_SESSION_COUNT] };
  }
  const weights = phases.map((p) => PHASE_WEIGHTS[durationMonths][p]);
  const raw = weights.map((w) => w * totalSessions);
  const counts = raw.map((r) => Math.floor(r));
  let remaining = totalSessions - counts.reduce((a, b) => a + b, 0);
  // fractional remainder, desc; tie → lower index
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  let k = 0;
  while (remaining > 0 && k < order.length) {
    counts[order[k].i] += 1;
    remaining -= 1;
    k += 1;
  }
  // Safety: min 1 per phase (total >= phaseCount guaranteed above).
  let guard = 0;
  while (counts.some((c) => c < 1) && guard < phases.length * 4) {
    const zeroIdx = counts.findIndex((c) => c < 1);
    let maxIdx = 0;
    for (let i = 1; i < counts.length; i++) if (counts[i] > counts[maxIdx]) maxIdx = i;
    if (counts[maxIdx] <= 1) break;
    counts[maxIdx] -= 1;
    counts[zeroIdx] += 1;
    guard += 1;
  }
  if (remaining < 0) {
    // distribute negative remainder by removing from largest
    let g = 0;
    while (remaining < 0 && g < phases.length * 4) {
      let maxIdx = 0;
      for (let i = 1; i < counts.length; i++) if (counts[i] > counts[maxIdx]) maxIdx = i;
      if (counts[maxIdx] <= 1) break;
      counts[maxIdx] -= 1;
      remaining += 1;
      g += 1;
    }
  }
  const sum = counts.reduce((a, b) => a + b, 0);
  if (sum !== totalSessions) {
    counts[counts.length - 1] += totalSessions - sum;
  }
  const phaseCounts = {};
  phases.forEach((p, i) => { phaseCounts[p] = counts[i]; });
  return { valid: true, phases, phaseCounts };
}

/**
 * trainingOrdinal → phase result. ordinal 1-based.
 */
export function resolvePhase(durationMonths, trainingOrdinal, totalSessions) {
  const alloc = allocatePhaseSessions(durationMonths, totalSessions);
  if (!alloc.valid) return { valid: false, reasons: alloc.reasons };
  if (!Number.isInteger(trainingOrdinal) || trainingOrdinal < 1 || trainingOrdinal > totalSessions) {
    return { valid: false, reasons: [RC.PROGRESSION_INVALID_ORDINAL] };
  }
  const { phases, phaseCounts } = alloc;
  let cumulative = 0;
  let phaseId = phases[0];
  let phaseIndex = 0;
  let sessionIndexWithinPhase = 1;
  for (let i = 0; i < phases.length; i++) {
    const start = cumulative + 1;
    const end = cumulative + phaseCounts[phases[i]];
    if (trainingOrdinal >= start && trainingOrdinal <= end) {
      phaseId = phases[i];
      phaseIndex = i;
      sessionIndexWithinPhase = trainingOrdinal - start + 1;
      break;
    }
    cumulative = end;
  }
  const phaseSessionCount = phaseCounts[phaseId];
  const total = totalSessions;
  const normalizedProgramProgress = total > 1 ? (trainingOrdinal - 1) / (total - 1) : 0;
  const normalizedPhaseProgress = phaseSessionCount > 1 ? (sessionIndexWithinPhase - 1) / (phaseSessionCount - 1) : 0;
  return {
    valid: true,
    phase: {
      id: phaseId,
      index: phaseIndex,
      count: phases.length,
      sessionIndexWithinPhase,
      phaseSessionCount,
      normalizedProgramProgress,
      normalizedPhaseProgress,
    },
    phases,
    phaseCounts,
  };
}

/** Self-check: phase weights sum to 1.00; active phase counts match model. */
export function validatePhaseModels() {
  const reasons = [];
  const expectedCounts = { [PROGRAM_DURATION_MONTHS.ONE]: 3, [PROGRAM_DURATION_MONTHS.THREE]: 4, [PROGRAM_DURATION_MONTHS.SIX]: 5 };
  for (const dur of Object.keys(expectedCounts)) {
    const durNum = Number(dur);
    const phases = activePhasesFor(durNum);
    if (!phases || phases.length !== expectedCounts[durNum]) {
      reasons.push(`phase count mismatch dur=${dur}`);
      continue;
    }
    const weights = phases.map((p) => PHASE_WEIGHTS[durNum][p]);
    const sum = weights.reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 1.0) > 1e-9) reasons.push(`weight sum=${sum} dur=${dur}`);
    if (!phases.includes(PROGRESSION_PHASES.CONSOLIDATION)) reasons.push(`missing consolidation dur=${dur}`);
  }
  return { valid: reasons.length === 0, reasons };
}