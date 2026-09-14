import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  clearScreen: false,
  logLevel: 'error',
});

try {
  const { generateProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
  const { auditProgramSnapshot } = await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
  const { validateProgramPreferences, DEFAULT_FORM } = await server.ssrLoadModule('/src/features/programCreate/programPreferences.js');
  const { buildSessionTimeBudget } = await server.ssrLoadModule('/src/features/sessionBudget/sessionTimeBudgetEngine.js');
  const { COMBINED_MIN_SESSION_MINUTES } = await server.ssrLoadModule('/src/features/sessionBudget/sessionDurationPolicy.js');
  const {
    PROGRAM_MODES,
    PROGRAM_DURATION_MONTHS,
    EXPERIENCE_LEVELS,
    DIFFICULTY_LEVELS,
    BOXING_STANCES,
    STRENGTH_EQUIPMENT,
    SESSION_BUDGET_REASON_CODES,
  } = await server.ssrLoadModule('/src/config/architecture.js');

  assert.equal(COMBINED_MIN_SESSION_MINUTES, 30);

  const equipment = Object.values(STRENGTH_EQUIPMENT);
  const durations = Object.values(PROGRAM_DURATION_MONTHS);
  const experiences = Object.values(EXPERIENCE_LEVELS);
  const difficulties = Object.values(DIFFICULTY_LEVELS);
  const selectedWeekdays = ['MONDAY', 'TUESDAY', 'THURSDAY', 'SATURDAY'];

  const preference20 = {
    ...DEFAULT_FORM,
    programMode: PROGRAM_MODES.BOXING_AND_STRENGTH,
    durationMonths: PROGRAM_DURATION_MONTHS.ONE,
    daysPerWeek: 4,
    selectedWeekdays,
    sessionDurationMode: 'preset',
    sessionDurationMinutes: 20,
    experienceLevel: EXPERIENCE_LEVELS.BEGINNER,
    difficulty: DIFFICULTY_LEVELS.NORMAL,
    boxingStance: BOXING_STANCES.ORTHODOX,
    boxingMaxMoves: 4,
    strengthDaysPerWeek: 2,
    availableEquipment: equipment,
  };
  const preference30 = { ...preference20, sessionDurationMinutes: 30 };
  assert.equal(validateProgramPreferences(preference20).valid, false, '20-minute combined preference must fail closed.');
  assert.equal(validateProgramPreferences(preference30).valid, true, '30-minute combined preference must be accepted.');

  const shortCombinedBudget = buildSessionTimeBudget({
    programMode: PROGRAM_MODES.BOXING_AND_STRENGTH,
    sessionDurationMinutes: 20,
    experienceLevel: EXPERIENCE_LEVELS.BEGINNER,
    difficulty: DIFFICULTY_LEVELS.NORMAL,
  });
  assert.equal(shortCombinedBudget.valid, false, '20-minute combined session budget must fail closed.');
  assert.ok(shortCombinedBudget.reasons.includes(SESSION_BUDGET_REASON_CODES.SESSION_INVALID_CUSTOM_DURATION));

  const shortStrengthBudget = buildSessionTimeBudget({
    programMode: PROGRAM_MODES.STRENGTH_ONLY,
    sessionDurationMinutes: 15,
    experienceLevel: EXPERIENCE_LEVELS.BEGINNER,
    difficulty: DIFFICULTY_LEVELS.NORMAL,
  });
  assert.equal(shortStrengthBudget.valid, true, '15-minute strength-only budget must remain supported.');

  let caseIndex = 0;
  let strengthPassCount = 0;
  let combined30PassCount = 0;
  let combined20FailCount = 0;

  const makeInput = ({ mode, durationMonths, sessionDurationMinutes, experienceLevel, difficulty }) => ({
    programMode: mode,
    durationMonths,
    daysPerWeek: 4,
    selectedWeekdays,
    sessionDurationMinutes,
    experienceLevel,
    difficulty,
    preferredTrainingTime: null,
    boxingStance: mode === PROGRAM_MODES.STRENGTH_ONLY ? null : BOXING_STANCES.ORTHODOX,
    boxingMaxMoves: mode === PROGRAM_MODES.STRENGTH_ONLY ? null : 4,
    strengthDaysPerWeek: mode === PROGRAM_MODES.STRENGTH_ONLY ? 4 : 2,
    availableEquipment: equipment,
    generationLocalDate: '2026-01-05',
    generationSeed: `strength-regression-seed-${caseIndex}`,
    generationRequestId: `strength-regression-request-${caseIndex++}`,
  });

  for (const durationMonths of durations) {
    for (const experienceLevel of experiences) {
      for (const difficulty of difficulties) {
        const strength = generateProgramBlueprint(makeInput({
          mode: PROGRAM_MODES.STRENGTH_ONLY,
          durationMonths,
          sessionDurationMinutes: 15,
          experienceLevel,
          difficulty,
        }));
        assert.equal(strength.valid, true, `15-minute strength-only generation failed: ${durationMonths}/${experienceLevel}/${difficulty} ${JSON.stringify(strength.reasons)}`);
        const strengthAudit = auditProgramSnapshot(strength.blueprint);
        assert.equal(strengthAudit.outcome, 'pass', `15-minute strength-only audit failed: ${durationMonths}/${experienceLevel}/${difficulty}`);
        strengthPassCount += 1;

        const combined20 = generateProgramBlueprint(makeInput({
          mode: PROGRAM_MODES.BOXING_AND_STRENGTH,
          durationMonths,
          sessionDurationMinutes: 20,
          experienceLevel,
          difficulty,
        }));
        assert.equal(combined20.valid, false, `20-minute combined generation must fail closed: ${durationMonths}/${experienceLevel}/${difficulty}`);
        combined20FailCount += 1;

        const combined30 = generateProgramBlueprint(makeInput({
          mode: PROGRAM_MODES.BOXING_AND_STRENGTH,
          durationMonths,
          sessionDurationMinutes: 30,
          experienceLevel,
          difficulty,
        }));
        assert.equal(combined30.valid, true, `30-minute combined generation failed: ${durationMonths}/${experienceLevel}/${difficulty} ${JSON.stringify(combined30.reasons)}`);
        const combinedAudit = auditProgramSnapshot(combined30.blueprint);
        assert.equal(combinedAudit.outcome, 'pass', `30-minute combined audit failed: ${durationMonths}/${experienceLevel}/${difficulty}`);
        combined30PassCount += 1;
      }
    }
  }

  assert.equal(strengthPassCount, 27);
  assert.equal(combined20FailCount, 27);
  assert.equal(combined30PassCount, 27);

  console.log(`PASS strength-generation-regression: strength15=${strengthPassCount}/27 combined20FailClosed=${combined20FailCount}/27 combined30=${combined30PassCount}/27`);
} finally {
  await server.close();
}
