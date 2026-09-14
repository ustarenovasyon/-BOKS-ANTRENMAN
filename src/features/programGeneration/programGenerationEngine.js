/**
 * FULL PROGRAM GENERATION ENGINE V1 (PART 15)
 * --------------------------------------------------------------
 * Pure/deterministic blueprint generation. AI/random/Date.now YOK.
 * Tüm program önceden üretilir. Status REVIEW_REQUIRED.
 * Canonical content only. Kg YOK. Pipeline sırası PART 15.29.
 * --------------------------------------------------------------
 */
import {
  PROGRAM_MODES, PROGRAM_DURATION_MONTHS, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS,
  WEEKDAYS, WEEKLY_SESSION_ROLES, WEEKLY_PROGRESSION_FOCUS, PROGRAM_STATUS,
  FULL_PROGRAM_GENERATOR_VERSION, STRENGTH_PRESCRIPTION_FITTER_VERSION,
  BOXING_MOVE_LIBRARY_VERSION, STRENGTH_EXERCISE_LIBRARY_VERSION, BOXING_TECHNICAL_CONSTITUTION_VERSION,
  BOXING_TRANSITION_MATRIX_VERSION, BOXING_COMBINATION_LIBRARY_VERSION, BOXING_DEFENSE_COUNTER_LIBRARY_VERSION,
  STRENGTH_TECHNICAL_CONSTITUTION_VERSION, STRENGTH_TEMPLATE_LIBRARY_VERSION, SESSION_TIME_BUDGET_ENGINE_VERSION,
  PROGRAM_PROGRESSION_ENGINE_VERSION, WEEKLY_BALANCING_ENGINE_VERSION, LOCAL_DB,
  PROGRAM_GENERATION_REASON_CODES, CURRENT_GENERATION_POLICY_VERSION,
} from '@/config/architecture';
import { resolveProgramStartDate, addCalendarMonthsClamped, buildScheduledDates, weekdayIndex } from './programCalendarEngine';
import { computeBlueprintFingerprint } from './blueprintFingerprint';
import { buildSessionTimeBudget } from '@/features/sessionBudget/sessionTimeBudgetEngine';
import { buildBoxingIntervalBudget } from '@/features/sessionBudget/boxingIntervalBudget';
import { buildProgramProgression } from '@/features/progression/progressionEngine';
import { planWeeklyRoles } from '@/features/weeklyBalance/weeklyRolePlanner';
import { pickFocus, applyProgressionFocusBalance } from '@/features/weeklyBalance/progressionFocusBalancer';
import { WEEKDAY_INDEX, ROLE_BUDGET_MODE } from '@/features/weeklyBalance/weeklyBalanceConstants';
import { selectBoxingRounds } from './boxingContentSelector';
import { selectDefenseRule, planMixedDefenseSlots } from './defenseContentSelector';
import { selectStrengthTemplate } from './strengthTemplateSelector';
import { fitStrengthPrescription } from './strengthPrescriptionFitter';
import { buildDayBlocks } from './workoutBlockBuilder';
import { validateFullProgramBlueprint } from './programBlueprintValidator';

const RC = PROGRAM_GENERATION_REASON_CODES;

