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
  const { generateProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
  const { validateFullProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programBlueprintValidator.js');
  const { computeBlueprintFingerprint } = await server.ssrLoadModule('/src/features/programGeneration/blueprintFingerprint.js');
  const { auditProgramSnapshot } = await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
  const { AUDIT_REASON_CODES } = await server.ssrLoadModule('/src/features/programAudit/programAuditConstants.js');
  const { buildDayBlocks } = await server.ssrLoadModule('/src/features/programGeneration/workoutBlockBuilder.js');
  const {
    buildFootworkTechniqueDescriptor,
    getEligibleFootworkMoveIdsAtStage,
    validateFootworkTechniqueBlock,
  } = await server.ssrLoadModule('/src/features/programGeneration/footworkTechniqueBlock.js');
  const {
    BOXING_MOVE_IDS,
  } = await server.ssrLoadModule('/src/features/boxing/library/boxingMoves.js');
  const {
    BOXING_CURRICULUM_STAGES,
  } = await server.ssrLoadModule('/src/features/boxing/curriculum/boxingTechniqueCurriculum.js');
  const {
    GENERATION_POLICY_VERSIONS,
    WEEKLY_SESSION_ROLES,
    WORKOUT_BLOCK_TYPES,
  } = await server.ssrLoadModule('/src/config/architecture.js');

  assert.deepEqual(
    getEligibleFootworkMoveIdsAtStage(BOXING_CURRICULUM_STAGES.FUNDAMENTALS),
    [BOXING_MOVE_IDS.STEP_IN, BOXING_MOVE_IDS.STEP_OUT],
    'Stage 1 footwork must be Step In + Step Out only.',
  );
  assert.deepEqual(
    getEligibleFootworkMoveIdsAtStage(BOXING_CURRICULUM_STAGES.BASIC_COMBINATION),
    [BOXING_MOVE_IDS.STEP_IN, BOXING_MOVE_IDS.STEP_OUT, BOXING_MOVE_IDS.STEP_LEAD_SIDE, BOXING_MOVE_IDS.STEP_REAR_SIDE],
    'Stage 2 footwork must unlock both lateral steps.',
  );
  assert.deepEqual(getEligibleFootworkMoveIdsAtStage(999), [], 'Invalid stage must fail-safe to no eligible footwork.');

  const descriptor = buildFootworkTechniqueDescriptor({ footworkMoveId: BOXING_MOVE_IDS.STEP_IN, plannedSeconds: 30 });
  assert.equal(descriptor.valid, true);
  assert.deepEqual(descriptor.descriptor, { footworkMoveId: BOXING_MOVE_IDS.STEP_IN, plannedSeconds: 30 });
  assert.equal(buildFootworkTechniqueDescriptor({ footworkMoveId: BOXING_MOVE_IDS.JAB, plannedSeconds: 30 }).valid, false);
  assert.equal(buildFootworkTechniqueDescriptor({ footworkMoveId: BOXING_MOVE_IDS.STEP_IN, plannedSeconds: 0 }).valid, false);

  const fakeBudget = {
    blocks: { warmupSeconds: 60, boxingSeconds: 300, transitionSeconds: 0, strengthSeconds: 0, cooldownSeconds: 60 },
    boxingBudget: {
      intervalSegments: [
        { type: 'work', durationSeconds: 120, roundIndex: 0 },
        { type: 'rest', durationSeconds: 30, roundIndex: 0 },
        { type: 'work', durationSeconds: 120, roundIndex: 1 },
      ],
    },
  };
  const fakeRounds = [
    { combinationId: 'C1', moveIds: [BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS], moveCount: 2, workingRange: 'long', requiredContext: {}, roundIndex: 0 },
    { combinationId: 'C2', moveIds: [BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS], moveCount: 2, workingRange: 'long', requiredContext: {}, roundIndex: 1 },
  ];
  const built = buildDayBlocks({
    programDayId: 'PRD_PART34_BUILDER',
    role: WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY,
    budget: fakeBudget,
    boxingRounds: fakeRounds,
    footworkTechnique: descriptor.descriptor,
  });
  assert.equal(built[0].type, WORKOUT_BLOCK_TYPES.WARMUP);
  assert.equal(built[1].type, WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE);
  assert.equal(built[1].footworkMoveId, BOXING_MOVE_IDS.STEP_IN);
  assert.equal(Object.hasOwn(built[1], 'roundIndex'), false);
  assert.equal(Object.hasOwn(built[1], 'moveIds'), false);
  assert.equal(Object.hasOwn(built[1], 'moveCount'), false);
  assert.equal(built.reduce((sum, block) => sum + block.plannedSeconds, 0), 420);

  const baseResult = generateProgramBlueprint(clone(fixture.input));
  assert.equal(baseResult.valid, true);
  assert.equal(baseResult.blueprint.blueprintFingerprint, fixture.expected.blueprintFingerprint);

  const synthetic = clone(baseResult.blueprint);
  synthetic.programVersion.generationPolicyVersion = GENERATION_POLICY_VERSIONS.V2;
  const firstDay = synthetic.programDays[0];
  const dayBlocks = synthetic.workoutBlocks
    .filter((block) => block.programDayId === firstDay.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const firstAttack = dayBlocks.find((block) => block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK && block.plannedSeconds > 30);
  assert.ok(firstAttack, 'Synthetic V2 fixture needs an attack block > 30 seconds.');
  firstAttack.plannedSeconds -= 30;

  for (const block of dayBlocks) {
    if (block.orderIndex >= 1) block.orderIndex += 1;
  }
  const footworkBlock = {
    id: `WKB_${firstDay.id}_PART34_FW`,
    programDayId: firstDay.id,
    orderIndex: 1,
    type: WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE,
    plannedSeconds: 30,
    footworkMoveId: BOXING_MOVE_IDS.STEP_IN,
  };
  synthetic.workoutBlocks.push(footworkBlock);

  const syntheticValidation = validateFullProgramBlueprint(synthetic);
  assert.equal(syntheticValidation.valid, true, `Dormant V2 footwork blueprint should validate: ${JSON.stringify(syntheticValidation.reasons)}`);

  const blockCheck = validateFootworkTechniqueBlock({
    block: footworkBlock,
    settings: synthetic.programVersion.settingsSnapshot,
    programDays: synthetic.programDays,
    day: firstDay,
  });
  assert.equal(blockCheck.valid, true);
  assert.equal(blockCheck.stage, BOXING_CURRICULUM_STAGES.FUNDAMENTALS);

  const lateralTooEarly = { ...footworkBlock, footworkMoveId: BOXING_MOVE_IDS.STEP_LEAD_SIDE };
  assert.equal(validateFootworkTechniqueBlock({
    block: lateralTooEarly,
    settings: synthetic.programVersion.settingsSnapshot,
    programDays: synthetic.programDays,
    day: firstDay,
  }).valid, false, 'Stage 1 lateral footwork must fail.');

  const forbiddenField = { ...footworkBlock, moveIds: [BOXING_MOVE_IDS.JAB] };
  assert.equal(validateFootworkTechniqueBlock({
    block: forbiddenField,
    settings: synthetic.programVersion.settingsSnapshot,
    programDays: synthetic.programDays,
    day: firstDay,
  }).valid, false, 'Footwork block must reject attack moveIds.');

  const stepInBlueprint = clone(synthetic);
  const stepOutBlueprint = clone(synthetic);
  stepOutBlueprint.workoutBlocks.find((block) => block.type === WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE).footworkMoveId = BOXING_MOVE_IDS.STEP_OUT;
  const stepInFp = computeBlueprintFingerprint(stepInBlueprint, synthetic.programVersion.generationSeed);
  const stepOutFp = computeBlueprintFingerprint(stepOutBlueprint, synthetic.programVersion.generationSeed);
  assert.notEqual(stepInFp, stepOutFp, 'footworkMoveId must participate in fingerprint identity.');

  synthetic.blueprintFingerprint = stepInFp;
  synthetic.programVersion.blueprintFingerprint = stepInFp;
  const v2Audit = auditProgramSnapshot(synthetic);
  assert.equal(v2Audit.outcome, 'fail', 'Explicit V2 audit must remain fail-closed while V2 is inactive.');
  assert.ok(
    v2Audit.findings.some((finding) => finding.code === AUDIT_REASON_CODES.AUDIT_UNSUPPORTED_GENERATION_POLICY_VERSION),
    'Inactive V2 audit must report unsupported generation policy.',
  );

  const v1Tampered = clone(synthetic);
  v1Tampered.programVersion.generationPolicyVersion = GENERATION_POLICY_VERSIONS.V1;
  const v1TamperedFp = computeBlueprintFingerprint(v1Tampered, v1Tampered.programVersion.generationSeed);
  v1Tampered.programVersion.blueprintFingerprint = v1TamperedFp;
  v1Tampered.blueprintFingerprint = v1TamperedFp;
  const v1Audit = auditProgramSnapshot(v1Tampered);
  assert.equal(v1Audit.outcome, 'fail');
  assert.ok(
    v1Audit.findings.some((finding) => finding.code === AUDIT_REASON_CODES.AUDIT_FOOTWORK_TECHNIQUE_INVALID),
    'V1 persisted footwork technique block must fail closed.',
  );

  console.log(`PASS part34-footwork-isolated-regression: syntheticFP=${stepInFp} alternateFP=${stepOutFp}`);
} finally {
  await server.close();
}
