export async function createApprovedProgram(page) {
  return page.evaluate(async()=>{
    const {generateProgramBlueprint}=await import('/src/features/programGeneration/programGenerationEngine.js');
    const {persistProgramBlueprint}=await import('/src/features/programGeneration/programPersistenceService.js');
    const {runProgramAudit}=await import('/src/features/programAudit/programAuditService.js');
    const {approveProgram}=await import('/src/features/programApproval/programApprovalService.js');
    const input={programMode:'boxing_only',durationMonths:1,daysPerWeek:3,selectedWeekdays:['MONDAY','WEDNESDAY','FRIDAY'],sessionDurationMinutes:30,experienceLevel:'beginner',difficulty:'normal',preferredTrainingTime:null,boxingStance:'orthodox',boxingMaxMoves:4,strengthDaysPerWeek:0,availableEquipment:[],generationLocalDate:'2026-01-05',generationSeed:'browser-workout-v1',generationRequestId:'browser-workout-v1',generationPolicyVersion:1};
    const result=generateProgramBlueprint(input);
    if(!result.valid)throw new Error(JSON.stringify(result.reasons));
    const saved=await persistProgramBlueprint(result.blueprint);
    if(!saved.valid)throw new Error('Persistence failed');
    const audit=await runProgramAudit(saved.programId);
    if(!audit.success||audit.outcome!=='pass')throw new Error(JSON.stringify(audit));
    const approved=await approveProgram(saved.programId);
    if(!approved.success)throw new Error(JSON.stringify(approved));
    return result.blueprint.programDays[0].id;
  });
}
