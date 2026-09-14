import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const fixture = JSON.parse(await readFile(new URL('./fixtures/v1/6m-beginner-4dpw.json', import.meta.url), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  clearScreen: false,
  logLevel: 'error',
});

try {
  const {
    BOXING_TECHNIQUE_INSTRUCTION_MODE,
    getBoxingTechniqueInstruction,
    buildWorkoutBlockInstructionSequence,
    validateTechniqueInstructionCoverage,
  } = await server.ssrLoadModule('/src/features/boxing/instructions/boxingTechniqueInstructions.js');
  const { BOXING_MOVES, BOXING_MOVE_IDS } = await server.ssrLoadModule('/src/features/boxing/library/boxingMoves.js');
  const { generateProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
  const { WORKOUT_BLOCK_TYPES } = await server.ssrLoadModule('/src/config/architecture.js');

  const coverage = validateTechniqueInstructionCoverage();
  assert.equal(coverage.valid, true);
  assert.equal(coverage.activeMoveCount, 18);
  assert.equal(coverage.coveredMoveCount, 18);
  assert.deepEqual(coverage.missing, []);

  for (const move of BOXING_MOVES) {
    const instruction = getBoxingTechniqueInstruction(move.id);
    assert.ok(instruction, `${move.id} instruction missing`);
    assert.equal(instruction.movementId, move.id);
    assert.equal(instruction.canonicalName, move.canonicalName);
    assert.equal(instruction.mode, BOXING_TECHNIQUE_INSTRUCTION_MODE);
    for (const key of ['techniqueCue', 'guardReminder', 'balanceReminder', 'repetitionObjective']) {
      assert.equal(typeof instruction[key], 'string');
      assert.ok(instruction[key].trim().length > 0, `${move.id}.${key} must be non-empty`);
    }
    for (const forbidden of ['score', 'accuracy', 'confidence', 'detected', 'measured', 'isCorrect', 'guardCorrect', 'balanceCorrect']) {
      assert.equal(Object.hasOwn(instruction, forbidden), false, `${move.id} must not expose observed metric ${forbidden}`);
    }
    const text = [instruction.techniqueCue, instruction.guardReminder, instruction.balanceReminder, instruction.repetitionObjective].join(' ').toLowerCase();
    assert.equal(/\bsol\b/.test(text), false, `${move.id} must remain stance-relative (no absolute left)`);
    assert.equal(/\bsağ\b/.test(text), false, `${move.id} must remain stance-relative (no absolute right)`);
  }

  assert.equal(getBoxingTechniqueInstruction('BOX_UNKNOWN'), null);

  const attack = {
    type: WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK,
    moveIds: [BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS],
    moveCount: 2,
    plannedSeconds: 120,
    footworkPrescription: {
      actions: [
        { phase: 'before_combo', movementId: BOXING_MOVE_IDS.STEP_IN },
        { phase: 'after_combo', movementId: BOXING_MOVE_IDS.STEP_OUT },
      ],
    },
  };
  const attackBefore = clone(attack);
  const attackSequence = buildWorkoutBlockInstructionSequence(attack);
  assert.deepEqual(
    attackSequence.map((step) => [step.phase, step.instruction.movementId]),
    [
      ['before_combo', BOXING_MOVE_IDS.STEP_IN],
      ['combo', BOXING_MOVE_IDS.JAB],
      ['combo', BOXING_MOVE_IDS.CROSS],
      ['after_combo', BOXING_MOVE_IDS.STEP_OUT],
    ],
  );
  assert.deepEqual(attack, attackBefore, 'Instruction sequence builder must not mutate attack block.');
  assert.equal(attack.moveCount, 2, 'Footwork instruction must not change punch moveCount.');
  assert.equal(attack.plannedSeconds, 120, 'Instruction layer must not add time.');

  const defense = {
    type: WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK,
    defenseMoveId: BOXING_MOVE_IDS.SLIP_LEAD,
    counterMoveIds: [BOXING_MOVE_IDS.CROSS],
  };
  const defenseSequence = buildWorkoutBlockInstructionSequence(defense);
  assert.deepEqual(
    defenseSequence.map((step) => [step.phase, step.instruction.movementId]),
    [
      ['defense', BOXING_MOVE_IDS.SLIP_LEAD],
      ['counter', BOXING_MOVE_IDS.CROSS],
    ],
  );

  const isolated = {
    type: WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE,
    footworkMoveId: BOXING_MOVE_IDS.STEP_LEAD_SIDE,
    plannedSeconds: 60,
  };
  const isolatedSequence = buildWorkoutBlockInstructionSequence(isolated);
  assert.deepEqual(
    isolatedSequence.map((step) => [step.phase, step.instruction.movementId]),
    [['isolated_technique', BOXING_MOVE_IDS.STEP_LEAD_SIDE]],
  );

  const generated = generateProgramBlueprint(clone(fixture.input));
  assert.equal(generated.valid, true);
  assert.equal(generated.blueprint.blueprintFingerprint, fixture.expected.blueprintFingerprint, 'PART 37 must not change canonical V1 fingerprint.');
  for (const block of generated.blueprint.workoutBlocks) {
    assert.equal(Object.hasOwn(block, 'techniqueCue'), false);
    assert.equal(Object.hasOwn(block, 'guardReminder'), false);
    assert.equal(Object.hasOwn(block, 'balanceReminder'), false);
    assert.equal(Object.hasOwn(block, 'repetitionObjective'), false);
    assert.equal(Object.hasOwn(block, 'instructionScore'), false);
  }

  console.log('PASS part37-technique-instruction-regression: coverage=18/18 instruction-only V1-lock');
} finally {
  await server.close();
}