function validateInput(input) {
  const reasons = [];
  if (!Object.values(PROGRAM_MODES).includes(input.programMode)) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  if (![1, 3, 6].includes(input.durationMonths)) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  if (!Object.values(EXPERIENCE_LEVELS).includes(input.experienceLevel)) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  if (!Object.values(DIFFICULTY_LEVELS).includes(input.difficulty)) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  if (!Array.isArray(input.selectedWeekdays) || input.selectedWeekdays.length === 0) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  else {
    const valid = new Set(WEEKDAYS);
    const seen = new Set();
    for (const d of input.selectedWeekdays) {
      if (!valid.has(d) || seen.has(d)) { reasons.push(RC.PROGRAM_INVALID_SETTINGS); break; }
      seen.add(d);
    }
  }
  if (!Number.isInteger(input.daysPerWeek) || input.daysPerWeek !== input.selectedWeekdays.length) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  if (input.programMode === PROGRAM_MODES.BOXING_AND_STRENGTH) {
    if (!Number.isInteger(input.strengthDaysPerWeek) || input.strengthDaysPerWeek < 1 || input.strengthDaysPerWeek > input.daysPerWeek) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
    if (!Array.isArray(input.availableEquipment) || input.availableEquipment.length === 0) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  }
  if (input.programMode !== PROGRAM_MODES.STRENGTH_ONLY) {
    if (![4, 6, 8, 10].includes(input.boxingMaxMoves)) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  }
  if (!input.generationLocalDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.generationLocalDate)) reasons.push(RC.PROGRAM_INVALID_GENERATION_DATE);
  if (!input.generationSeed || !input.generationRequestId) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  if (!Number.isInteger(input.sessionDurationMinutes) || input.sessionDurationMinutes < 10 || input.sessionDurationMinutes > 120) reasons.push(RC.PROGRAM_INVALID_SETTINGS);
  return { valid: reasons.length === 0, reasons };
}

function buildSettingsSnapshot(input) {
  return {
    programMode: input.programMode,
    durationMonths: input.durationMonths,
    daysPerWeek: input.daysPerWeek,
    selectedWeekdays: [...input.selectedWeekdays],
    sessionDurationMinutes: input.sessionDurationMinutes,
    experienceLevel: input.experienceLevel,
    difficulty: input.difficulty,
    preferredTrainingTime: input.preferredTrainingTime || null,
    boxingStance: input.boxingStance || null,
    boxingMaxMoves: input.boxingMaxMoves || null,
    strengthDaysPerWeek: input.programMode === PROGRAM_MODES.BOXING_AND_STRENGTH ? input.strengthDaysPerWeek : (input.programMode === PROGRAM_MODES.STRENGTH_ONLY ? input.daysPerWeek : 0),
    availableEquipment: [...(input.availableEquipment || [])],
  };
}

function buildEngineVersions() {
  return {
    dbSchemaVersion: LOCAL_DB.VERSION,
    boxingMoveLibraryVersion: BOXING_MOVE_LIBRARY_VERSION,
    strengthExerciseLibraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION,
    boxingTechnicalConstitutionVersion: BOXING_TECHNICAL_CONSTITUTION_VERSION,
    boxingTransitionMatrixVersion: BOXING_TRANSITION_MATRIX_VERSION,
    boxingCombinationLibraryVersion: BOXING_COMBINATION_LIBRARY_VERSION,
    boxingDefenseCounterLibraryVersion: BOXING_DEFENSE_COUNTER_LIBRARY_VERSION,
    strengthTechnicalConstitutionVersion: STRENGTH_TECHNICAL_CONSTITUTION_VERSION,
    strengthTemplateLibraryVersion: STRENGTH_TEMPLATE_LIBRARY_VERSION,
    sessionTimeBudgetEngineVersion: SESSION_TIME_BUDGET_ENGINE_VERSION,
    programProgressionEngineVersion: PROGRAM_PROGRESSION_ENGINE_VERSION,
    weeklyBalancingEngineVersion: WEEKLY_BALANCING_ENGINE_VERSION,
    strengthPrescriptionFitterVersion: STRENGTH_PRESCRIPTION_FITTER_VERSION,
    fullProgramGeneratorVersion: FULL_PROGRAM_GENERATOR_VERSION,
  };
}

/**
 * Pure blueprint generation. No persistence, no Date.now().
 */
