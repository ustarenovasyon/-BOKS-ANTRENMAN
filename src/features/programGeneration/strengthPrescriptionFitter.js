/**
 * STRENGTH PRESCRIPTION FITTER V1 (PART 15)
 * --------------------------------------------------------------
 * Exact sets/reps/hold/rest fitting within PART 12 strength budgets.
 * KG ASLA. Unilateral per-side semantics. Rest >=15s. Exact allocation.
 * planningSecondsPerRep yalnız internal estimate (cadence DEĞİL).
 * --------------------------------------------------------------
 */
import { STRENGTH_EXERCISES } from '@/features/strength/library/strengthExercises';
import { STRENGTH_LATERALITY, STRENGTH_PRESCRIPTION_TYPES } from '@/config/architecture';
import { PRESCRIPTION_TIER_ENVELOPES } from '@/features/progression/progressionConstants';
import { REP_TARGETS, HOLD_TARGETS, PLANNING_SECONDS_PER_REP, MIN_INTERSET_REST_SECONDS } from './programGenerationConstants';

const EX_BY_ID = new Map(STRENGTH_EXERCISES.map((e) => [e.id, e]));
const UNILATERAL_LATERALITIES = new Set([STRENGTH_LATERALITY.UNILATERAL, STRENGTH_LATERALITY.ISOMETRIC_UNILATERAL]);

function isUnilateral(exercise) {
  return UNILATERAL_LATERALITIES.has(exercise.laterality);
}

function estimateWorkSeconds(exercise, setCount, repsOrHold) {
  if (exercise.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS) {
    const sides = isUnilateral(exercise) ? 2 : 1;
    return setCount * repsOrHold * sides * PLANNING_SECONDS_PER_REP;
  }
  const sides = isUnilateral(exercise) ? 2 : 1;
  return setCount * repsOrHold * sides;
}

export function fitStrengthPrescription({ template, tierKey, budgets, generationSeed, trainingOrdinal }) {
  const envelope = PRESCRIPTION_TIER_ENVELOPES[tierKey];
  if (!envelope) return { valid: false, reason: 'PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT' };
  const exercises = template.exerciseIds.map((id) => EX_BY_ID.get(id)).filter(Boolean);
  if (exercises.length !== template.exerciseIds.length) return { valid: false, reason: 'PROGRAM_STRENGTH_VALIDATION_FAILED' };

  const setCountsToTry = [envelope.preferredSetCount, ...envelope.allowedSetCounts.filter((s) => s !== envelope.preferredSetCount)].filter((v, i, a) => a.indexOf(v) === i);
  const repTarget = REP_TARGETS[tierKey];
  const holdTarget = HOLD_TARGETS[tierKey];

  let chosen = null;
  for (const setCount of setCountsToTry) {
    const result = tryFit(exercises, setCount, repTarget, holdTarget, envelope, budgets);
    if (result.valid) { chosen = { setCount, ...result }; break; }
  }
  if (!chosen) return { valid: false, reason: 'PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT' };

  const estimates = exercises.map((ex) => estimateWorkSeconds(ex, chosen.setCount, chosen.perExercise[ex.id].target));
  const totalEst = estimates.reduce((a, b) => a + b, 0);
  const workWindows = allocateExact(estimates, totalEst, budgets.workBudgetSeconds, exercises.length);

  const totalRestEvents = exercises.reduce((a, ex) => a + (chosen.setCount - 1), 0);
  const restValues = allocateRest(budgets.recoveryBudgetSeconds, totalRestEvents, MIN_INTERSET_REST_SECONDS);
  if (!restValues) return { valid: false, reason: 'PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT' };

  const transitionValues = allocateTransition(budgets.transitionBudgetSeconds, exercises.length);

  const prescriptions = exercises.map((ex, i) => {
    const per = chosen.perExercise[ex.id];
    const interSetRest = [];
    for (let s = 0; s < chosen.setCount - 1; s++) interSetRest.push(restValues[i * (chosen.setCount - 1) + s] || 0);
    const pres = {
      exerciseId: ex.id,
      templateId: template.id,
      setCount: chosen.setCount,
      prescriptionType: ex.prescriptionType,
      bothSidesRequired: isUnilateral(ex),
      interSetRestSeconds: interSetRest,
      plannedWorkWindowSeconds: workWindows[i],
      transitionAfterExerciseSeconds: transitionValues[i],
      plannedBlockSeconds: workWindows[i] + interSetRest.reduce((a, b) => a + b, 0) + transitionValues[i],
    };
    if (ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS) {
      if (isUnilateral(ex)) pres.repsPerSide = per.target;
      else pres.repsPerSet = per.target;
    } else {
      if (isUnilateral(ex)) pres.holdSecondsPerSide = per.target;
      else pres.holdSecondsPerSet = per.target;
    }
    return pres;
  });

  return { valid: true, prescriptions };
}

