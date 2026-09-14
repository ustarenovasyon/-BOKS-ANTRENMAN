from pathlib import Path


def read(path):
    return Path(path).read_text()


def write(path, text):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(text)


def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected exactly one match, found {count}")
    write(path, text.replace(old, new, 1))


# 1) Canonical phases.
replace_once(
    'src/config/architecture.js',
    "export const BOXING_FOOTWORK_DIRECTIONS = Object.freeze({\n  FORWARD: 'forward',\n  BACKWARD: 'backward',\n  LATERAL_LEAD: 'lateral_lead',\n  LATERAL_REAR: 'lateral_rear',\n});\n",
    "export const BOXING_FOOTWORK_DIRECTIONS = Object.freeze({\n  FORWARD: 'forward',\n  BACKWARD: 'backward',\n  LATERAL_LEAD: 'lateral_lead',\n  LATERAL_REAR: 'lateral_rear',\n});\n\n// PART 35: Structured footwork integration phases. Metadata only; süre/punch count artırmaz.\nexport const BOXING_FOOTWORK_INTEGRATION_PHASES = Object.freeze({\n  BEFORE_COMBO: 'before_combo',\n  AFTER_COMBO: 'after_combo',\n});\n",
)

# 2) Reuse canonical active-footwork predicate.
replace_once(
    'src/features/programGeneration/footworkTechniqueBlock.js',
    'function isCanonicalActiveFootworkMove(moveId) {',
    'export function isCanonicalActiveFootworkMove(moveId) {',
)

# 3) Builder carries dormant metadata only when explicitly supplied by a round.
replace_once(
    'src/features/programGeneration/workoutBlockBuilder.js',
    "import { WORKOUT_BLOCK_TYPES, WEEKLY_SESSION_ROLES } from '@/config/architecture';\n",
    "import { WORKOUT_BLOCK_TYPES, WEEKLY_SESSION_ROLES } from '@/config/architecture';\nimport { cloneFootworkPrescription } from './footworkPrescription';\n",
)
replace_once(
    'src/features/programGeneration/workoutBlockBuilder.js',
    "              requiredContext: { ...round.requiredContext },\n",
    "              requiredContext: { ...round.requiredContext },\n              ...(Object.prototype.hasOwnProperty.call(round, 'footworkPrescription')\n                ? { footworkPrescription: cloneFootworkPrescription(round.footworkPrescription) }\n                : {}),\n",
)

# 4) Fingerprint includes prescription only when present; legacy V1 signatures remain byte-for-byte unchanged.
replace_once(
    'src/features/programGeneration/blueprintFingerprint.js',
    "export function getBlueprintFingerprintSignature(blueprint, seed) {\n",
    "function footworkPrescriptionSignature(block) {\n  if (!Object.prototype.hasOwnProperty.call(block, 'footworkPrescription')) return '';\n  const actions = block.footworkPrescription?.actions;\n  if (!Array.isArray(actions)) return ':FWP[invalid]';\n  const actionSig = actions.map((action) => `${action?.phase || ''}>${action?.movementId || ''}`).join(',');\n  return `:FWP[${actionSig}]`;\n}\n\nexport function getBlueprintFingerprintSignature(blueprint, seed) {\n",
)
replace_once(
    'src/features/programGeneration/blueprintFingerprint.js',
    ".map((b) => `${b.programDayId}:${b.orderIndex}:${b.type}:${b.plannedSeconds}:${b.combinationId || b.defenseRuleId || b.exerciseId || b.templateId || b.footworkMoveId || ''}`)\n",
    ".map((b) => `${b.programDayId}:${b.orderIndex}:${b.type}:${b.plannedSeconds}:${b.combinationId || b.defenseRuleId || b.exerciseId || b.templateId || b.footworkMoveId || ''}${footworkPrescriptionSignature(b)}`)\n",
)

# 5) Blueprint validator support.
replace_once(
    'src/features/programGeneration/programBlueprintValidator.js',
    "import { validateFootworkTechniqueDay } from './footworkTechniqueBlock';\n",
    "import { validateFootworkTechniqueDay } from './footworkTechniqueBlock';\nimport { validateFootworkPrescriptionDay } from './footworkPrescription';\n",
)
replace_once(
    'src/features/programGeneration/programBlueprintValidator.js',
    "    if (!footworkValidation.valid) reasons.push(RC.PROGRAM_BOXING_VALIDATION_FAILED);\n\n    // forbidden kg keys\n",
    "    if (!footworkValidation.valid) reasons.push(RC.PROGRAM_BOXING_VALIDATION_FAILED);\n    const footworkPrescriptionValidation = validateFootworkPrescriptionDay({\n      day,\n      dayBlocks,\n      programDays,\n      settings,\n      generationPolicyVersion: policy.version,\n    });\n    if (!footworkPrescriptionValidation.valid) reasons.push(RC.PROGRAM_BOXING_VALIDATION_FAILED);\n\n    // forbidden kg keys\n",
)