export function generateProgramBlueprint(input = {}) {
  const v = validateInput(input);
  if (!v.valid) return { valid: false, reasons: v.reasons, warnings: [], blueprint: null };

  const settings = buildSettingsSnapshot(input);
  const engineVersions = buildEngineVersions();
  const selectedWeekdayIndices = settings.selectedWeekdays.map((w) => WEEKDAY_INDEX[w]);
  const programStartDate = resolveProgramStartDate(input.generationLocalDate, selectedWeekdayIndices);
  const endDateExclusive = addCalendarMonthsClamped(programStartDate, settings.durationMonths);
  const scheduledDates = buildScheduledDates(programStartDate, endDateExclusive, selectedWeekdayIndices);
  if (scheduledDates.length === 0) return { valid: false, reasons: [RC.PROGRAM_NO_SCHEDULED_DAYS], warnings: [], blueprint: null };
  const total = scheduledDates.length;

  const programId = `PRG_${input.generationRequestId}`;
  const programVersionId = `PRV_${input.generationRequestId}`;

  // Group by program week.
  const weeks = new Map();
  for (const sd of scheduledDates) {
    if (!weeks.has(sd.programWeekIndex)) weeks.set(sd.programWeekIndex, []);
    weeks.get(sd.programWeekIndex).push(sd);
  }

  const hasBoxing = settings.programMode !== PROGRAM_MODES.STRENGTH_ONLY;
  const hasStrength = settings.programMode !== PROGRAM_MODES.BOXING_ONLY;

  // Pass 1: per-day budget + progression + defense level.
  const dayContext = []; // {sd, role, budget, progression, defenseLevel}
  let defenseExposureCounter = 0;
  for (const [weekIdx, weekDates] of weeks) {
    const roles = planWeeklyRoles(settings.programMode, settings.selectedWeekdays, settings.strengthDaysPerWeek);
    for (const sd of weekDates) {
      const role = roles[sd.weekdayIndex].sessionRole;
      const budgetMode = ROLE_BUDGET_MODE[role];
      const budget = buildSessionTimeBudget({ programMode: budgetMode, sessionDurationMinutes: settings.sessionDurationMinutes, experienceLevel: settings.experienceLevel, difficulty: settings.difficulty });
      if (!budget.valid) return { valid: false, reasons: [RC.PROGRAM_DAY_TIME_MISMATCH], warnings: [], blueprint: null };
      const progression = buildProgramProgression({
        durationMonths: settings.durationMonths, programMode: settings.programMode,
        experienceLevel: settings.experienceLevel, difficulty: settings.difficulty,
        trainingOrdinal: 0, totalPlannedTrainingSessions: total, userBoxingMaxMoves: settings.boxingMaxMoves, sessionBudget: budget,
      });
      // We'll set ordinal properly per day; recompute progression with real ordinal below.
      dayContext.push({ sd, role, budget, progression: null, defenseLevel: 'none', weekIdx });
    }
  }

  // Assign ordinals by date order.
  dayContext.sort((a, b) => a.sd.date < b.sd.date ? -1 : 1);
  for (let i = 0; i < dayContext.length; i++) {
    const dc = dayContext[i];
    dc.ordinal = i + 1;
    dc.progression = buildProgramProgression({
      durationMonths: settings.durationMonths, programMode: settings.programMode,
      experienceLevel: settings.experienceLevel, difficulty: settings.difficulty,
      trainingOrdinal: dc.ordinal, totalPlannedTrainingSessions: total,
      userBoxingMaxMoves: settings.boxingMaxMoves, sessionBudget: dc.budget,
    });
    if (!dc.progression.valid) return { valid: false, reasons: [RC.PROGRAM_PROGRESSION_FAILED], warnings: [], blueprint: null };
    dc.defenseLevel = hasBoxing && dc.progression.result.boxingProgression ? dc.progression.result.boxingProgression.defenseExposureLevel : 'none';
    // rebuild boxing budget with progression-aware work override later in pass 2.
  }

  // Pass 2: per-week mixed defense planning.
  // Re-group by weekIdx preserving order.
  const weekList = [...weeks.keys()].sort((a, b) => a - b);
  for (const wk of weekList) {
    const weekDays = dayContext.filter((dc) => dc.weekIdx === wk);
    const perDayLevels = weekDays.map((dc) => ({
      weekdayIndex: dc.sd.weekdayIndex,
      role: dc.role,
      level: dc.defenseLevel,
    })).filter((s) => s.role === WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY || s.role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY);
    const defenseSet = planMixedDefenseSlots(perDayLevels, wk);
    for (const dc of weekDays) {
      dc.defenseEligible = defenseSet.has(dc.sd.weekdayIndex);
    }
  }

  // Pass 3: content + blocks.
  const programDays = [];
  const workoutBlocks = [];
  const previousPrimaryIds = [];
  const previousTemplateIds = [];
  const programUsageCount = {};
  const scheduledSlotIndexByWeek = new Map();

  for (const dc of dayContext) {
    const role = dc.role;
    const slotIndex = (scheduledSlotIndexByWeek.get(dc.weekIdx) || 0);
    scheduledSlotIndexByWeek.set(dc.weekIdx, slotIndex + 1);
    const focus = pickFocus(role, dc.weekIdx, slotIndex, dc.defenseEligible);
    const balancedCaps = applyProgressionFocusBalance(dc.progression, role, focus);
    if (!balancedCaps) return { valid: false, reasons: [RC.PROGRAM_PROGRESSION_FAILED], warnings: [], blueprint: null };

    let boxingRounds = null;
    let defenseRound = null;
    if (hasBoxing && (role === WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY || role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY)) {
      const ceiling = balancedCaps.boxingComplexityCap;
      const workOverride = balancedCaps.boxingWorkCapSeconds;
      const boxingBudget = buildBoxingIntervalBudget(dc.budget.blocks.boxingSeconds, settings.experienceLevel, settings.difficulty, { workSecondsOverride: workOverride });
      const sel = selectBoxingRounds({ boxingBudget, effectiveComboCeiling: ceiling, userBoxingMaxMoves: settings.boxingMaxMoves, focus, generationSeed: input.generationSeed, trainingOrdinal: dc.ordinal, previousPrimaryIds, programUsageCount });
      if (!sel.valid) return { valid: false, reasons: [RC.PROGRAM_NO_ELIGIBLE_BOXING_COMBINATION], warnings: [], blueprint: null };
      boxingRounds = sel.rounds;
      previousPrimaryIds.push(sel.primaryCombinationId);
      for (const r of sel.rounds) {
        programUsageCount[r.combinationId] = (programUsageCount[r.combinationId] || 0) + 1;
      }
      // defense round
      if (dc.defenseEligible) {
        const workCount = boxingBudget.intervalSegments.filter((s) => s.type === 'work').length;
        const defenseRoundIndex = workCount >= 2 ? 1 : 0;
        const rule = selectDefenseRule(defenseExposureCounter);
        defenseExposureCounter += 1;
        defenseRound = { ...rule, roundIndex: defenseRoundIndex, plannedSeconds: 0 };
      }
      // attach boxingBudget to day budget for block builder
      dc.budget = { ...dc.budget, boxingBudget };
    }

    let strengthPrescriptions = null;
    if (hasStrength && (role === WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY || role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY)) {
      const eligible = dc.budget.strengthBudget.eligibleMovementCounts;
      const movementCap = balancedCaps.strengthMovementCap;
      const tierCap = balancedCaps.strengthTierCap;

      // ADAPTIVE FIT: try movement counts from cap down to minimum eligible.
      // If preferred movement count doesn't fit, try lower eligible counts.
      const tryCaps = [...new Set(eligible)].sort((a, b) => a - b).filter((c) => c <= movementCap).reverse();
      if (tryCaps.length === 0) tryCaps.push(movementCap);

      let fitted = false;
      let anyTemplateFound = false;
      let lastSelectReason = null;
      for (const tryCap of tryCaps) {
        const sel = selectStrengthTemplate({ eligibleMovementCounts: eligible, availableEquipment: settings.availableEquipment, balancedMovementCap: tryCap, previousTemplateIds, generationSeed: input.generationSeed, trainingOrdinal: dc.ordinal });
        if (!sel.valid) { lastSelectReason = lastSelectReason || sel.reason; continue; }
        anyTemplateFound = true;
        const fit = fitStrengthPrescription({ template: sel.template, tierKey: tierCap, budgets: dc.budget.strengthBudget, generationSeed: input.generationSeed, trainingOrdinal: dc.ordinal });
        if (fit.valid) {
          strengthPrescriptions = fit.prescriptions;
          previousTemplateIds.push(sel.template.id);
          fitted = true;
          break;
        }
      }
      if (!fitted) {
        if (!anyTemplateFound) return { valid: false, reasons: [RC[lastSelectReason] || RC.PROGRAM_NO_ELIGIBLE_STRENGTH_TEMPLATE], warnings: [], blueprint: null };
        return { valid: false, reasons: [RC.PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT], warnings: [], blueprint: null };
      }
    }

    const programDayId = `PRD_${programVersionId}_${dc.ordinal}`;
    const blocks = buildDayBlocks({ programDayId, role, budget: dc.budget, boxingRounds, defenseRound, strengthPrescriptions });
    for (const b of blocks) workoutBlocks.push(b);

    programDays.push({
      id: programDayId,
      programVersionId,
      trainingOrdinal: dc.ordinal,
      programWeekIndex: dc.sd.programWeekIndex,
      programMonthIndex: dc.sd.programMonthIndex,
      plannedDate: dc.sd.date,
      weekday: WEEKDAYS[dc.sd.weekdayIndex],
      sessionRole: role,
      sessionDurationMinutes: settings.sessionDurationMinutes,
      phaseId: dc.progression.result.phase.id,
      phaseIndex: dc.progression.result.phase.index,
      progressionFocus: focus,
      defenseEligible: !!dc.defenseEligible,
      budgetSnapshot: {
        warmupSeconds: dc.budget.blocks.warmupSeconds,
        boxingSeconds: dc.budget.blocks.boxingSeconds,
        transitionSeconds: dc.budget.blocks.transitionSeconds,
        strengthSeconds: dc.budget.blocks.strengthSeconds,
        cooldownSeconds: dc.budget.blocks.cooldownSeconds,
        totalSeconds: dc.budget.totalSeconds,
        eligibleMovementCounts: dc.budget.strengthBudget ? dc.budget.strengthBudget.eligibleMovementCounts : [],
      },
      progressionSnapshot: { phaseId: dc.progression.result.phase.id, phaseIndex: dc.progression.result.phase.index, phaseCount: dc.progression.result.phase.count },
      balancedCapsSnapshot: balancedCaps,
      purpose: `${dc.progression.result.phase.id}/${focus}`,
      sortOrder: dc.ordinal,
    });
  }

  const program = {
    id: programId,
    status: PROGRAM_STATUS.REVIEW_REQUIRED,
    currentVersionId: programVersionId,
    programMode: settings.programMode,
    durationMonths: settings.durationMonths,
    createdAt: null,
    updatedAt: null,
  };
  const programVersion = {
    id: programVersionId,
    programId,
    versionNumber: 1,
    status: PROGRAM_STATUS.REVIEW_REQUIRED,
    locked: false,
    generationRequestId: input.generationRequestId,
    generationSeed: input.generationSeed,
    settingsSnapshot: settings,
    engineVersions,
    generationPolicyVersion: CURRENT_GENERATION_POLICY_VERSION,
    programStartDate,
    endDateExclusive,
    totalPlannedTrainingSessions: total,
    blueprintFingerprint: null,
    approvedAt: null,
    activatedAt: null,
    createdAt: null,
    updatedAt: null,
  };

  const blueprint = { program, programVersion, programDays, workoutBlocks, blueprintFingerprint: null, warnings: [] };
  const fingerprint = computeBlueprintFingerprint(blueprint, input.generationSeed);
  blueprint.blueprintFingerprint = fingerprint;
  blueprint.programVersion.blueprintFingerprint = fingerprint;

  const validation = validateFullProgramBlueprint(blueprint);
  if (!validation.valid) return { valid: false, reasons: validation.reasons, warnings: validation.warnings, blueprint: null };

  return { valid: true, reasons: [], warnings: validation.warnings, blueprint };
}

// computeBlueprintFingerprint → ./blueprintFingerprint (reuse, duplicate yok)