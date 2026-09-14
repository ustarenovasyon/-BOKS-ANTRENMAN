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
    buildFootworkPrescription,
    validateFootworkPrescriptionShape,
  } = await server.ssrLoadModule('/src/features/programGeneration/footworkPrescription.js');
  const { BOXING_MOVE_IDS } = await server.ssrLoadModule('/src/features/boxing/library/boxingMoves.js');
  const {
    BOXING_FOOTWORK_INTEGRATION_PHASES,
    GENERATION_POLICY_VERSIONS,
    WEEKLY_SESSION_ROLES,
    WORKOUT_BLOCK_TYPES,
  } = await server.ssrLoadModule('/src/config/architecture.js');

  const validBuilt = buildFootworkPrescription({
    actions: [
      { phase: BOXING_FOOTWORK_INTEGRATION_PHASES.BEFORE_COMBO, movementId: BOXING_MOVE_IDS.STEP_IN },
      { phase: BOXING_FOOTWORK_INTEGRATION_PHASES.AFTER_COMBO, movementId: BOXING_MOVE_IDS.STEP_OUT },
    ],
  });
  assert.equal(validBuilt.valid, true);
  assert.deepEqual(validBuilt.prescription.actions, [
    { phase: 'before_combo', movementId: BOXING_MOVE_IDS.STEP_IN },
    { phase: 'after_combo', movementId: BOXING_MOVE_IDS.STEP_OUT },
  ]);

  assert.equal(validateFootworkPrescriptionShape({ actions: [] }).valid, false);
  assert.equal(validateFootworkPrescriptionShape({ actions: [
    { phase: 'before_combo', movementId: BOXING_MOVE_IDS.STEP_IN },
    { phase: 'before_combo', movementId: BOXING_MOVE_IDS.STEP_OUT },
  ] }).valid, false, 'Duplicate phase must fail.');
  assert.equal(validateFootworkPrescriptionShape({ actions: [
    { phase: 'after_combo', movementId: BOXING_MOVE_IDS.STEP_OUT },
    { phase: 'before_combo', movementId: BOXING_MOVE_IDS.STEP_IN },
  ] }).valid, false, 'before_combo must precede after_combo when both exist.');
  assert.equal(validateFootworkPrescriptionShape({ actions: [
    { phase: 'before_combo', movementId: BOXING_MOVE_IDS.JAB },
  ] }).valid, false, 'Strike cannot be used as footwork integration movement.');

  const fakeBudget = {
    blocks: { warmupSeconds: 60, boxingSeconds: 270, transitionSeconds: 0, strengthSeconds: 0, cooldownSeconds: 60 },
    boxingBudget: {
      intervalSegments: [
        { type: 'work', durationSeconds: 120, roundIndex: 0 },
        { type: 'rest', durationSeconds: 30, roundIndex: 0 },
        { type: 'work', durationSeconds: 120, roundIndex: 1 },
      ],
    },
  };
  const rounds = [
    {
      combinationId: 'C1',
      moveIds: [BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS],
      moveCount: 2,
      workingRange: 'long',
      requiredContext: {},
      roundIndex: 0,
      footworkPrescription: validBuilt.prescription,
    },
    {
      combinationId: 'C2',
      moveIds: [BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS],
      moveCount: 2,
      workingRange: 'long',
      requiredContext: {},
      roundIndex: 1,
    },
  ];
  const builtBlocks = buildDayBlocks({
    programDayId: 'PRD_PART35_BUILDER',
    role: WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY,
    budget: fakeBudget,
    boxingRounds: rounds,
  });
  const builtAttack = builtBlocks.find((block) => block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK);
  assert.ok(builtAttack);
  assert.equal(builtAttack.moveCount, 2);
  assert.deepEqual(builtAttack.moveIds, [BOXING_MOVE_IDS.JAB, BOXING_MOVE_IDS.CROSS]);
  assert.equal(builtAttack.plannedSeconds, 120);
  assert.deepEqual(builtAttack.footworkPrescription, validBuilt.prescription);
  assert.notEqual(builtAttack.footworkPrescription, validBuilt.prescription, 'Builder must clone prescription metadata.');
  assert.notEqual(builtAttack.footworkPrescription.actions, validBuilt.prescription.actions, 'Builder must clone prescription actions.');

  const baseResult = generateProgramBlueprint(clone(fixture.input));
  assert.equal(baseResult.valid, true);
  assert.equal(baseResult.blueprint.blueprintFingerprint, fixture.expected.blueprintFingerprint, 'Canonical V1 FP must remain unchanged.');

  const synthetic = clone(baseResult.blueprint);
  synthetic.programVersion.generationPolicyVersion = GENERATION_POLICY_VERSIONS.V2;
  const firstDay = synthetic.programDays[0];
  const firstAttack = synthetic.workoutBlocks.find((block) =>
    block.programDayId === firstDay.id && block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK,
  );
  assert.ok(firstAttack, 'Synthetic fixture needs an attack block.');
  const originalMoveIds = clone(firstAttack.moveIds);
  const originalMoveCount = firstAttack.moveCount;
  const originalSeconds = firstAttack.plannedSeconds;
  firstAttack.footworkPrescription = clone(validBuilt.prescription);

  assert.deepEqual(firstAttack.moveIds, originalMoveIds);
  assert.equal(firstAttack.moveCount, originalMoveCount);
  assert.equal(firstAttack.plannedSeconds, originalSeconds);

  const syntheticValidation = validateFullProgramBlueprint(synthetic);
  assert.equal(
    syntheticValidation.valid,
    true,
    `Dormant V2 prescription blueprint should validate: ${JSON.stringify(syntheticValidation.reasons)}`,
  );

  const stepInOutFp = computeBlueprintFingerprint(synthetic, synthetic.programVersion.generationSeed);
  const alternate = clone(synthetic);
  const alternateAttack = alternate.workoutBlocks.find((block) =>
    block.programDayId === firstDay.id && block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK,
  );
  alternateAttack.footworkPrescription.actions[0].movementId = BOXING_MOVE_IDS.STEP_OUT;
  const alternateFp = computeBlueprintFingerprint(alternate, alternate.programVersion.generationSeed);
  assert.notEqual(stepInOutFp, alternateFp, 'Prescription movement identity must participate in fingerprint.');

  synthetic.blueprintFingerprint = stepInOutFp;
  synthetic.programVersion.blueprintFingerprint = stepInOutFp;
  const v2Audit = auditProgramSnapshot(synthetic);
  assert.equal(v2Audit.outcome, 'fail', 'Explicit V2 audit must remain fail-closed while V2 is inactive.');
  assert.ok(
    v2Audit.findings.some((finding) => finding.code === AUDIT_REASON_CODES.AUDIT_UNSUPPORTED_GENERATION_POLICY_VERSION),
    'Inactive V2 audit must report unsupported generation policy.',
  );

  const v1Tampered = clone(baseResult.blueprint);
  const v1Attack = v1Tampered.workoutBlocks.find((block) => block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK);
  v1Attack.footworkPrescription = clone(validBuilt.prescription);
  const v1TamperedFp = computeBlueprintFingerprint(v1Tampered, v1Tampered.programVersion.generationSeed);
  v1Tampered.blueprintFingerprint = v1TamperedFp;
  v1Tampered.programVersion.blueprintFingerprint = v1TamperedFp;
  const v1Audit = auditProgramSnapshot(v1Tampered);
  assert.equal(v1Audit.outcome, 'fail');
  assert.ok(
    v1Audit.findings.some((finding) => finding.code === AUDIT_REASON_CODES.AUDIT_FOOTWORK_PRESCRIPTION_INVALID),
    'V1 persisted prescription metadata must fail closed.',
  );

  const stage1Lateral = clone(synthetic);
  const stage1Attack = stage1Lateral.workoutBlocks.find((block) =>
    block.programDayId === firstDay.id && block.type === WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK,
  );
  stage1Attack.footworkPrescription = {
    actions: [{ phase: 'before_combo', movementId: BOXING_MOVE_IDS.STEP_LEAD_SIDE }],
  };
  const stage1Validation = validateFullProgramBlueprint(stage1Lateral);
  assert.equal(stage1Validation.valid, false, 'Stage 1 lateral integration must fail curriculum validation.');

  console.log(`PASS part35-footwork-prescription-regression: primaryFP=${stepInOutFp} alternateFP=${alternateFp}`);
} finally {
  await server.close();
}
