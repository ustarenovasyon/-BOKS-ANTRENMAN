import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const fixtureUrl = new URL('./fixtures/v1/6m-beginner-4dpw.json', import.meta.url);
const fixture = JSON.parse(await readFile(fixtureUrl, 'utf8'));

const requiredInputKeys = [
  'programMode',
  'durationMonths',
  'daysPerWeek',
  'selectedWeekdays',
  'sessionDurationMinutes',
  'experienceLevel',
  'difficulty',
  'preferredTrainingTime',
  'boxingStance',
  'boxingMaxMoves',
  'strengthDaysPerWeek',
  'availableEquipment',
  'generationLocalDate',
  'generationSeed',
  'generationRequestId',
];

for (const key of requiredInputKeys) {
  assert.ok(Object.hasOwn(fixture.input, key), `Fixture input is not self-contained: missing ${key}`);
}
assert.ok(fixture.input.generationSeed, 'Fixture generationSeed must be explicit.');
assert.ok(fixture.input.generationRequestId, 'Fixture generationRequestId must be explicit.');
assert.equal(fixture.historicalReference.status, 'historical_unreproducible');
assert.equal(fixture.historicalReference.blueprintFingerprint, 'FP_9698c40e');
assert.equal(fixture.historicalReference.auditFingerprint, 'AFP_628181959');
assert.notEqual(fixture.expected.blueprintFingerprint, fixture.historicalReference.blueprintFingerprint);
assert.notEqual(fixture.expected.auditFingerprint, fixture.historicalReference.auditFingerprint);

const clone = (value) => JSON.parse(JSON.stringify(value));
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  clearScreen: false,
  logLevel: 'error',
});

