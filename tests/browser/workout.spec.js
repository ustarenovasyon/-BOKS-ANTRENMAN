import {test,expect} from '@playwright/test';

async function createApprovedProgram(page) {
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
test('real IndexedDB: approval, timer, reload checkpoint, confirmation and exactly one history row',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByText('İlk antrenman programını oluştur.')).toBeVisible();
  const dayId=await createApprovedProgram(page);
  await page.goto(`/workout?day=${dayId}`);
  await expect(page.getByRole('button',{name:'Antrenmanı başlat'})).toBeVisible();
  await page.clock.install({time:new Date('2026-01-05T09:00:00Z')});
  await page.getByRole('button',{name:'Antrenmanı başlat'}).click();
  await page.clock.fastForward(5000);
  await expect(page.getByText('Yapılan 00:05',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Duraklat',exact:true}).click();
  await page.clock.fastForward(60000);
  await expect(page.getByText('Yapılan 00:05',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Devam et',exact:true}).click();
  await page.clock.fastForward(1000);
  await page.reload();await expect(page.getByRole('button',{name:'Devam et',exact:true})).toBeVisible();
  const before=await page.evaluate(async()=>{const {workoutHistoryRepository}=await import('/src/lib/localData/repositories/index.js');return workoutHistoryRepository.list();});
  expect(before).toHaveLength(0);
  await page.getByRole('button',{name:'Devam et',exact:true}).click();
  await page.clock.fastForward(1801000);
  await expect(page.getByRole('button',{name:'Yaptım, sonucu kaydet'})).toBeVisible();
  expect(await page.evaluate(async()=>{const {workoutHistoryRepository:r}=await import('/src/lib/localData/repositories/index.js');return r.count();})).toBe(0);
  await page.getByRole('button',{name:'Yaptım, sonucu kaydet'}).click();
  await expect(page.getByText('Sonucun kaydedildi.')).toBeVisible();
  await page.reload();await expect(page.getByText('Sonucun kaydedildi.')).toBeVisible();
  const after=await page.evaluate(async()=>{const {workoutHistoryRepository:r}=await import('/src/lib/localData/repositories/index.js');return r.list();});
  expect(after).toHaveLength(1);expect(after[0].status).toBe('completed');expect(after[0].actualSeconds).toBe(1800);
  expect(errors).toEqual([]);
});

test('skipped workout commits one real skipped result',async({page})=>{
  await page.goto('/');await expect(page.getByText('İlk antrenman programını oluştur.')).toBeVisible();
  const dayId=await createApprovedProgram(page);await page.goto(`/workout?day=${dayId}`);
  await page.getByRole('button',{name:'Antrenmanı sonlandır',exact:true}).click();
  await page.getByRole('button',{name:'Sonlandır ve kaydet'}).click();
  await expect(page.getByText('Sonucun kaydedildi.')).toBeVisible();
  const rows=await page.evaluate(async()=>{const {workoutHistoryRepository:r}=await import('/src/lib/localData/repositories/index.js');return r.list();});
  expect(rows).toHaveLength(1);expect(rows[0].status).toBe('skipped');expect(rows[0].actualSeconds).toBe(0);
});
