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
  const { planV2FootworkTechniqueSession } = await server.ssrLoadModule('/src/features/programGeneration/footworkSchedulingPolicy.js');
  const { generateProgramBlueprint } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
  const { BOXING_MOVE_IDS } = await server.ssrLoadModule('/src/features/boxing/library/boxingMoves.js');
  const {
    GENERATION_POLICY_VERSIONS,
    EXPERIENCE_LEVELS,
    WORKOUT_BLOCK_TYPES,
  } = await server.ssrLoadModule('/src/config/architecture.js');

  const base = {
    generationPolicyVersion: GENERATION_POLICY_VERSIONS.V2,
    durationMonths: 6,
    experienceLevel: EXPERIENCE_LEVELS.BEGINNER,
    totalBoxingExposures: 30,
    boxingSeconds: 480,
  };

  const s1e1 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 1 });
  assert.equal(s1e1.valid, true);
  assert.equal(s1e1.scheduled, true);
  assert.equal(s1e1.stage, 1);
  assert.equal(s1e1.stageLocalOrdinal, 1);
  assert.equal(s1e1.footworkMoveId, BOXING_MOVE_IDS.STEP_IN);
  assert.equal(s1e1.footworkTechniqueSeconds, 60);
  assert.equal(s1e1.boxingIntervalSeconds, 420);

  const s1e2 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 2 });
  assert.equal(s1e2.valid, true);
  assert.equal(s1e2.scheduled, true);
  assert.equal(s1e2.footworkMoveId, BOXING_MOVE_IDS.STEP_OUT);

  // 6M / 30 boxing exposures => Stage 2 starts at exposure 3 and ends at 10.
  const s2e1 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 3 });
  assert.equal(s2e1.valid, true);
  assert.equal(s2e1.scheduled, true);
  assert.equal(s2e1.stage, 2);
  assert.equal(s2e1.stageLocalOrdinal, 1);
  assert.equal(s2e1.footworkMoveId, BOXING_MOVE_IDS.STEP_LEAD_SIDE);

  const s2e2 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 4 });
  assert.equal(s2e2.valid, true);
  assert.equal(s2e2.scheduled, true);
  assert.equal(s2e2.stageLocalOrdinal, 2);
  assert.equal(s2e2.footworkMoveId, BOXING_MOVE_IDS.STEP_REAR_SIDE);

  const s2e3 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 5 });
  assert.equal(s2e3.valid, true);
  assert.equal(s2e3.scheduled, true, 'Every third stage-local exposure must refresh isolated footwork.');

  const s2e4 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 6 });
  assert.equal(s2e4.valid, true);
  assert.equal(s2e4.scheduled, false);
  assert.equal(s2e4.footworkTechniqueSeconds, 0);
  assert.equal(s2e4.boxingIntervalSeconds, 480);

  // Stage 3 starts at exposure 11 for total 30. No new footwork unlocks there.
  const s3e1 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 11 });
  assert.equal(s3e1.valid, true);
  assert.equal(s3e1.scheduled, true, 'First exposure of every stage must include isolated technique.');
  assert.equal(s3e1.stage, 3);
  assert.equal(s3e1.stageLocalOrdinal, 1);
  assert.deepEqual(s3e1.newlyUnlockedMoveIds, []);

  const s3e2 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 12 });
  assert.equal(s3e2.valid, true);
  assert.equal(s3e2.scheduled, false);

  const s3e3 = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 13 });
  assert.equal(s3e3.valid, true);
  assert.equal(s3e3.scheduled, true);
  assert.equal(s3e3.stageLocalOrdinal, 3);

  const exactBudget = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 1, boxingSeconds: 240 });
  assert.equal(exactBudget.valid, true);
  assert.equal(exactBudget.boxingIntervalSeconds, 180);

  const insufficientBudget = planV2FootworkTechniqueSession({ ...base, boxingExposureOrdinal: 1, boxingSeconds: 239 });
  assert.equal(insufficientBudget.valid, false);
  assert.equal(insufficientBudget.reason, 'footwork_scheduling_insufficient_boxing_budget');

  const v1Blocked = planV2FootworkTechniqueSession({
    ...base,
    generationPolicyVersion: GENERATION_POLICY_VERSIONS.V1,
    boxingExposureOrdinal: 1,
  });
  assert.equal(v1Blocked.valid, false);
  assert.equal(v1Blocked.reason, 'footwork_scheduling_requires_v2_policy');

  const unsupportedExperience = planV2FootworkTechniqueSession({
    ...base,
    experienceLevel: EXPERIENCE_LEVELS.INTERMEDIATE,
    boxingExposureOrdinal: 1,
  });
  assert.equal(unsupportedExperience.valid, false);
  assert.equal(unsupportedExperience.reason, 'curriculum_timeline_not_defined_for_experience_level');

  const generated = generateProgramBlueprint(clone(fixture.input));
  assert.equal(generated.valid, true);
  assert.equal(generated.blueprint.blueprintFingerprint, fixture.expected.blueprintFingerprint);
  assert.equal(
    generated.blueprint.workoutBlocks.filter((block) => block.type === WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE).length,
    0,
    'PART 36 policy support must not schedule production V1 footwork blocks.',
  );
  assert.equal(
    generated.blueprint.workoutBlocks.filter((block) => Object.hasOwn(block, 'footworkPrescription')).length,
    0,
    'PART 36 must not schedule production V1 integration prescriptions.',
  );

  console.log('PASS part36-footwork-scheduling-regression: stage cadence, budget split, V1 lock');
} finally {
  await server.close();
}
