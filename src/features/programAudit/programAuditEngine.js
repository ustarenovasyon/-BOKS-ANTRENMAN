/**
 * PURE PROGRAM AUDIT ENGINE (PART 17)
 * --------------------------------------------------------------
 * auditProgramSnapshot(snapshot): DB write YOK. Generator ÇAĞRILMAZ.
 * Persisted ProgramDays/Blocks'u MUTATE ETMEZ (sort için kopya alınır).
 * Beklenen değerler PART 12/13/14 gerçek motorlarıyla yeniden hesaplanır.
 * --------------------------------------------------------------
 */
import { LOCAL_PROGRAM_AUDIT_ENGINE_VERSION, PROGRAM_AUDIT_OUTCOMES, AUDIT_FINDING_SEVERITIES, AUDIT_CHECK_CATEGORIES, AUDIT_REASON_CODES, AUDIT_WARNING_CODES, FULL_PATTERN_MASK, PATTERN_BITS } from './programAuditConstants';
import { makeFinding, templatePatternMask, missingPatterns } from './auditFinding';
import { stableHash } from '@/features/programGeneration/deterministicSelection';
import { computeBlueprintFingerprint } from '@/features/programGeneration/blueprintFingerprint';
import { addCalendarMonthsClamped, buildScheduledDates, weekdayIndex } from '@/features/programGeneration/programCalendarEngine';
import { buildSessionTimeBudget } from '@/features/sessionBudget/sessionTimeBudgetEngine';
import { buildBoxingIntervalBudget } from '@/features/sessionBudget/boxingIntervalBudget';
import { buildProgramProgression } from '@/features/progression/progressionEngine';
import { planWeeklyRoles, computeWeeklyMetrics } from '@/features/weeklyBalance/weeklyRolePlanner';
import { pickFocus, applyProgressionFocusBalance, countPushedDimensions } from '@/features/weeklyBalance/progressionFocusBalancer';
import { planMixedDefenseSlots } from '@/features/programGeneration/defenseContentSelector';
import { boxingCandidatePool } from '@/features/programGeneration/boxingContentSelector';
import { resolveGenerationPolicyVersion } from '@/features/programGeneration/generationPolicyResolver';
import { validateFootworkTechniqueDay } from '@/features/programGeneration/footworkTechniqueBlock';
import { validateFootworkPrescriptionDay } from '@/features/programGeneration/footworkPrescription';
import { WEEKDAY_INDEX, ROLE_BUDGET_MODE } from '@/features/weeklyBalance/weeklyBalanceConstants';
import { BOXING_COMBINATIONS } from '@/features/boxing/combinations/boxingCombinations';
import { BOXING_MOVE_IDS, BOXING_MOVES } from '@/features/boxing/library/boxingMoves';
import { BOXING_TRANSITIONS } from '@/features/boxing/transitions/boxingTransitions';
import { DEFENSE_COUNTER_RULES } from '@/features/boxing/defense/defenseCounterRules';
import { STRENGTH_TEMPLATES, isStrengthTemplateAvailable } from '@/features/strength/templates/strengthTemplates';
import { STRENGTH_EXERCISES } from '@/features/strength/library/strengthExercises';
import { evaluateStrengthSessionBalance } from '@/features/strength/technical/strengthSessionValidator';
import { PRESCRIPTION_TIER_ENVELOPES } from '@/features/progression/progressionConstants';
import {
  PROGRAM_MODES, PROGRAM_STATUS, WEEKDAYS, WEEKLY_SESSION_ROLES, WORKOUT_BLOCK_TYPES,
  BOXING_INTERVAL_SEGMENT_TYPES, STRENGTH_LATERALITY, STRENGTH_PRESCRIPTION_TYPES,
  STRENGTH_MOVEMENT_PATTERNS, PLANNING_SECONDS_PER_REP, MIN_INTERSET_REST_SECONDS,
} from '@/config/architecture';

const SEV = AUDIT_FINDING_SEVERITIES;
const CAT = AUDIT_CHECK_CATEGORIES;
const RC = AUDIT_REASON_CODES;
const WC = AUDIT_WARNING_CODES;

const COMBO_BY_ID = new Map(BOXING_COMBINATIONS.map((c) => [c.id, c]));
const DEF_BY_ID = new Map(DEFENSE_COUNTER_RULES.map((r) => [r.id, r]));
const TEMPLATE_BY_ID = new Map(STRENGTH_TEMPLATES.map((t) => [t.id, t]));
const EX_BY_ID = new Map(STRENGTH_EXERCISES.map((e) => [e.id, e]));
const MOVE_BY_ID = new Map(BOXING_MOVES.map((m) => [m.id, m]));
const SLIP_IDS = new Set([BOXING_MOVE_IDS.SLIP_LEAD, BOXING_MOVE_IDS.SLIP_REAR]);
const PAIR_INDEX = new Map(BOXING_TRANSITIONS.map((t) => [`${t.fromMoveId}>${t.toMoveId}`, t]));
const UNILATERAL_LATERALITIES = new Set([STRENGTH_LATERALITY.UNILATERAL, STRENGTH_LATERALITY.ISOMETRIC_UNILATERAL]);
const FORBIDDEN_KG_KEYS = ['kg', 'weight', 'recommendedkg', 'defaultkg', 'workingweight', 'loadkg', 'autoweight', 'recommendedload', 'percentage1rm', 'suggestedweight', 'trainingmax', 'phaserecommendedkg', 'loadincrementkg', '1rm'];

/**
 * PART 30: Backward-compatible boxing move library version set.
 * Version 1 = legacy (pre-Catch, 12-move registry).
 * Version 2 = legacy (14-move registry with Catch Lead/Rear).
 * Version 3 = current (18-move registry with Footwork Step In/Out/Lead-side/Rear-side).
 * Legacy V1/V2 programs must not be invalidated solely due to the library bump.
 * Unknown/null → fail-safe (CRITICAL finding).
 */
const SUPPORTED_BOXING_MOVE_LIBRARY_VERSIONS = Object.freeze(new Set([1, 2, 3]));

function isUnilateral(ex) { return ex && UNILATERAL_LATERALITIES.has(ex.laterality); }

/**
 * Pure audit. snapshot = { program, programVersion, programDays, workoutBlocks }.
 */