function tryFit(exercises, setCount, repTarget, holdTarget, envelope, budgets) {
  const perExercise = {};
  let totalEst = 0;
  for (const ex of exercises) {
    let target = ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS ? repTarget : holdTarget;
    const min = ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS ? envelope.repRange.min : envelope.holdRangeSeconds.min;
    if (estimateWorkSeconds(ex, setCount, target) > budgets.workBudgetSeconds) target = min;
    perExercise[ex.id] = { target };
    totalEst += estimateWorkSeconds(ex, setCount, target);
  }
  const totalRestEvents = exercises.reduce((a) => a + (setCount - 1), 0);
  if (totalRestEvents > 0 && budgets.recoveryBudgetSeconds / totalRestEvents < MIN_INTERSET_REST_SECONDS) return { valid: false };
  if (totalEst > budgets.workBudgetSeconds) {
    for (const ex of exercises) {
      const cur = perExercise[ex.id].target;
      const min = ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS ? envelope.repRange.min : envelope.holdRangeSeconds.min;
      if (cur > min) {
        totalEst -= estimateWorkSeconds(ex, setCount, cur);
        perExercise[ex.id].target = min;
        totalEst += estimateWorkSeconds(ex, setCount, min);
        if (totalEst <= budgets.workBudgetSeconds) break;
      }
    }
  }
  if (totalEst > budgets.workBudgetSeconds) return { valid: false };
  return { valid: true, perExercise };
}

function allocateExact(weights, totalWeights, budget, n) {
  const result = new Array(n).fill(0);
  if (totalWeights <= 0) {
    const each = Math.floor(budget / n);
    for (let i = 0; i < n; i++) result[i] = each + (i < budget - each * n ? 1 : 0);
    return result;
  }
  for (let i = 0; i < n; i++) {
    result[i] = Math.floor((weights[i] / totalWeights) * budget);
    if (result[i] < weights[i]) result[i] = weights[i];
  }
  let sum = result.reduce((a, b) => a + b, 0);
  let i = 0;
  while (sum < budget) { result[i % n] += 1; sum += 1; i += 1; }
  while (sum > budget) {
    let maxIdx = 0;
    for (let j = 1; j < n; j++) if (result[j] > result[maxIdx]) maxIdx = j;
    if (result[maxIdx] <= weights[maxIdx]) break;
    result[maxIdx] -= 1; sum -= 1;
  }
  return result;
}

function allocateRest(totalRest, events, minRest) {
  if (events === 0) return totalRest === 0 ? [] : null;
  const base = Math.floor(totalRest / events);
  if (base < minRest) return null;
  const result = new Array(events).fill(base);
  let rem = totalRest - base * events;
  let i = 0;
  while (rem > 0) { result[i % events] += 1; rem -= 1; i += 1; }
  return result;
}

function allocateTransition(totalTransition, exerciseCount) {
  const result = new Array(exerciseCount).fill(0);
  if (exerciseCount <= 1) return result;
  const slots = exerciseCount - 1;
  const base = Math.floor(totalTransition / slots);
  for (let i = 0; i < slots; i++) result[i] = base;
  let rem = totalTransition - base * slots;
  let i = 0;
  while (rem > 0) { result[i % slots] += 1; rem -= 1; i += 1; }
  return result;
}
