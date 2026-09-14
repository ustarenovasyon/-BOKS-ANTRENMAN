import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', clearScreen: false, logLevel: 'error' });

const minutesScan = Array.from({ length: 51 }, (_, i) => i + 10); // 10..60
const presetMinutes = [15, 20, 30, 40, 45, 60];
const smokeMinutes = [10, 15, 20, 25, 30, 40, 45, 60, 90, 120];

const fmtKey = (...xs) => xs.join('|');
const countBy = (arr, keyFn) => {
  const out = new Map();
  for (const item of arr) {
    const k = keyFn(item);
    out.set(k, (out.get(k) || 0) + 1);
  }
  return out;
};
const intervals = (values) => {
  if (!values.length) return '-';
  const sorted = [...values].sort((a,b)=>a-b);
  const ranges = [];
  let start = sorted[0], prev = sorted[0];
  for (let i=1;i<sorted.length;i++) {
    const v = sorted[i];
    if (v === prev + 1) { prev = v; continue; }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    start = prev = v;
  }
  ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
  return ranges.join(',');
};

try {
  const arch = await server.ssrLoadModule('/src/config/architecture.js');
  const { generateProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
  const { auditProgramSnapshot } = await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
  const { buildSessionTimeBudget } = await server.ssrLoadModule('/src/features/sessionBudget/sessionTimeBudgetEngine.js');
  const { fitStrengthPrescription } = await server.ssrLoadModule('/src/features/programGeneration/strengthPrescriptionFitter.js');
  const { STRENGTH_TEMPLATES, isStrengthTemplateAvailable, validateStrengthTemplateLibrary } = await server.ssrLoadModule('/src/features/strength/templates/strengthTemplates.js');
  const { STRENGTH_EXERCISES, validateStrengthExerciseLibrary } = await server.ssrLoadModule('/src/features/strength/library/strengthExercises.js');
  const { BOXING_MOVES, validateBoxingMoveLibrary } = await server.ssrLoadModule('/src/features/boxing/library/boxingMoves.js');
  const { BOXING_COMBINATIONS, validateCombinationLibrary } = await server.ssrLoadModule('/src/features/boxing/combinations/boxingCombinations.js');
  const { DEFENSE_COUNTER_RULES, validateDefenseCounterLibrary } = await server.ssrLoadModule('/src/features/boxing/defense/defenseCounterRules.js');
  const { validateCurriculumCoverage } = await server.ssrLoadModule('/src/features/boxing/curriculum/boxingTechniqueCurriculum.js');

  const {
    PROGRAM_MODES, PROGRAM_DURATION_MONTHS, EXPERIENCE_LEVELS, DIFFICULTY_LEVELS,
    BOXING_STANCES, STRENGTH_EQUIPMENT, WORKOUT_BLOCK_TYPES, WEEKLY_SESSION_ROLES,
  } = arch;

  const modes = Object.values(PROGRAM_MODES);
  const durations = Object.values(PROGRAM_DURATION_MONTHS);
  const experiences = Object.values(EXPERIENCE_LEVELS);
  const difficulties = Object.values(DIFFICULTY_LEVELS);
  const allEquipment = Object.values(STRENGTH_EQUIPMENT);
  const equipmentSets = allEquipment.map((e) => [e]).concat([allEquipment]);

  console.log('=== LIBRARY / CURRICULUM VALIDATION ===');
  console.log('boxingMoves', validateBoxingMoveLibrary(BOXING_MOVES));
  console.log('boxingCombos', validateCombinationLibrary(BOXING_COMBINATIONS));
  console.log('defenseRules', validateDefenseCounterLibrary(DEFENSE_COUNTER_RULES));
  console.log('strengthExercises', validateStrengthExerciseLibrary(STRENGTH_EXERCISES));
  console.log('strengthTemplates', validateStrengthTemplateLibrary(STRENGTH_TEMPLATES));
  console.log('curriculum', validateCurriculumCoverage());

  assert.equal(validateBoxingMoveLibrary(BOXING_MOVES).valid, true);
  assert.equal(validateCombinationLibrary(BOXING_COMBINATIONS).valid, true);
  assert.equal(validateDefenseCounterLibrary(DEFENSE_COUNTER_RULES).valid, true);
  assert.equal(validateStrengthExerciseLibrary(STRENGTH_EXERCISES).valid, true);
  assert.equal(validateStrengthTemplateLibrary(STRENGTH_TEMPLATES).valid, true);
  assert.equal(validateCurriculumCoverage().valid, true);

  console.log('\n=== SESSION BUDGET EXHAUSTIVE 10..120 ===');
  let budgetCases = 0;
  for (const mode of modes) for (let min=10; min<=120; min++) for (const exp of experiences) for (const diff of difficulties) {
    const b = buildSessionTimeBudget({ programMode: mode, sessionDurationMinutes: min, experienceLevel: exp, difficulty: diff });
    assert.equal(b.valid, true, `budget invalid ${fmtKey(mode,min,exp,diff)} ${JSON.stringify(b.reasons)}`);
    assert.equal(b.validation.exactTotal, true, `budget total mismatch ${fmtKey(mode,min,exp,diff)}`);
    const boxingSegSum = (b.boxingBudget?.intervalSegments || []).reduce((s,x)=>s+x.durationSeconds,0);
    assert.equal(boxingSegSum, b.blocks.boxingSeconds, `boxing budget mismatch ${fmtKey(mode,min,exp,diff)}`);
    const sb = b.strengthBudget || {};
    const strengthInternal = (sb.workBudgetSeconds||0)+(sb.recoveryBudgetSeconds||0)+(sb.transitionBudgetSeconds||0);
    assert.equal(strengthInternal, b.blocks.strengthSeconds, `strength budget mismatch ${fmtKey(mode,min,exp,diff)}`);
    budgetCases++;
  }
  console.log(`PASS budgetCases=${budgetCases}`);

  console.log('\n=== COMBINED STRENGTH FITTER MINIMUM MINUTES ===');
  for (const diff of difficulties) {
    for (const tierKey of ['tier_1','tier_2','tier_3','tier_4']) {
      const fitting = [];
      for (const min of minutesScan) {
        const b = buildSessionTimeBudget({ programMode: PROGRAM_MODES.BOXING_AND_STRENGTH, sessionDurationMinutes: min, experienceLevel: EXPERIENCE_LEVELS.BEGINNER, difficulty: diff });
        const eligible = b.strengthBudget.eligibleMovementCounts;
        const templates = STRENGTH_TEMPLATES.filter((t)=>eligible.includes(t.movementCount) && isStrengthTemplateAvailable(t, allEquipment));
        const ok = templates.some((t)=>fitStrengthPrescription({ template:t, tierKey, budgets:b.strengthBudget, generationSeed:'diag', trainingOrdinal:1 }).valid);
        if (ok) fitting.push(min);
      }
      console.log(`FITTER diff=${diff} tier=${tierKey} validMinutes=${intervals(fitting)}`);
    }
  }

  let caseNo = 0;
  const makeInput = ({ mode, duration, min, exp, diff, equipment=allEquipment, days=4, strengthDays=2, maxMoves=4 }) => ({
    programMode: mode,
    durationMonths: duration,
    daysPerWeek: days,
    selectedWeekdays: ['MONDAY','TUESDAY','THURSDAY','SATURDAY'].slice(0, days),
    sessionDurationMinutes: min,
    experienceLevel: exp,
    difficulty: diff,
    preferredTrainingTime: null,
    boxingStance: mode === PROGRAM_MODES.STRENGTH_ONLY ? null : BOXING_STANCES.ORTHODOX,
    boxingMaxMoves: mode === PROGRAM_MODES.STRENGTH_ONLY ? null : maxMoves,
    strengthDaysPerWeek: mode === PROGRAM_MODES.BOXING_AND_STRENGTH ? Math.min(strengthDays, days) : (mode === PROGRAM_MODES.STRENGTH_ONLY ? days : 0),
    availableEquipment: mode === PROGRAM_MODES.BOXING_ONLY ? [] : equipment,
    generationLocalDate: '2026-01-05',
    generationSeed: `diag-seed-${caseNo}`,
    generationRequestId: `diag-req-${caseNo++}`,
  });

  const structuralCheck = (result, input) => {
    if (!result.valid) return null;
    const bp = result.blueprint;
    const blocksByDay = new Map();
    for (const b of bp.workoutBlocks) {
      if (!blocksByDay.has(b.programDayId)) blocksByDay.set(b.programDayId, []);
      blocksByDay.get(b.programDayId).push(b);
    }
    for (const day of bp.programDays) {
      const blocks = blocksByDay.get(day.id) || [];
      const sum = blocks.reduce((s,b)=>s+(b.plannedSeconds||0),0);
      assert.equal(sum, input.sessionDurationMinutes*60, `day total mismatch ${day.id}`);
      const strengthCount = blocks.filter((b)=>b.type===WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE).length;
      const boxingCount = blocks.filter((b)=>b.type===WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK || b.type===WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK).length;
      if (day.sessionRole===WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY) {
        assert.ok(strengthCount>0, `combined day missing strength ${day.id}`);
        assert.ok(boxingCount>0, `combined day missing boxing ${day.id}`);
      }
      if (day.sessionRole===WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY) assert.ok(strengthCount>0, `strength-only day missing strength ${day.id}`);
      if (day.sessionRole===WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY) assert.ok(boxingCount>0, `boxing-only day missing boxing ${day.id}`);
    }
    return bp;
  };

  console.log('\n=== FULL GENERATOR: COMBINED 10..60 MATRIX ===');
  const combinedResults = [];
  for (const duration of durations) for (const exp of experiences) for (const diff of difficulties) {
    for (const min of minutesScan) {
      const input = makeInput({ mode: PROGRAM_MODES.BOXING_AND_STRENGTH, duration, min, exp, diff });
      const result = generateProgramBlueprint(input);
      structuralCheck(result, input);
      combinedResults.push({ duration, exp, diff, min, valid: result.valid, reason: result.reasons?.[0] || null });
    }
  }
  const failReasons = countBy(combinedResults.filter(x=>!x.valid), x=>x.reason||'UNKNOWN');
  console.log(`combinedCases=${combinedResults.length} valid=${combinedResults.filter(x=>x.valid).length} invalid=${combinedResults.filter(x=>!x.valid).length}`);
  console.log('combinedFailReasons', Object.fromEntries(failReasons));
  for (const duration of durations) for (const exp of experiences) for (const diff of difficulties) {
    const rows = combinedResults.filter(x=>x.duration===duration && x.exp===exp && x.diff===diff);
    const invalidMins = rows.filter(x=>!x.valid).map(x=>x.min);
    if (invalidMins.length) {
      const reasons = [...new Set(rows.filter(x=>!x.valid).map(x=>x.reason))];
      console.log(`COMBINED_FAIL duration=${duration} exp=${exp} diff=${diff} minutes=${intervals(invalidMins)} reasons=${reasons.join(',')}`);
    }
  }
  for (const min of presetMinutes) {
    const rows = combinedResults.filter(x=>x.min===min);
    console.log(`COMBINED_PRESET ${min}m valid=${rows.filter(x=>x.valid).length}/${rows.length}`);
  }

  console.log('\n=== FULL GENERATOR: BOXING/STRENGTH-ONLY SMOKE ===');
  for (const mode of [PROGRAM_MODES.BOXING_ONLY, PROGRAM_MODES.STRENGTH_ONLY]) {
    const results=[];
    for (const duration of durations) for (const exp of experiences) for (const diff of difficulties) for (const min of smokeMinutes) {
      const input = makeInput({ mode, duration, min, exp, diff, strengthDays:4 });
      const result = generateProgramBlueprint(input);
      structuralCheck(result, input);
      results.push({duration,exp,diff,min,valid:result.valid,reason:result.reasons?.[0]||null});
    }
    console.log(`${mode} cases=${results.length} valid=${results.filter(x=>x.valid).length} invalid=${results.filter(x=>!x.valid).length}`);
    const fr = countBy(results.filter(x=>!x.valid), x=>x.reason||'UNKNOWN');
    console.log(`${mode} failReasons`, Object.fromEntries(fr));
    for (const r of results.filter(x=>!x.valid).slice(0,30)) console.log(`${mode}_FAIL`, r);
  }

  console.log('\n=== COMBINED EQUIPMENT PRESET MATRIX (1M) ===');
  for (const equipment of equipmentSets) {
    let valid=0,total=0; const reasons=[];
    for (const exp of experiences) for (const diff of difficulties) for (const min of presetMinutes) {
      const input=makeInput({mode:PROGRAM_MODES.BOXING_AND_STRENGTH,duration:1,min,exp,diff,equipment});
      const result=generateProgramBlueprint(input); total++;
      structuralCheck(result,input);
      if(result.valid) valid++; else reasons.push(result.reasons?.[0]||'UNKNOWN');
    }
    console.log(`EQUIPMENT ${equipment.join('+')} valid=${valid}/${total} failReasons=${JSON.stringify(Object.fromEntries(countBy(reasons,x=>x)))}`);
  }

  console.log('\n=== AUDIT REPRESENTATIVE VALID COMBINED PRESETS ===');
  let auditCases=0, auditFails=0;
  for (const duration of durations) for (const exp of experiences) for (const diff of difficulties) for (const min of presetMinutes) {
    const input=makeInput({mode:PROGRAM_MODES.BOXING_AND_STRENGTH,duration,min,exp,diff});
    const result=generateProgramBlueprint(input);
    if(!result.valid) continue;
    const audit=auditProgramSnapshot(result.blueprint); auditCases++;
    if(audit.outcome!=='pass') { auditFails++; console.log('AUDIT_FAIL',{duration,exp,diff,min,critical:audit.criticalIssueCount,warnings:audit.warningCount,findings:audit.findings.map(f=>f.code)}); }
  }
  console.log(`auditCases=${auditCases} auditFails=${auditFails}`);

  console.log('\nDIAGNOSTIC_COMPLETE');
} finally {
  await server.close();
}