try {
  const { generateProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
  const { auditProgramSnapshot } = await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
  const {
    BOXING_MOVEMENT_TYPES,
    BOXING_FAMILIES,
    WORKOUT_BLOCK_TYPES,
  } = await server.ssrLoadModule('/src/config/architecture.js');
  const {
    BOXING_MOVES,
    validateBoxingMoveLibrary,
  } = await server.ssrLoadModule('/src/features/boxing/library/boxingMoves.js');
  const {
    BOXING_COMBINATIONS,
    validateCombinationLibrary,
  } = await server.ssrLoadModule('/src/features/boxing/combinations/boxingCombinations.js');
  const {
    DEFENSE_COUNTER_RULES,
    DEFENSE_COUNTER_RULE_IDS,
    validateDefenseCounterLibrary,
  } = await server.ssrLoadModule('/src/features/boxing/defense/defenseCounterRules.js');
  const { validateCurriculumCoverage } = await server.ssrLoadModule('/src/features/boxing/curriculum/boxingTechniqueCurriculum.js');

  assert.deepEqual(validateBoxingMoveLibrary(BOXING_MOVES), { valid: true });
  assert.deepEqual(validateCombinationLibrary(BOXING_COMBINATIONS), { valid: true });
  assert.deepEqual(validateDefenseCounterLibrary(DEFENSE_COUNTER_RULES), { valid: true });

  const curriculumCoverage = validateCurriculumCoverage();
  assert.equal(curriculumCoverage.valid, true, `Curriculum coverage failed: ${JSON.stringify(curriculumCoverage)}`);
  assert.equal(curriculumCoverage.libraryCount, fixture.expected.boxingMovementCount);
  assert.equal(curriculumCoverage.curriculumCount, fixture.expected.boxingMovementCount);

  const footworkMoves = BOXING_MOVES.filter((move) => move.movementType === BOXING_MOVEMENT_TYPES.FOOTWORK);
  assert.equal(BOXING_MOVES.length, fixture.expected.boxingMovementCount);
  assert.equal(footworkMoves.length, fixture.expected.footworkMovementCount);
  assert.equal(BOXING_COMBINATIONS.length, fixture.expected.attackCombinationCount);
  assert.equal(DEFENSE_COUNTER_RULES.length, fixture.expected.v1DefenseRuleCount);

  const first = generateProgramBlueprint(clone(fixture.input));
  const second = generateProgramBlueprint(clone(fixture.input));

  assert.equal(first.valid, true, `First generation failed: ${JSON.stringify(first.reasons)}`);
  assert.equal(second.valid, true, `Second generation failed: ${JSON.stringify(second.reasons)}`);
  assert.deepStrictEqual(first.blueprint, second.blueprint, 'Two independent runs must produce deep-equal blueprints.');

  const blueprint = first.blueprint;
  const version = blueprint.programVersion;

  assert.equal(blueprint.programDays.length, fixture.expected.totalPlannedTrainingSessions);
  assert.equal(version.totalPlannedTrainingSessions, fixture.expected.totalPlannedTrainingSessions);
  assert.equal(version.programStartDate, fixture.expected.programStartDate);
  assert.equal(version.endDateExclusive, fixture.expected.endDateExclusive);
  assert.equal(version.generationSeed, fixture.input.generationSeed);
  assert.equal(version.generationRequestId, fixture.input.generationRequestId);
  assert.equal(version.generationPolicyVersion, fixture.expected.generationPolicyVersion);
  assert.equal(version.engineVersions.boxingMoveLibraryVersion, fixture.expected.boxingMoveLibraryVersion);
  assert.equal(blueprint.blueprintFingerprint, fixture.expected.blueprintFingerprint);
  assert.equal(version.blueprintFingerprint, fixture.expected.blueprintFingerprint);

  const moveById = new Map(BOXING_MOVES.map((move) => [move.id, move]));
  let attackBlockCount = 0;
  let defenseBlockCount = 0;

  for (const block of blueprint.workoutBlocks) {
    assert.equal(Object.hasOwn(block, 'footworkPrescription'), false, 'V1 generated workout must not contain footworkPrescription.');

    if (block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK) {
      attackBlockCount += 1;
      assert.ok(Array.isArray(block.moveIds) && block.moveIds.length > 0, `Attack block ${block.id} must have moveIds.`);
      assert.equal(block.moveCount, block.moveIds.length, `Attack block ${block.id} moveCount mismatch.`);
      for (const moveId of block.moveIds) {
        const move = moveById.get(moveId);
        assert.ok(move, `Unknown attack move: ${moveId}`);
        assert.equal(move.movementType, BOXING_MOVEMENT_TYPES.STRIKE, `Defense/footwork leaked into attack moveIds: ${moveId}`);
      }
    }

    if (block.type === WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK) {
      defenseBlockCount += 1;
      assert.ok(DEFENSE_COUNTER_RULE_IDS.includes(block.defenseRuleId), `Non-V1 defense rule leaked into generated workout: ${block.defenseRuleId}`);
      const defenseMove = moveById.get(block.defenseMoveId);
      assert.ok(defenseMove, `Unknown defense move: ${block.defenseMoveId}`);
      assert.equal(defenseMove.movementType, BOXING_MOVEMENT_TYPES.DEFENSE);
      assert.equal(defenseMove.family, BOXING_FAMILIES.SLIP, `Catch/other defense leaked into V1 generated workout: ${block.defenseMoveId}`);
      for (const moveId of block.counterMoveIds || []) {
        const counterMove = moveById.get(moveId);
        assert.ok(counterMove, `Unknown counter move: ${moveId}`);
        assert.equal(counterMove.movementType, BOXING_MOVEMENT_TYPES.STRIKE, `Non-strike counter leaked into V1 defense block: ${moveId}`);
      }
    }
  }

  assert.ok(attackBlockCount > 0, 'Fixture must exercise attack generation.');
  assert.ok(defenseBlockCount > 0, 'Fixture must exercise V1 defense generation.');

  const firstAudit = auditProgramSnapshot(first.blueprint);
  const secondAudit = auditProgramSnapshot(second.blueprint);
  assert.deepStrictEqual(firstAudit, secondAudit, 'Two independent audit runs must be deep-equal.');
  assert.equal(firstAudit.outcome, fixture.expected.auditOutcome);
  assert.equal(firstAudit.criticalIssueCount, fixture.expected.criticalIssueCount);
  assert.equal(firstAudit.warningCount, fixture.expected.warningCount);
  assert.equal(firstAudit.auditFingerprint, fixture.expected.auditFingerprint);
  assert.equal(firstAudit.recomputedFingerprint, fixture.expected.blueprintFingerprint);

  console.log(
    `PASS ${fixture.id}: sessions=${blueprint.programDays.length} FP=${blueprint.blueprintFingerprint} AFP=${firstAudit.auditFingerprint} attackBlocks=${attackBlockCount} defenseBlocks=${defenseBlockCount}`,
  );
} finally {
  await server.close();
}
