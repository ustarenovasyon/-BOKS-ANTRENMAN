import { createServer } from 'vite';
const server = await createServer({ server:{middlewareMode:true}, appType:'custom', clearScreen:false, logLevel:'error' });
try {
  const A = await server.ssrLoadModule('/src/config/architecture.js');
  const { buildSessionTimeBudget } = await server.ssrLoadModule('/src/features/sessionBudget/sessionTimeBudgetEngine.js');
  const { fitStrengthPrescription } = await server.ssrLoadModule('/src/features/programGeneration/strengthPrescriptionFitter.js');
  const { STRENGTH_TEMPLATES, isStrengthTemplateAvailable } = await server.ssrLoadModule('/src/features/strength/templates/strengthTemplates.js');
  const { STRENGTH_EXERCISES } = await server.ssrLoadModule('/src/features/strength/library/strengthExercises.js');
  const { PRESCRIPTION_TIER_ENVELOPES } = await server.ssrLoadModule('/src/features/progression/progressionConstants.js');
  const { REP_TARGETS, HOLD_TARGETS, PLANNING_SECONDS_PER_REP, MIN_INTERSET_REST_SECONDS } = await server.ssrLoadModule('/src/features/programGeneration/programGenerationConstants.js');
  const equipment=Object.values(A.STRENGTH_EQUIPMENT);
  const b=buildSessionTimeBudget({programMode:A.PROGRAM_MODES.BOXING_AND_STRENGTH,sessionDurationMinutes:60,experienceLevel:A.EXPERIENCE_LEVELS.BEGINNER,difficulty:A.DIFFICULTY_LEVELS.NORMAL});
  console.log('budget',JSON.stringify(b,null,2));
  console.log('constants',{REP_TARGETS,HOLD_TARGETS,PLANNING_SECONDS_PER_REP,MIN_INTERSET_REST_SECONDS,tier1:PRESCRIPTION_TIER_ENVELOPES.tier_1});
  const eligible=STRENGTH_TEMPLATES.filter(t=>b.strengthBudget.eligibleMovementCounts.includes(t.movementCount)&&isStrengthTemplateAvailable(t,equipment));
  console.log('eligible',eligible.map(t=>({id:t.id,count:t.movementCount,exerciseIds:t.exerciseIds})));
  const exById=new Map(STRENGTH_EXERCISES.map(x=>[x.id,x]));
  for(const t of eligible){
    const fit=fitStrengthPrescription({template:t,tierKey:'tier_1',budgets:b.strengthBudget,generationSeed:'probe',trainingOrdinal:1});
    const estimates=t.exerciseIds.map(id=>{const ex=exById.get(id); const sides=['unilateral','isometric_unilateral'].includes(ex.laterality)?2:1; const target=ex.prescriptionType==='reps'?REP_TARGETS.tier_1:HOLD_TARGETS.tier_1; return {id,type:ex.prescriptionType,laterality:ex.laterality,target,estimate:2*target*sides*(ex.prescriptionType==='reps'?PLANNING_SECONDS_PER_REP:1)};});
    console.log('fit',t.id,JSON.stringify(fit), 'estimates',estimates,'totalEst',estimates.reduce((s,x)=>s+x.estimate,0),'restEvents',t.exerciseIds.length,'recoveryPerEvent',b.strengthBudget.recoveryBudgetSeconds/t.exerciseIds.length);
  }
} finally { await server.close(); }
