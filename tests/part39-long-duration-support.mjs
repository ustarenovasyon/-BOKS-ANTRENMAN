import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server = await createServer({optimizeDeps: {noDiscovery: true, entries: []},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
  const {PROGRAM_DURATION_MONTHS, WORKOUT_BLOCK_TYPES} = await server.ssrLoadModule('/src/config/architecture.js');
  const {resolveBoxingCurriculumStage,resolveCurriculumBoundaries} = await server.ssrLoadModule('/src/features/boxing/curriculum/boxingCurriculumStageResolver.js');
  const {getComboRequiredStage} = await server.ssrLoadModule('/src/features/boxing/curriculum/boxingTechniqueCurriculum.js');
  const {selectBoxingRounds} = await server.ssrLoadModule('/src/features/programGeneration/boxingContentSelector.js');
  const {getV2DefenseEligibleRules} = await server.ssrLoadModule('/src/features/boxing/curriculum/boxingV2DefenseCurriculumEligibility.js');
  const {allocatePhaseSessions,validatePhaseModels} = await server.ssrLoadModule('/src/features/progression/progressionPhaseEngine.js');
  const {buildProgramProgression} = await server.ssrLoadModule('/src/features/progression/progressionEngine.js');
  const {buildSessionTimeBudget} = await server.ssrLoadModule('/src/features/sessionBudget/sessionTimeBudgetEngine.js');
  const {buildBoxingIntervalBudget} = await server.ssrLoadModule('/src/features/sessionBudget/boxingIntervalBudget.js');
  const {planV2FootworkTechniqueSession} = await server.ssrLoadModule('/src/features/programGeneration/footworkSchedulingPolicy.js');
  const {planWeeklyRoles,computeWeeklyMetrics} = await server.ssrLoadModule('/src/features/weeklyBalance/weeklyRolePlanner.js');
  assert.equal(validatePhaseModels().valid,true);
  const budget=buildSessionTimeBudget({programMode:'boxing_only',sessionDurationMinutes:30,experienceLevel:'beginner',difficulty:'normal'});
  for(const durationMonths of Object.values(PROGRAM_DURATION_MONTHS)) for(const experienceLevel of ['beginner','intermediate','experienced']) {
    const total=durationMonths*13;
    assert.equal(Object.values(allocatePhaseSessions(durationMonths,total).phaseCounts).reduce((a,b)=>a+b,0),total);
    assert.ok(resolveCurriculumBoundaries(durationMonths,experienceLevel,total));
    let previous=0;
    for(let ordinal=1;ordinal<=total;ordinal++) {
      const stage=resolveBoxingCurriculumStage({durationMonths,experienceLevel,boxingExposureOrdinal:ordinal,totalBoxingExposures:total});
      assert.equal(stage.valid,true);
      assert.ok(stage.stage>=previous);
      if(previous) assert.ok(stage.stage<=previous+1);
      previous=stage.stage;
    }
    for(const ordinal of [...new Set([1,2,Math.ceil(total/2),total])]) {
      const context={durationMonths,experienceLevel,boxingExposureOrdinal:ordinal,totalBoxingExposures:total};
      const stage=resolveBoxingCurriculumStage(context).stage;
      const progression=buildProgramProgression({durationMonths,experienceLevel,difficulty:'normal',programMode:'boxing_only',trainingOrdinal:ordinal,totalPlannedTrainingSessions:total,userBoxingMaxMoves:10,sessionBudget:budget});
      assert.equal(progression.valid,true);
      const rounds=selectBoxingRounds({...context,boxingBudget:buildBoxingIntervalBudget(1500,experienceLevel,'normal'),effectiveComboCeiling:10,userBoxingMaxMoves:10,focus:'balanced_technique',generationSeed:'part39-policy',trainingOrdinal:ordinal,generationPolicyVersion:2,curriculumStage:stage});
      assert.equal(rounds.valid,true,`${durationMonths}/${experienceLevel}/${ordinal}: ${rounds.reason}`);
      for(const round of rounds.rounds) {
        assert.ok(getComboRequiredStage(round.moveIds)<=stage);
        assert.ok(round.moveCount<=7);
        if(round.moveCount===7)assert.equal(round.attackRoundRole,'challenge');
      }
      assert.ok(rounds.rounds.some(r=>r.moveCount<=3));
      assert.equal(planV2FootworkTechniqueSession({...context,generationPolicyVersion:2,boxingSeconds:1500}).valid,true);
    }
  }
  assert.deepEqual([1,2,3,4,5,6].map(s=>getV2DefenseEligibleRules(s).length),[0,2,4,4,4,4]);
  const fullWeek=planWeeklyRoles('boxing_only',['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'],0);
  assert.equal(computeWeeklyMetrics(fullWeek,30).maxConsecutiveTrainingDays,7);
  assert.equal(WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE,'boxing_footwork_technique');
  console.log('PASS part39-41: 8 durations × 3 experience levels, selectors, defense, footwork, progression and 7-day week');
} finally {await server.close();}