# 6) Audit fail-closed support without changing checkSummary for normal V1 blueprints.
replace_once(
    'src/features/programAudit/programAuditConstants.js',
    "  AUDIT_FOOTWORK_TECHNIQUE_INVALID: 'audit_footwork_technique_invalid',\n",
    "  AUDIT_FOOTWORK_TECHNIQUE_INVALID: 'audit_footwork_technique_invalid',\n  AUDIT_FOOTWORK_PRESCRIPTION_INVALID: 'audit_footwork_prescription_invalid',\n",
)
replace_once(
    'src/features/programAudit/programAuditEngine.js',
    "import { validateFootworkTechniqueDay } from '@/features/programGeneration/footworkTechniqueBlock';\n",
    "import { validateFootworkTechniqueDay } from '@/features/programGeneration/footworkTechniqueBlock';\nimport { validateFootworkPrescriptionDay } from '@/features/programGeneration/footworkPrescription';\n",
)
audit_marker = "\n  // ===== IDENTITY =====\n"
audit_insert = """
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
"""
replace_once('src/features/programAudit/programAuditEngine.js', audit_marker, audit_insert + audit_marker)

# 7) Preview integrity support.
replace_once(
    'src/features/programPreview/programPreviewService.js',
    "import { validateFootworkTechniqueDay } from '@/features/programGeneration/footworkTechniqueBlock';\n",
    "import { validateFootworkTechniqueDay } from '@/features/programGeneration/footworkTechniqueBlock';\nimport { validateFootworkPrescriptionDay } from '@/features/programGeneration/footworkPrescription';\n",
)
replace_once(
    'src/features/programPreview/programPreviewService.js',
    "    if (!footworkValidation.valid) return fail('PREVIEW_DATA_INTEGRITY_FAILED');\n\n    // role/block composition guard",
    "    if (!footworkValidation.valid) return fail('PREVIEW_DATA_INTEGRITY_FAILED');\n    const footworkPrescriptionValidation = validateFootworkPrescriptionDay({\n      day,\n      dayBlocks: ordered,\n      programDays: sortedDays,\n      settings: version.settingsSnapshot,\n      generationPolicyVersion: policy.version,\n    });\n    if (!footworkPrescriptionValidation.valid) return fail('PREVIEW_DATA_INTEGRITY_FAILED');\n\n    // role/block composition guard",
)

# 8) Preview labels/rendering for future active V2 previews.
replace_once(
    'src/features/programPreview/previewLabels.js',
    "  BOXING_THREAT_TYPES, WORKOUT_BLOCK_TYPES, BOXING_RANGE_CLASSES,\n",
    "  BOXING_THREAT_TYPES, WORKOUT_BLOCK_TYPES, BOXING_RANGE_CLASSES,\n  BOXING_FOOTWORK_INTEGRATION_PHASES,\n",
)
replace_once(
    'src/features/programPreview/previewLabels.js',
    "export const RANGE_LABELS = {\n",
    "export const FOOTWORK_INTEGRATION_PHASE_LABELS = {\n  [BOXING_FOOTWORK_INTEGRATION_PHASES.BEFORE_COMBO]: 'Kombinasyon öncesi',\n  [BOXING_FOOTWORK_INTEGRATION_PHASES.AFTER_COMBO]: 'Kombinasyon sonrası',\n};\n\nexport const RANGE_LABELS = {\n",
)
replace_once(
    'src/features/programPreview/components/WorkoutBlockPreview.jsx',
    "import { formatSeconds, THREAT_LABELS, RANGE_LABELS } from '../previewLabels';\n",
    "import { formatSeconds, THREAT_LABELS, RANGE_LABELS, FOOTWORK_INTEGRATION_PHASE_LABELS } from '../previewLabels';\n",
)
replace_once(
    'src/features/programPreview/components/WorkoutBlockPreview.jsx',
    "      <p className=\"text-sm text-foreground break-words leading-relaxed\">{seq}</p>\n      {block.workingRange && (\n",
    "      <p className=\"text-sm text-foreground break-words leading-relaxed\">{seq}</p>\n      {Array.isArray(block.footworkPrescription?.actions) && block.footworkPrescription.actions.length > 0 && (\n        <div className=\"space-y-0.5\">\n          {block.footworkPrescription.actions.map((action, index) => (\n            <p key={`${action.phase}-${action.movementId}-${index}`} className=\"text-xs text-muted-foreground\">\n              {FOOTWORK_INTEGRATION_PHASE_LABELS[action.phase] || action.phase}: {moveName(action.movementId)}\n            </p>\n          ))}\n        </div>\n      )}\n      {block.workingRange && (\n",
)