export function auditProgramSnapshot(snapshot) {
  const findings = [];
  const checkSummary = { totalChecks: 0, identityChecks: 0, calendarChecks: 0, timeChecks: 0, progressionChecks: 0, weeklyBalanceChecks: 0, boxingChecks: 0, defenseChecks: 0, strengthChecks: 0, coverageChecks: 0, repetitionChecks: 0, policyChecks: 0 };
  const bump = (cat) => { checkSummary.totalChecks += 1; checkSummary[cat + 'Checks'] += 1; };
  const add = (code, severity, category, message, location, details) => { findings.push(makeFinding(code, severity, category, message, location, details)); bump(category); };

  if (!snapshot || !snapshot.program || !snapshot.programVersion) {
    add(RC.AUDIT_PROGRAM_NOT_FOUND, SEV.CRITICAL, CAT.IDENTITY, 'Program/sürüm yok.');
    return finalize(findings, checkSummary, snapshot);
  }
  const { program, programVersion } = snapshot;

  // PART 20: Generation policy version routing.
  // V1 active → existing audit logic. V2 (inactive) / unknown → fail-closed.
  const policy = resolveGenerationPolicyVersion(programVersion);
  if (!policy.resolved || !policy.active) {
    const detail = policy.resolved
      ? { generationPolicyVersion: programVersion.generationPolicyVersion, reason: 'inactive_v2' }
      : { generationPolicyVersion: programVersion.generationPolicyVersion, reason: policy.reason };
    add(
      RC.AUDIT_UNSUPPORTED_GENERATION_POLICY_VERSION,
      SEV.CRITICAL,
      CAT.IDENTITY,
      policy.resolved ? 'V2 generation policy henüz aktif değil.' : 'Bilinmeyen generation policy version.',
      {},
      detail
    );
    return finalize(findings, checkSummary, snapshot);
  }

  const settings = programVersion.settingsSnapshot || {};
  const days = (snapshot.programDays || []).slice().sort((a, b) => (a.trainingOrdinal || 0) - (b.trainingOrdinal || 0));
  const blocks = snapshot.workoutBlocks || [];
  const blocksByDay = new Map();
  for (const b of blocks) {
    if (!blocksByDay.has(b.programDayId)) blocksByDay.set(b.programDayId, []);
    blocksByDay.get(b.programDayId).push(b);
  }
  for (const arr of blocksByDay.values()) arr.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

  // PART 34: V1 must never carry isolated footwork. Future active V2 can reuse
  // the same central contract without changing the V1 checkSummary shape.
  for (const day of days) {
    const footworkValidation = validateFootworkTechniqueDay({
      day,
      dayBlocks: blocksByDay.get(day.id) || [],
      programDays: days,
      settings,
      generationPolicyVersion: policy.version,
    });
    if (!footworkValidation.valid) {
      add(
        RC.AUDIT_FOOTWORK_TECHNIQUE_INVALID,
        SEV.CRITICAL,
        CAT.BOXING,
        'Footwork technique block contract geçersiz.',
        { trainingOrdinal: day.trainingOrdinal, plannedDate: day.plannedDate },
        { reasons: footworkValidation.reasons },
      );
    }
  }

  // PART 35: V1 must never carry structured footwork integration metadata.
  // No prescription = no extra checkSummary bump, preserving canonical V1 AFP.
  for (const day of days) {
    const prescriptionValidation = validateFootworkPrescriptionDay({
      day,
      dayBlocks: blocksByDay.get(day.id) || [],
      programDays: days,
      settings,
      generationPolicyVersion: policy.version,
    });
    if (!prescriptionValidation.valid) {
      add(
        RC.AUDIT_FOOTWORK_PRESCRIPTION_INVALID,
        SEV.CRITICAL,
        CAT.BOXING,
        'Footwork integration prescription contract geçersiz.',
        { trainingOrdinal: day.trainingOrdinal, plannedDate: day.plannedDate },
        { reasons: prescriptionValidation.reasons },
      );
    }
  }

  // ===== IDENTITY =====
  bump(CAT.IDENTITY);
  if (program.currentVersionId !== programVersion.id) add(RC.AUDIT_VERSION_RELATION_MISMATCH, SEV.CRITICAL, CAT.IDENTITY, 'Program.currentVersionId !== Version.id.');
  if (programVersion.programId !== program.id) add(RC.AUDIT_VERSION_RELATION_MISMATCH, SEV.CRITICAL, CAT.IDENTITY, 'Version.programId !== Program.id.');
  if (!Number.isInteger(programVersion.versionNumber) || programVersion.versionNumber < 1) add(RC.AUDIT_VERSION_RELATION_MISMATCH, SEV.CRITICAL, CAT.IDENTITY, 'versionNumber geçersiz.');
  if (programVersion.locked === true) add(RC.AUDIT_VERSION_RELATION_MISMATCH, SEV.CRITICAL, CAT.IDENTITY, 'locked=true (review flow).');

  // SETTINGS SNAPSHOT
  bump(CAT.IDENTITY);
  const requiredBase = ['programMode', 'durationMonths', 'daysPerWeek', 'selectedWeekdays', 'sessionDurationMinutes', 'experienceLevel', 'difficulty'];
  for (const k of requiredBase) if (settings[k] === undefined || settings[k] === null) add(RC.AUDIT_INVALID_SETTINGS_SNAPSHOT, SEV.CRITICAL, CAT.IDENTITY, `settingsSnapshot.${k} eksik.`);
  const hasBoxing = settings.programMode === PROGRAM_MODES.BOXING_ONLY || settings.programMode === PROGRAM_MODES.BOXING_AND_STRENGTH;
  const hasStrength = settings.programMode === PROGRAM_MODES.STRENGTH_ONLY || settings.programMode === PROGRAM_MODES.BOXING_AND_STRENGTH;
  if (hasBoxing && (!settings.boxingStance || !Number.isInteger(settings.boxingMaxMoves))) add(RC.AUDIT_INVALID_SETTINGS_SNAPSHOT, SEV.CRITICAL, CAT.IDENTITY, 'Boxing ayarları eksik.');
  if (hasStrength && (!Number.isInteger(settings.strengthDaysPerWeek) || !Array.isArray(settings.availableEquipment) || settings.availableEquipment.length === 0)) add(RC.AUDIT_INVALID_SETTINGS_SNAPSHOT, SEV.CRITICAL, CAT.IDENTITY, 'Strength ayarları eksik.');

  // ENGINE VERSIONS
  bump(CAT.IDENTITY);
  const ev = programVersion.engineVersions || {};
  // PART 30: boxingMoveLibraryVersion checked against backward-compatible set (not exact match).
  // Legacy V1 (version=1) and current V1 (version=2) both valid. Unknown/null → fail-safe.
  if (!SUPPORTED_BOXING_MOVE_LIBRARY_VERSIONS.has(ev.boxingMoveLibraryVersion)) {
    add(RC.AUDIT_ENGINE_VERSION_INCOMPATIBLE, SEV.CRITICAL, CAT.IDENTITY, `engineVersions.boxingMoveLibraryVersion=${ev.boxingMoveLibraryVersion} (desteklenen: 1, 2).`);
  }
  const expectedV1 = { strengthExerciseLibraryVersion: 1, boxingCombinationLibraryVersion: 1, boxingTransitionMatrixVersion: 1, boxingDefenseCounterLibraryVersion: 1, strengthTemplateLibraryVersion: 1, strengthTechnicalConstitutionVersion: 1, sessionTimeBudgetEngineVersion: 1, programProgressionEngineVersion: 1, weeklyBalancingEngineVersion: 1, fullProgramGeneratorVersion: 1, strengthPrescriptionFitterVersion: 1 };
  for (const k of Object.keys(expectedV1)) {
    if (ev[k] !== expectedV1[k]) { add(RC.AUDIT_ENGINE_VERSION_INCOMPATIBLE, SEV.CRITICAL, CAT.IDENTITY, `engineVersions.${k}=${ev[k]} (beklenen ${expectedV1[k]}).`); break; }
  }

  // ===== FINGERPRINT (pre) =====
  bump(CAT.IDENTITY);
  const recomputedFp = computeBlueprintFingerprint({ program, programVersion, programDays: days, workoutBlocks: blocks }, programVersion.generationSeed);
  const fingerprintMatch = recomputedFp === programVersion.blueprintFingerprint;
  if (!fingerprintMatch) {
    add(RC.AUDIT_INPUT_FINGERPRINT_MISMATCH, SEV.CRITICAL, CAT.IDENTITY, 'Persisted fingerprint, yeniden hesaplananla eşleşmiyor.', {}, { persisted: programVersion.blueprintFingerprint, recomputed: recomputedFp });
    // 17.9: mismatch → normal audit'i durdur.
    return finalize(findings, checkSummary, snapshot, recomputedFp);
  }

  // ===== DAY COUNT =====
  bump(CAT.CALENDAR);
  const total = programVersion.totalPlannedTrainingSessions;
  if (!Number.isInteger(total) || total < 1) add(RC.AUDIT_DAY_COUNT_MISMATCH, SEV.CRITICAL, CAT.CALENDAR, 'totalPlannedTrainingSessions geçersiz.');
  else if (days.length !== total) add(RC.AUDIT_DAY_COUNT_MISMATCH, SEV.CRITICAL, CAT.CALENDAR, `${days.length} !== ${total}`);

  // ORDINALS
  bump(CAT.CALENDAR);
  const ords = days.map((d) => d.trainingOrdinal);
  for (let i = 0; i < ords.length; i++) if (ords[i] !== i + 1) { add(RC.AUDIT_ORDINAL_INVALID, SEV.CRITICAL, CAT.CALENDAR, 'Ordinal 1..N contiguous değil.'); break; }

  // DATE ORDER + RANGE + WEEKDAY
  const selIdx = new Set((settings.selectedWeekdays || []).map((w) => WEEKDAYS.indexOf(w)));
  const start = programVersion.programStartDate;
  const end = programVersion.endDateExclusive;
  let prevDate = null;
  for (const d of days) {
    bump(CAT.CALENDAR);
    if (prevDate !== null && d.plannedDate <= prevDate) add(RC.AUDIT_DATE_ORDER_INVALID, SEV.CRITICAL, CAT.CALENDAR, 'Tarih sırası bozuk/tekrarlı.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    prevDate = d.plannedDate;
    bump(CAT.CALENDAR);
    if (d.plannedDate < start || d.plannedDate >= end) add(RC.AUDIT_DATE_OUT_OF_RANGE, SEV.CRITICAL, CAT.CALENDAR, 'Tarih aralık dışında.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    bump(CAT.CALENDAR);
    if (!selIdx.has(weekdayIndex(d.plannedDate))) add(RC.AUDIT_WEEKDAY_INVALID, SEV.CRITICAL, CAT.CALENDAR, 'Seçili gün dışında.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
  }

  // CALENDAR DURATION + WEEK/MONTH INDEX
  bump(CAT.CALENDAR);
  const selIdxArr = (settings.selectedWeekdays || []).map((w) => WEEKDAYS.indexOf(w)).sort((a, b) => a - b);
  // Persisted programStartDate zaten resolveProgramStartDate çıktısıdır; genDate gerekmez.
  const expEnd = addCalendarMonthsClamped(start, settings.durationMonths);
  if (expEnd !== end) add(RC.AUDIT_CALENDAR_DURATION_MISMATCH, SEV.CRITICAL, CAT.CALENDAR, 'End tarih süreye uymuyor.', {}, { expectedEnd: expEnd, actualEnd: end });
  bump(CAT.CALENDAR);
  const scheduled = buildScheduledDates(start, expEnd, selIdxArr);
  const schedByDate = new Map(scheduled.map((s) => [s.date, s]));
  for (const d of days) {
    const s = schedByDate.get(d.plannedDate);
    if (!s || s.programWeekIndex !== d.programWeekIndex || s.programMonthIndex !== d.programMonthIndex) add(RC.AUDIT_CALENDAR_DURATION_MISMATCH, SEV.CRITICAL, CAT.CALENDAR, 'Week/Month index tutarsız.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
  }

  // ===== Recompute weekly context (roles, focus, defense, balanced caps, progression) =====
  const weeks = new Map();
  for (const d of days) { if (!weeks.has(d.programWeekIndex)) weeks.set(d.programWeekIndex, []); weeks.get(d.programWeekIndex).push(d); }
  const weekList = [...weeks.keys()].sort((a, b) => a - b);
  const expectedByDay = new Map(); // dayId -> { role, focus, balancedCaps, defenseEligible, budget, progression, boxingBudget }
  let defenseExposureCounter = 0;

  for (const wk of weekList) {
    const weekDays = weeks.get(wk).slice().sort((a, b) => a.plannedDate < b.plannedDate ? -1 : 1);
    const roles = planWeeklyRoles(settings.programMode, settings.selectedWeekdays, settings.strengthDaysPerWeek || 0);
    // per-day progression (defense level) — needs ordinal, already set globally.
    const perDayLevels = [];
    for (const d of weekDays) {
      const role = roles[WEEKDAYS.indexOf(d.weekday)].sessionRole;
      const budgetMode = ROLE_BUDGET_MODE[role];
      const budget = buildSessionTimeBudget({ programMode: budgetMode, sessionDurationMinutes: settings.sessionDurationMinutes, experienceLevel: settings.experienceLevel, difficulty: settings.difficulty });
      const progression = buildProgramProgression({ durationMonths: settings.durationMonths, programMode: settings.programMode, experienceLevel: settings.experienceLevel, difficulty: settings.difficulty, trainingOrdinal: d.trainingOrdinal, totalPlannedTrainingSessions: total, userBoxingMaxMoves: settings.boxingMaxMoves, sessionBudget: budget });
      const defLevel = (role === WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY || role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY) && progression.valid && progression.result.boxingProgression ? progression.result.boxingProgression.defenseExposureLevel : 'none';
      perDayLevels.push({ weekdayIndex: WEEKDAYS.indexOf(d.weekday), role, level: defLevel });
    }
    const defenseSet = planMixedDefenseSlots(perDayLevels, wk);
    let slot = 0;
    for (const d of weekDays) {
      const role = roles[WEEKDAYS.indexOf(d.weekday)].sessionRole;
      const budgetMode = ROLE_BUDGET_MODE[role];
      const budget = buildSessionTimeBudget({ programMode: budgetMode, sessionDurationMinutes: settings.sessionDurationMinutes, experienceLevel: settings.experienceLevel, difficulty: settings.difficulty });
      const progression = buildProgramProgression({ durationMonths: settings.durationMonths, programMode: settings.programMode, experienceLevel: settings.experienceLevel, difficulty: settings.difficulty, trainingOrdinal: d.trainingOrdinal, totalPlannedTrainingSessions: total, userBoxingMaxMoves: settings.boxingMaxMoves, sessionBudget: budget });
      const defenseEligible = defenseSet.has(WEEKDAYS.indexOf(d.weekday));
      const focus = pickFocus(role, wk, slot, defenseEligible);
      const balancedCaps = applyProgressionFocusBalance(progression, role, focus);
      const boxingBudget = (role === WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY || role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY) && budget.blocks.boxingSeconds > 0
        ? buildBoxingIntervalBudget(budget.blocks.boxingSeconds, settings.experienceLevel, settings.difficulty, { workSecondsOverride: balancedCaps ? balancedCaps.boxingWorkCapSeconds : null })
        : null;
      expectedByDay.set(d.id, { role, focus, balancedCaps, defenseEligible, budget, progression, boxingBudget });
      slot += 1;
    }
  }

  // ===== SESSION DURATION + BUDGET + DAY TOTAL + BLOCK ORDER + ROLE COMPOSITION + COMPONENT SUMS =====
  for (const d of days) {
    const exp = expectedByDay.get(d.id);
    const dayBlocks = blocksByDay.get(d.id) || [];
    // session duration fixed
    bump(CAT.TIME_BUDGET);
    if (d.sessionDurationMinutes !== settings.sessionDurationMinutes) add(RC.AUDIT_SESSION_DURATION_MISMATCH, SEV.CRITICAL, CAT.TIME_BUDGET, 'sessionDuration mismatch.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    // budget snapshot
    bump(CAT.TIME_BUDGET);
    if (exp && exp.budget.valid) {
      const bs = d.budgetSnapshot || {};
      const eb = exp.budget.blocks;
      const fields = ['warmupSeconds', 'boxingSeconds', 'transitionSeconds', 'strengthSeconds', 'cooldownSeconds'];
      let budgetMismatch = false;
      for (const f of fields) if (bs[f] !== eb[f]) budgetMismatch = true;
      // totalSeconds lives at budget top-level, not inside blocks
      if (bs.totalSeconds !== exp.budget.totalSeconds) budgetMismatch = true;
      if (budgetMismatch) add(RC.AUDIT_BUDGET_SNAPSHOT_MISMATCH, SEV.CRITICAL, CAT.TIME_BUDGET, 'budgetSnapshot mismatch.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    }
    // day exact total
    bump(CAT.TIME_BUDGET);
    const sum = dayBlocks.reduce((a, b) => a + (b.plannedSeconds || 0), 0);
    if (sum !== settings.sessionDurationMinutes * 60) add(RC.AUDIT_DAY_TIME_MISMATCH, SEV.CRITICAL, CAT.TIME_BUDGET, 'Günlük toplam süre eşleşmiyor.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate }, { sum, expected: settings.sessionDurationMinutes * 60 });
    // block order
    bump(CAT.TIME_BUDGET);
    for (let i = 0; i < dayBlocks.length; i++) if (dayBlocks[i].orderIndex !== i) { add(RC.AUDIT_BLOCK_ORDER_INVALID, SEV.CRITICAL, CAT.TIME_BUDGET, 'orderIndex gap/dup.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate, orderIndex: i }); break; }
    // role composition + component sums
    bump(CAT.TIME_BUDGET);
    const role = d.sessionRole;
    const hasBoxingBlocks = dayBlocks.some((b) => b.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK || b.type === WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK || b.type === WORKOUT_BLOCK_TYPES.BOXING_REST);
    const hasStrengthBlocks = dayBlocks.some((b) => b.type === WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE);
    const hasTransition = dayBlocks.some((b) => b.type === WORKOUT_BLOCK_TYPES.MODE_TRANSITION);
    if (role === WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY && (hasStrengthBlocks || hasTransition)) add(RC.AUDIT_ROLE_COMPOSITION_INVALID, SEV.CRITICAL, CAT.TIME_BUDGET, 'Boxing-only günde strength/transition var.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    if (role === WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY && (hasBoxingBlocks)) add(RC.AUDIT_ROLE_COMPOSITION_INVALID, SEV.CRITICAL, CAT.TIME_BUDGET, 'Strength-only günde boxing var.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    if (role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY && (!hasBoxingBlocks || !hasStrengthBlocks || !hasTransition)) add(RC.AUDIT_ROLE_COMPOSITION_INVALID, SEV.CRITICAL, CAT.TIME_BUDGET, 'Combined gün eksik bileşen.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate });
    // combined session order: warmup, boxing, transition, strength, cooldown
    if (role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY) {
      bump(CAT.TIME_BUDGET);
      let seenStrength = false, seenTransition = false;
      for (const b of dayBlocks) {
        if (b.type === WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE) seenStrength = true;
        if (b.type === WORKOUT_BLOCK_TYPES.MODE_TRANSITION) { if (seenStrength) add(RC.AUDIT_ROLE_COMPOSITION_INVALID, SEV.CRITICAL, CAT.TIME_BUDGET, 'Combined sıra hatalı (transition strength sonrası).', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate, orderIndex: b.orderIndex }); seenTransition = true; }
        if (b.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK && seenStrength) add(RC.AUDIT_ROLE_COMPOSITION_INVALID, SEV.CRITICAL, CAT.TIME_BUDGET, 'Combined sıra hatalı (boxing strength sonrası).', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate, orderIndex: b.orderIndex });
      }
    }
    // component sums vs budget
    if (exp && exp.budget.valid) {
      bump(CAT.TIME_BUDGET);
      const eb = exp.budget.blocks;
      const warmupSum = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.WARMUP).reduce((a, b) => a + (b.plannedSeconds || 0), 0);
      const boxingSum = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK || b.type === WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK || b.type === WORKOUT_BLOCK_TYPES.BOXING_REST).reduce((a, b) => a + (b.plannedSeconds || 0), 0);
      const transitionSum = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.MODE_TRANSITION).reduce((a, b) => a + (b.plannedSeconds || 0), 0);
      const strengthSum = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE).reduce((a, b) => a + (b.plannedSeconds || 0), 0);
      const cooldownSum = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.COOLDOWN).reduce((a, b) => a + (b.plannedSeconds || 0), 0);
      if (warmupSum !== eb.warmupSeconds || boxingSum !== eb.boxingSeconds || transitionSum !== eb.transitionSeconds || strengthSum !== eb.strengthSeconds || cooldownSum !== eb.cooldownSeconds) add(RC.AUDIT_BUDGET_SNAPSHOT_MISMATCH, SEV.CRITICAL, CAT.TIME_BUDGET, 'Bileşen süre toplamları bütçeyle eşleşmiyor.', { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate }, { warmupSum, boxingSum, transitionSum, strengthSum, cooldownSum });
    }
  }

  // ===== PROGRESSION / WEEKLY BALANCE / BOXING / DEFENSE / STRENGTH per day =====
  const defenseCounts = { BOX_DEF_001: 0, BOX_DEF_002: 0 };
  const strengthSessions = []; // [{day, templateId, blocks, candidateMask, expected}]
  const attackSequenceBySession = []; // for repetition
  const prevPrimaryIds = [];

  for (const d of days) {
    const exp = expectedByDay.get(d.id);
    const dayBlocks = blocksByDay.get(d.id) || [];
    const loc = { trainingOrdinal: d.trainingOrdinal, plannedDate: d.plannedDate };

    // PROGRESSION
    bump(CAT.PROGRESSION);
    if (exp && exp.progression.valid) {
      const pr = exp.progression.result;
      if (d.phaseId !== pr.phase.id || d.phaseIndex !== pr.phase.index) add(RC.AUDIT_PROGRESSION_MISMATCH, SEV.CRITICAL, CAT.PROGRESSION, 'Faz bilgisi tutarsız.', loc, { persistedPhase: d.phaseId, expectedPhase: pr.phase.id });
    }

    // WEEKLY BALANCE: role / focus / defenseEligible / balanced caps
    bump(CAT.WEEKLY_BALANCE);
    if (exp) {
      if (d.sessionRole !== exp.role) add(RC.AUDIT_WEEKLY_ROLE_MISMATCH, SEV.CRITICAL, CAT.WEEKLY_BALANCE, 'Session role tutarsız.', loc, { persisted: d.sessionRole, expected: exp.role });
      if (d.defenseEligible !== exp.defenseEligible) add(RC.AUDIT_WEEKLY_ROLE_MISMATCH, SEV.CRITICAL, CAT.WEEKLY_BALANCE, 'defenseEligible tutarsız.', loc, { persisted: d.defenseEligible, expected: exp.defenseEligible });
      if (d.progressionFocus !== exp.focus) add(RC.AUDIT_WEEKLY_ROLE_MISMATCH, SEV.CRITICAL, CAT.WEEKLY_BALANCE, 'progressionFocus tutarsız.', loc, { persisted: d.progressionFocus, expected: exp.focus });
      const pc = d.balancedCapsSnapshot || {};
      const ec = exp.balancedCaps || {};
      if (pc.boxingComplexityCap !== ec.boxingComplexityCap || pc.boxingWorkCapSeconds !== ec.boxingWorkCapSeconds || pc.strengthMovementCap !== ec.strengthMovementCap || pc.strengthTierCap !== ec.strengthTierCap || pc.focus !== ec.focus) add(RC.AUDIT_BALANCED_CAP_MISMATCH, SEV.CRITICAL, CAT.WEEKLY_BALANCE, 'balancedCaps tutarsız.', loc);
      // multi-push
      bump(CAT.WEEKLY_BALANCE);
      if (ec && countPushedDimensions(ec) > 1) add(RC.AUDIT_MULTIPLE_PROGRESSION_PUSH, SEV.CRITICAL, CAT.WEEKLY_BALANCE, 'Birden fazla ilerleme boyutu zorlanmış.', loc);
    }

    // BOXING
    const attackBlocks = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK);
    const defenseBlocks = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK);
    if (attackBlocks.length > 0 || defenseBlocks.length > 0) {
      // interval reconstruction
      bump(CAT.BOXING);
      if (exp && exp.boxingBudget) {
        const workSegs = exp.boxingBudget.intervalSegments.filter((s) => s.type === BOXING_INTERVAL_SEGMENT_TYPES.WORK);
        const restSegs = exp.boxingBudget.intervalSegments.filter((s) => s.type === BOXING_INTERVAL_SEGMENT_TYPES.REST);
        const actualWork = [...attackBlocks, ...defenseBlocks].sort((a, b) => (a.roundIndex || 0) - (b.roundIndex || 0));
        const actualRest = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.BOXING_REST).sort((a, b) => (a.roundIndex || 0) - (b.roundIndex || 0));
        let intervalMismatch = false;
        if (actualWork.length !== workSegs.length || actualRest.length !== restSegs.length) intervalMismatch = true;
        else {
          for (let i = 0; i < workSegs.length; i++) if ((actualWork[i].plannedSeconds || 0) !== workSegs[i].durationSeconds) intervalMismatch = true;
          for (let i = 0; i < restSegs.length; i++) if ((actualRest[i].plannedSeconds || 0) !== restSegs[i].durationSeconds) intervalMismatch = true;
        }
        if (intervalMismatch) add(RC.AUDIT_BOXING_INTERVAL_MISMATCH, SEV.CRITICAL, CAT.BOXING, 'Boxing interval süreleri beklenenle eşleşmiyor.', loc);
      }
    }
    // attack combo checks
    const sessionAttackIds = [];
    for (const b of attackBlocks) {
      const bloc = { ...loc, workoutBlockId: b.id, orderIndex: b.orderIndex };
      bump(CAT.BOXING);
      const combo = COMBO_BY_ID.get(b.combinationId);
      if (!combo) { add(RC.AUDIT_UNKNOWN_BOXING_COMBINATION, SEV.CRITICAL, CAT.BOXING, 'Bilinmeyen kombinasyon.', bloc, { combinationId: b.combinationId }); continue; }
      bump(CAT.BOXING);
      if (b.moveIds && combo.moveIds && JSON.stringify(b.moveIds) !== JSON.stringify(combo.moveIds)) add(RC.AUDIT_BOXING_MOVE_ORDER_MISMATCH, SEV.CRITICAL, CAT.BOXING, 'Hareket sırası değiştirilmiş.', bloc, { combinationId: b.combinationId });
      bump(CAT.BOXING);
      if (b.moveIds && b.moveIds.some((m) => SLIP_IDS.has(m))) add(RC.AUDIT_SLIP_IN_ATTACK, SEV.CRITICAL, CAT.BOXING, 'Saldırıda Slip var.', bloc);
      bump(CAT.BOXING);
      const cap = Math.min(settings.boxingMaxMoves, (exp && exp.balancedCaps) ? exp.balancedCaps.boxingComplexityCap : settings.boxingMaxMoves);
      if ((b.moveCount || 0) > settings.boxingMaxMoves) add(RC.AUDIT_BOXING_COMBO_CAP_EXCEEDED, SEV.CRITICAL, CAT.BOXING, 'maxMoves aşıldı.', bloc, { moveCount: b.moveCount, max: settings.boxingMaxMoves });
      if (exp && exp.balancedCaps && (b.moveCount || 0) > exp.balancedCaps.boxingComplexityCap) add(RC.AUDIT_BOXING_COMBO_CAP_EXCEEDED, SEV.CRITICAL, CAT.BOXING, 'balanced cap aşıldı.', bloc, { moveCount: b.moveCount, cap: exp.balancedCaps.boxingComplexityCap });
      // transitions
      bump(CAT.BOXING);
      if (b.moveIds) {
        for (let i = 0; i < b.moveIds.length - 1; i++) {
          if (!PAIR_INDEX.has(`${b.moveIds[i]}>${b.moveIds[i + 1]}`)) { add(RC.AUDIT_BOXING_TRANSITION_INVALID, SEV.CRITICAL, CAT.BOXING, 'Geçiş onaylı değil.', bloc, { pair: `${b.moveIds[i]}>${b.moveIds[i + 1]}` }); break; }
        }
      }
      // conditional context
      bump(CAT.BOXING);
      if (combo.requiredContext && Object.keys(combo.requiredContext).length > 0) {
        const rc = b.requiredContext || {};
        if (rc.workingRange !== combo.requiredContext.workingRange || rc.levelChangeSupported !== combo.requiredContext.levelChangeSupported) add(RC.AUDIT_BOXING_CONTEXT_INVALID, SEV.CRITICAL, CAT.BOXING, 'Gereken bağlam eksik.', bloc, { combinationId: combo.id });
      }
      // working range valid
      bump(CAT.BOXING);
      if (b.workingRange && combo.allowedWorkingRanges && !combo.allowedWorkingRanges.includes(b.workingRange)) add(RC.AUDIT_BOXING_CONTEXT_INVALID, SEV.CRITICAL, CAT.BOXING, 'workingRange geçersiz.', bloc, { workingRange: b.workingRange, allowed: combo.allowedWorkingRanges });
      sessionAttackIds.push(b.combinationId);
    }
    // 3 consecutive same attack combo (with alternatives)
    bump(CAT.BOXING);
    if (attackBlocks.length >= 3) {
      for (let i = 0; i + 2 < attackBlocks.length; i++) {
        if (attackBlocks[i].combinationId === attackBlocks[i + 1].combinationId && attackBlocks[i + 1].combinationId === attackBlocks[i + 2].combinationId) {
          const ceiling = (exp && exp.balancedCaps) ? exp.balancedCaps.boxingComplexityCap : settings.boxingMaxMoves;
          const pool = boxingCandidatePool(ceiling, settings.boxingMaxMoves);
          if (pool.length > 1) add(RC.AUDIT_EXCESSIVE_CONSECUTIVE_ATTACK_COMBO, SEV.CRITICAL, CAT.BOXING, 'Aynı kombinasyon 3 ardışık round.', { ...loc, orderIndex: attackBlocks[i].orderIndex }, { combinationId: attackBlocks[i].combinationId });
        }
      }
    }
    // first attack round complexity warning
    bump(CAT.BOXING);
    if (attackBlocks.length > 0) {
      const first = attackBlocks[0];
      const cap = Math.min(settings.boxingMaxMoves, (exp && exp.balancedCaps) ? exp.balancedCaps.boxingComplexityCap : settings.boxingMaxMoves);
      const foundationalCap = Math.min(3, cap);
      if ((first.moveCount || 0) > foundationalCap) {
        const ceiling = (exp && exp.balancedCaps) ? exp.balancedCaps.boxingComplexityCap : settings.boxingMaxMoves;
        const pool = boxingCandidatePool(ceiling, settings.boxingMaxMoves);
        if (pool.some((c) => c.moveCount <= foundationalCap)) add(WC.AUDIT_FIRST_ATTACK_ROUND_COMPLEX, SEV.WARNING, CAT.BOXING, 'İlk saldırı rondası gereksiz karmaşık.', { ...loc, orderIndex: first.orderIndex }, { moveCount: first.moveCount, foundationalCap });
      }
    }
    attackSequenceBySession.push({ day: d, attackIds: sessionAttackIds });

    // DEFENSE
    bump(CAT.DEFENSE);
    const isBoxingDay = d.sessionRole === WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY || d.sessionRole === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY;
    if (defenseBlocks.length > 0 && !(isBoxingDay && d.defenseEligible)) add(RC.AUDIT_DEFENSE_UNAUTHORIZED, SEV.CRITICAL, CAT.DEFENSE, 'Savunma yetkisiz günde.', loc);
    bump(CAT.DEFENSE);
    const expectedDefCount = (isBoxingDay && d.defenseEligible) ? 1 : 0;
    if (defenseBlocks.length !== expectedDefCount) add(RC.AUDIT_DEFENSE_COUNT_MISMATCH, SEV.CRITICAL, CAT.DEFENSE, 'Savunma blok sayısı hatalı.', loc, { actual: defenseBlocks.length, expected: expectedDefCount });
    for (const b of defenseBlocks) {
      const bloc = { ...loc, workoutBlockId: b.id, orderIndex: b.orderIndex };
      bump(CAT.DEFENSE);
      const rule = DEF_BY_ID.get(b.defenseRuleId);
      if (!rule) { add(RC.AUDIT_DEFENSE_RULE_INVALID, SEV.CRITICAL, CAT.DEFENSE, 'Geçersiz savunma kuralı.', bloc, { defenseRuleId: b.defenseRuleId }); continue; }
      defenseCounts[rule.id] = (defenseCounts[rule.id] || 0) + 1;
      bump(CAT.DEFENSE);
      if (b.incomingThreatType !== rule.incomingThreatType || b.defenseMoveId !== rule.defenseMoveId || JSON.stringify(b.counterMoveIds || []) !== JSON.stringify(rule.counterMoveIds) || b.opponentStanceRelation !== rule.opponentStanceRelation) add(RC.AUDIT_DEFENSE_CONTENT_MISMATCH, SEV.CRITICAL, CAT.DEFENSE, 'Savunma içeriği kuralla uyuşmuyor.', bloc);
      bump(CAT.DEFENSE);
      if (b.workingRange !== 'mid') add(RC.AUDIT_DEFENSE_CONTENT_MISMATCH, SEV.CRITICAL, CAT.DEFENSE, 'Savunma workingRange MID değil.', bloc, { workingRange: b.workingRange });
    }

    // STRENGTH
    const strengthBlocks = dayBlocks.filter((b) => b.type === WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE);
    if (strengthBlocks.length > 0) {
      // all same templateId
      bump(CAT.STRENGTH);
      const templateIds = new Set(strengthBlocks.map((b) => b.templateId));
      if (templateIds.size !== 1) add(RC.AUDIT_STRENGTH_TEMPLATE_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Bir seansta birden fazla template.', loc);
      const templateId = strengthBlocks[0].templateId;
      const tmpl = TEMPLATE_BY_ID.get(templateId);
      bump(CAT.STRENGTH);
      if (!tmpl) { add(RC.AUDIT_STRENGTH_TEMPLATE_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Geçersiz template.', loc, { templateId }); }
      else {
        bump(CAT.STRENGTH);
        if (!isStrengthTemplateAvailable(tmpl, settings.availableEquipment)) add(RC.AUDIT_STRENGTH_EQUIPMENT_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Template ekipmanla uyumsuz.', loc, { templateId });
        bump(CAT.STRENGTH);
        const eligible = (exp && exp.budget.strengthBudget) ? exp.budget.strengthBudget.eligibleMovementCounts : [];
        const movCap = exp && exp.balancedCaps ? exp.balancedCaps.strengthMovementCap : tmpl.movementCount;
        if (!eligible.includes(tmpl.movementCount)) add(RC.AUDIT_STRENGTH_MOVEMENT_CAP_EXCEEDED, SEV.CRITICAL, CAT.STRENGTH, 'Hareket sayısı eligible değil.', loc, { movementCount: tmpl.movementCount, eligible });
        if (tmpl.movementCount > movCap) add(RC.AUDIT_STRENGTH_MOVEMENT_CAP_EXCEEDED, SEV.CRITICAL, CAT.STRENGTH, 'Hareket sayısı balanced cap üstünde.', loc, { movementCount: tmpl.movementCount, cap: movCap });
        // template order immutable
        bump(CAT.STRENGTH);
        const actualExIds = strengthBlocks.map((b) => b.exerciseId);
        if (JSON.stringify(actualExIds) !== JSON.stringify(tmpl.exerciseIds)) add(RC.AUDIT_STRENGTH_TEMPLATE_ORDER_MISMATCH, SEV.CRITICAL, CAT.STRENGTH, 'Template hareket sırası değiştirilmiş.', loc, { actual: actualExIds, expected: tmpl.exerciseIds });
        // constitution
        bump(CAT.STRENGTH);
        const sess = evaluateStrengthSessionBalance({ exerciseIds: tmpl.exerciseIds, availableEquipment: settings.availableEquipment });
        if (!sess.valid) add(RC.AUDIT_STRENGTH_CONSTITUTION_FAILED, SEV.CRITICAL, CAT.STRENGTH, 'Kuvvet teknik kuralları sağlamıyor.', loc, { reasons: sess.reasons });
        // max 1 row variant
        bump(CAT.STRENGTH);
        let rowVariants = 0;
        for (const exId of tmpl.exerciseIds) { const ex = EX_BY_ID.get(exId); if (ex && ex.alternativeGroup === 'row_variants') rowVariants += 1; }
        if (rowVariants > 1) add(RC.AUDIT_STRENGTH_CONSTITUTION_FAILED, SEV.CRITICAL, CAT.STRENGTH, 'Birden fazla row varyantı.', loc, { rowVariants });

        // tier envelope
        const tierKey = exp && exp.balancedCaps ? exp.balancedCaps.strengthTierCap : 'tier_1';
        const envelope = PRESCRIPTION_TIER_ENVELOPES[tierKey];
        // budgets
        const sb = exp && exp.budget.strengthBudget ? exp.budget.strengthBudget : null;
        let workSum = 0, recoverySum = 0, transitionSum = 0, strengthTotal = 0;
        for (let i = 0; i < strengthBlocks.length; i++) {
          const b = strengthBlocks[i];
          const ex = EX_BY_ID.get(b.exerciseId);
          const bloc = { ...loc, workoutBlockId: b.id, orderIndex: b.orderIndex };
          workSum += (b.plannedWorkWindowSeconds || 0);
          transitionSum += (b.transitionAfterExerciseSeconds || 0);
          strengthTotal += (b.plannedSeconds || 0);
          if (Array.isArray(b.interSetRestSeconds)) for (const r of b.interSetRestSeconds) recoverySum += r;
          // set count
          bump(CAT.STRENGTH);
          if (envelope && !envelope.allowedSetCounts.includes(b.setCount)) add(RC.AUDIT_STRENGTH_SET_COUNT_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Set sayısı geçersiz.', bloc, { setCount: b.setCount, allowed: envelope.allowedSetCounts });
          // rep / hold
          if (ex) {
            bump(CAT.STRENGTH);
            if (ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS) {
              const val = isUnilateral(ex) ? b.repsPerSide : b.repsPerSet;
              if (envelope && (typeof val !== 'number' || val < envelope.repRange.min || val > envelope.repRange.max)) add(RC.AUDIT_STRENGTH_REP_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Tekrar aralık dışı.', bloc, { value: val, range: envelope && envelope.repRange });
            } else {
              const val = isUnilateral(ex) ? b.holdSecondsPerSide : b.holdSecondsPerSet;
              if (envelope && (typeof val !== 'number' || val < envelope.holdRangeSeconds.min || val > envelope.holdRangeSeconds.max)) add(RC.AUDIT_STRENGTH_HOLD_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Tutma süresi aralık dışı.', bloc, { value: val, range: envelope && envelope.holdRangeSeconds });
            }
            // unilateral semantics
            bump(CAT.STRENGTH);
            if (isUnilateral(ex)) {
              if (!b.bothSidesRequired) add(RC.AUDIT_UNILATERAL_SEMANTICS_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'Tek taraflı hareket bothSidesRequired değil.', bloc, { exerciseId: ex.id });
              if (ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS && (b.repsPerSide === undefined)) add(RC.AUDIT_UNILATERAL_SEMANTICS_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'repsPerSide eksik.', bloc, { exerciseId: ex.id });
              if (ex.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.TIME && (b.holdSecondsPerSide === undefined)) add(RC.AUDIT_UNILATERAL_SEMANTICS_INVALID, SEV.CRITICAL, CAT.STRENGTH, 'holdSecondsPerSide eksik.', bloc, { exerciseId: ex.id });
            }
          }
          // rest >= 15
          bump(CAT.STRENGTH);
          if (Array.isArray(b.interSetRestSeconds)) for (const r of b.interSetRestSeconds) if (r < MIN_INTERSET_REST_SECONDS) add(RC.AUDIT_STRENGTH_REST_TOO_SHORT, SEV.CRITICAL, CAT.STRENGTH, 'Setler arası dinlenme çok kısa.', bloc, { rest: r });
          // last exercise transition 0
          bump(CAT.STRENGTH);
          if (i === strengthBlocks.length - 1 && (b.transitionAfterExerciseSeconds || 0) !== 0) add(RC.AUDIT_STRENGTH_TRANSITION_BUDGET_MISMATCH, SEV.CRITICAL, CAT.STRENGTH, 'Son egzersizin geçişi 0 değil.', bloc, { transition: b.transitionAfterExerciseSeconds });
          // forbidden kg deep scan
          bump(CAT.POLICY);
          for (const k of Object.keys(b)) {
            const nk = k.toLowerCase();
            if (FORBIDDEN_KG_KEYS.includes(nk)) add(RC.AUDIT_FORBIDDEN_LOAD_PRESCRIPTION, SEV.CRITICAL, CAT.POLICY, 'Yasaklı yük alanı.', bloc, { key: k });
          }
        }
        // budget sums
        bump(CAT.STRENGTH);
        if (sb) {
          if (workSum !== sb.workBudgetSeconds) add(RC.AUDIT_STRENGTH_WORK_BUDGET_MISMATCH, SEV.CRITICAL, CAT.STRENGTH, 'Çalışma bütçesi eşleşmiyor.', loc, { sum: workSum, expected: sb.workBudgetSeconds });
          if (recoverySum !== sb.recoveryBudgetSeconds) add(RC.AUDIT_STRENGTH_RECOVERY_BUDGET_MISMATCH, SEV.CRITICAL, CAT.STRENGTH, 'Toplanma bütçesi eşleşmiyor.', loc, { sum: recoverySum, expected: sb.recoveryBudgetSeconds });
          if (transitionSum !== sb.transitionBudgetSeconds) add(RC.AUDIT_STRENGTH_TRANSITION_BUDGET_MISMATCH, SEV.CRITICAL, CAT.STRENGTH, 'Geçiş bütçesi eşleşmiyor.', loc, { sum: transitionSum, expected: sb.transitionBudgetSeconds });
          if (strengthTotal !== (d.budgetSnapshot || {}).strengthSeconds) add(RC.AUDIT_STRENGTH_TOTAL_MISMATCH, SEV.CRITICAL, CAT.STRENGTH, 'Kuvvet toplamı eşleşmiyor.', loc, { sum: strengthTotal, expected: (d.budgetSnapshot || {}).strengthSeconds });
        }
        // coverage candidate pool for this session
        const ceiling2 = exp && exp.balancedCaps ? exp.balancedCaps.strengthMovementCap : tmpl.movementCount;
        const candidateTemplates = STRENGTH_TEMPLATES.filter((t) => isStrengthTemplateAvailable(t, settings.availableEquipment) && eligible.includes(t.movementCount) && t.movementCount <= ceiling2);
        const candidateMask = candidateTemplates.reduce((acc, t) => acc | templatePatternMask(t), 0);
        strengthSessions.push({ day: d, templateId, template: tmpl, candidateMask, loc });
      }
    }

    // future block completeness
    bump(CAT.POLICY);
    if (dayBlocks.length === 0) add(RC.AUDIT_BLOCK_ORDER_INVALID, SEV.CRITICAL, CAT.POLICY, 'Boş gün (gelecek blok eksik).', loc);
  }

  // ===== COVERAGE =====
  if (strengthSessions.length > 0) {
    // full-program
    bump(CAT.COVERAGE);
    let reachable = new Set([0]);
    for (const s of strengthSessions) {
      const next = new Set();
      for (const m of reachable) next.add(m | s.candidateMask);
      reachable = new Set([...reachable, ...next]);
    }
    const reachableFull = [...reachable].reduce((a, b) => a | b, 0);
    const actualFull = strengthSessions.reduce((acc, s) => acc | templatePatternMask(s.template), 0);
    if ((reachableFull & FULL_PATTERN_MASK) === FULL_PATTERN_MASK && (actualFull & FULL_PATTERN_MASK) !== FULL_PATTERN_MASK) add(RC.AUDIT_FULL_PATTERN_COVERAGE_MISSED, SEV.CRITICAL, CAT.COVERAGE, 'Ulaşılabilir örüntü kapsamı eksik.', {}, { missing: missingPatterns(actualFull) });
    else if ((reachableFull & FULL_PATTERN_MASK) !== FULL_PATTERN_MASK && (actualFull & FULL_PATTERN_MASK) !== (reachableFull & FULL_PATTERN_MASK)) add(RC.AUDIT_FULL_PATTERN_COVERAGE_MISSED, SEV.CRITICAL, CAT.COVERAGE, 'Mevcut örüntü kapsamı ulaşılabilir maksimum değil.', {}, { actual: actualFull, reachable: reachableFull });
    else if ((reachableFull & FULL_PATTERN_MASK) !== FULL_PATTERN_MASK) add(WC.AUDIT_FULL_PATTERN_COVERAGE_LIMITED, SEV.WARNING, CAT.COVERAGE, 'Tüm örüntüler sınırlarla ulaşılamaz.', {}, { reachable: reachableFull });

    // rolling-4
    if (strengthSessions.length >= 4) {
      for (let i = 0; i + 4 <= strengthSessions.length; i++) {
        bump(CAT.COVERAGE);
        const window = strengthSessions.slice(i, i + 4);
        let r = new Set([0]);
        for (const s of window) { const next = new Set(); for (const m of r) next.add(m | s.candidateMask); r = new Set([...r, ...next]); }
        const reachW = [...r].reduce((a, b) => a | b, 0);
        const actualW = window.reduce((acc, s) => acc | templatePatternMask(s.template), 0);
        if ((reachW & FULL_PATTERN_MASK) === FULL_PATTERN_MASK && (actualW & FULL_PATTERN_MASK) !== FULL_PATTERN_MASK) add(RC.AUDIT_ROLLING_PATTERN_COVERAGE_MISSED, SEV.CRITICAL, CAT.COVERAGE, '4 seanslık pencerede örüntü eksik.', { trainingOrdinal: window[0].day.trainingOrdinal }, { missing: missingPatterns(actualW) });
        else if ((reachW & FULL_PATTERN_MASK) !== FULL_PATTERN_MASK && (actualW & FULL_PATTERN_MASK) !== (reachW & FULL_PATTERN_MASK)) add(RC.AUDIT_ROLLING_PATTERN_COVERAGE_MISSED, SEV.CRITICAL, CAT.COVERAGE, '4 seanslık pencere maksimum kapsamı yakalamıyor.', { trainingOrdinal: window[0].day.trainingOrdinal });
        else if ((reachW & FULL_PATTERN_MASK) !== FULL_PATTERN_MASK) add(WC.AUDIT_ROLLING_PATTERN_COVERAGE_LIMITED, SEV.WARNING, CAT.COVERAGE, '4 seanslık pencerede tüm örüntüler ulaşılamaz.', { trainingOrdinal: window[0].day.trainingOrdinal });
      }
    }
  }

  // ===== REPETITION (warnings) =====
  // strength template 3-consecutive
  bump(CAT.REPETITION);
  for (let i = 0; i + 2 < strengthSessions.length; i++) {
    const a = strengthSessions[i], b = strengthSessions[i + 1], c = strengthSessions[i + 2];
    if (a.templateId === b.templateId && b.templateId === c.templateId) {
      // alternatives available?
      const alts = STRENGTH_TEMPLATES.filter((t) => t.id !== a.templateId && isStrengthTemplateAvailable(t, settings.availableEquipment) && (a.day.budgetSnapshot || {}).eligibleMovementCounts?.includes(t.movementCount));
      if (alts.length > 0) add(WC.AUDIT_EXCESSIVE_TEMPLATE_REPEAT, SEV.WARNING, CAT.REPETITION, 'Aynı şablon 3 ardışık seans.', { trainingOrdinal: a.day.trainingOrdinal }, { templateId: a.templateId });
    }
  }
  // exact session repetition 3+ consecutive (boxing ids + template + prescription signature)
  bump(CAT.REPETITION);
  function sig(day, idx) {
    const ss = strengthSessions[idx];
    const tmpl = ss ? ss.templateId : '';
    const attackIds = (attackSequenceBySession.find((x) => x.day === day) || {}).attackIds || [];
    return `${tmpl}|${attackIds.join(',')}`;
  }
  for (let i = 0; i + 2 < days.length; i++) {
    const s1 = sig(days[i], strengthSessions.findIndex((s) => s.day === days[i]));
    const s2 = sig(days[i + 1], strengthSessions.findIndex((s) => s.day === days[i + 1]));
    const s3 = sig(days[i + 2], strengthSessions.findIndex((s) => s.day === days[i + 2]));
    if (s1 === s2 && s2 === s3 && s1 !== '|') add(WC.AUDIT_EXCESSIVE_SESSION_REPETITION, SEV.WARNING, CAT.REPETITION, '3 ardışık seans birebir kopya.', { trainingOrdinal: days[i].trainingOrdinal });
  }

  // ===== WEEKLY structural warnings (adjacent strength, consecutive density) =====
  bump(CAT.WEEKLY_BALANCE);
  const roles = planWeeklyRoles(settings.programMode, settings.selectedWeekdays, settings.strengthDaysPerWeek || 0);
  const metrics = computeWeeklyMetrics(roles, settings.sessionDurationMinutes);
  if (metrics.adjacentStrengthPairCount > 0) {
    // unavoidable? check if non-adjacent selection possible
    add(WC.AUDIT_ADJACENT_STRENGTH_DAYS_UNAVOIDABLE, SEV.WARNING, CAT.WEEKLY_BALANCE, 'Kuvvet günleri yan yana.');
  }
  if (metrics.maxConsecutiveTrainingDays >= 4) add(WC.AUDIT_HIGH_CONSECUTIVE_TRAINING_DENSITY, SEV.WARNING, CAT.WEEKLY_BALANCE, 'Üst üste 4+ antrenman günü.');
  if (metrics.unscheduledDayCount === 0 && metrics.trainingDayCount === 7) add(WC.AUDIT_NO_UNSCHEDULED_WEEKDAY_GAP, SEV.WARNING, CAT.WEEKLY_BALANCE, 'Haftada boş gün yok.');

  return finalize(findings, checkSummary, snapshot, recomputedFp);
}

function finalize(findings, checkSummary, snapshot, recomputedFp) {
  const critical = findings.filter((f) => f.severity === SEV.CRITICAL).length;
  const warnings = findings.filter((f) => f.severity === SEV.WARNING).length;
  const outcome = critical === 0 ? PROGRAM_AUDIT_OUTCOMES.PASS : PROGRAM_AUDIT_OUTCOMES.FAIL;
  const programVersionId = snapshot && snapshot.programVersion ? snapshot.programVersion.id : '';
  const blueprintFingerprint = snapshot && snapshot.programVersion ? snapshot.programVersion.blueprintFingerprint : '';
  // deterministic finding signature (sorted codes + locations + details)
  const findingSig = findings.slice().sort((a, b) => (a.code + JSON.stringify(a.location) + JSON.stringify(a.details)).localeCompare(b.code + JSON.stringify(b.location) + JSON.stringify(b.details))).map((f) => `${f.code}@${f.location.trainingOrdinal || ''}:${f.location.orderIndex ?? ''}`).join('|');
  const auditFingerprint = `AFP_${stableHash([programVersionId, blueprintFingerprint, String(LOCAL_PROGRAM_AUDIT_ENGINE_VERSION), outcome, findingSig, JSON.stringify(checkSummary)].join('|'))}`;
  return { success: true, outcome, criticalIssueCount: critical, warningCount: warnings, findings, checkSummary, auditFingerprint, recomputedFingerprint: recomputedFp || null };
}