# 9) Permanent regression runner.
write('tests/part35-footwork-prescription-regression.mjs', r'''import assert from 'node:assert/strict';
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
''')

replace_once(
    'package.json',
    '"test:regression": "node tests/run-regression.mjs && node tests/strength-generation-regression.mjs && node tests/part34-footwork-isolated-regression.mjs",',
    '"test:regression": "node tests/run-regression.mjs && node tests/strength-generation-regression.mjs && node tests/part34-footwork-isolated-regression.mjs && node tests/part35-footwork-prescription-regression.mjs",',
)

# 10) Durable decision docs.
write('docs/20_PART_35_FOOTWORK_INTEGRATION_PRESCRIPTION.md', '''# PART 35 — Footwork Integration Prescription\n\n## Status\n\nImplementation candidate. LOCK only after branch/PR/main CI gates pass.\n\n## Scope\n\nStructured integration metadata is supported on boxing attack work blocks without changing attack combination identity. Production scheduling is still disabled.\n\nCanonical shape:\n\n```js\n{\n  actions: [\n    { phase: 'before_combo', movementId: 'BOX_STEP_IN' },\n    { phase: 'after_combo', movementId: 'BOX_STEP_OUT' }\n  ]\n}\n```\n\n## Invariants\n\n- `footworkPrescription` is attack-block metadata, not attack `moveIds`.\n- `moveCount` remains punch count only.\n- Prescription adds no seconds and does not alter `plannedSeconds`.\n- 1–2 actions only.\n- At most one action per phase.\n- If both phases exist, `before_combo` precedes `after_combo`.\n- Movement IDs must be canonical active footwork and curriculum-eligible for that day.\n- V1 carrying prescription metadata fails closed.\n- Explicit V2 remains production inactive/fail-closed in audit/preview.\n- Fingerprint includes phase + movement identity only when prescription exists, preserving legacy V1 signatures when absent.\n- Scheduling/frequency selection remains PART 36.\n- No DB schema or movement-library bump.\n\n## Example\n\nDisplay may be `Step In → Jab → Cross → Step Out`, while attack domain remains `Jab → Cross`, `moveCount=2`.\n\n## Regression gate\n\n`tests/part35-footwork-prescription-regression.mjs` verifies schema safety, builder cloning, curriculum rejection, fingerprint identity, V1 fail-closed audit and unchanged canonical V1 fingerprint.\n''')

# Append focused status notes without rewriting historical sections.
for path, section in {
    'docs/09_FOOTWORK_VE_PEDAGOJI.md': '''\n## PART 35 implementation note\n\nStructured `footworkPrescription` support is implemented as dormant V2 attack metadata. It does not enter attack `moveIds`, does not increase `moveCount`, and does not add session time. Canonical phases are `before_combo` and `after_combo`; curriculum eligibility comes from the existing central curriculum helpers. Production prescription scheduling/frequency remains disabled until PART 36.\n''',
    'docs/07_PART_YOL_HARITASI.md': '''\n## PART 35 implementation gate\n\nStructured `before_combo / after_combo` prescription support is implemented as dormant metadata. Production generator still does not schedule prescriptions. PART 36 remains responsible for deterministic scheduling/frequency policy.\n''',
    'docs/00_PROJE_DURUMU.md': '''\n## PART 35 durumu\n\nStructured `footworkPrescription` integration support branch implementation is present. Attack combo identity and punch `moveCount` remain unchanged; prescription adds no session time. V1 production output must remain unchanged and prescription scheduling remains deferred to PART 36. Final LOCK requires all branch/PR/main gates.\n''',
}.items():
    text = read(path)
    if section.strip() not in text:
        write(path, text.rstrip() + '\n' + section)

print('PART35 patch applied')
