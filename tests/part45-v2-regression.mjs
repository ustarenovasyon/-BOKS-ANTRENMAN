import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createServer} from 'vite';
const path=new URL('./fixtures/v2/program-matrix.json',import.meta.url),write=process.argv.includes('--write-new-fixtures');
const server=await createServer({optimizeDeps:{noDiscovery:true,entries:[]},server:{middlewareMode:true},appType:'custom',logLevel:'error'});
try {
 const {generateProgramBlueprint:g}=await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
 const {auditProgramSnapshot:a}=await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
 const {computeBlueprintFingerprint:fp}=await server.ssrLoadModule('/src/features/programGeneration/blueprintFingerprint.js');
 const {getComboRequiredStage,getDefenseRuleRequiredStage}=await server.ssrLoadModule('/src/features/boxing/curriculum/boxingTechniqueCurriculum.js');
 const {getV2DefenseEligibleRules}=await server.ssrLoadModule('/src/features/boxing/curriculum/boxingV2DefenseCurriculumEligibility.js');
 const rules=getV2DefenseEligibleRules(6);
 let fixture;
 if(write) {
  let exists=false;try{await access(path);exists=true;}catch{}
  assert.equal(exists,false,'Never overwrite an existing canonical fixture automatically.');
  fixture={fixtureVersion:1,generationPolicyVersion:2,cases:[]};let index=0;
  for(const duration of [1,3,6,9,12,15,18,24])for(const experience of ['beginner','intermediate','experienced'])for(const mode of ['boxing_only','strength_only','boxing_and_strength'])for(const difficulty of ['easy','normal','hard']) {
    const id=`v2-${duration}m-${experience}-${mode}-${difficulty}`;
    fixture.cases.push({id,input:{generationPolicyVersion:2,programMode:mode,durationMonths:duration,daysPerWeek:3,selectedWeekdays:['MONDAY','WEDNESDAY','FRIDAY'],sessionDurationMinutes:mode==='strength_only'?15:30,experienceLevel:experience,difficulty,preferredTrainingTime:null,boxingStance:mode==='strength_only'?null:index%2?'southpaw':'orthodox',boxingMaxMoves:mode==='strength_only'?null:[4,6,8,10][index%4],strengthDaysPerWeek:mode==='boxing_and_strength'?1:mode==='strength_only'?3:0,availableEquipment:mode==='boxing_only'?[]:['dumbbell','barbell','ez_bar'],generationLocalDate:'2026-01-05',generationSeed:`${id}-seed`,generationRequestId:`${id}-request`}});index++;
  }
 } else fixture=JSON.parse(await readFile(path,'utf8'));
 let count=0;
 for(const c of fixture.cases) {
  const result=g(structuredClone(c.input));assert.equal(result.valid,true,`${c.id}: ${result.detail||JSON.stringify(result.reasons)}`);
  const b=result.blueprint,audit=a(b);assert.equal(audit.outcome,'pass',`${c.id}: ${JSON.stringify(audit.findings.slice(0,3))}`);
  assert.equal(b.programVersion.generationPolicyVersion,2);
  assert.equal(Math.max(...b.programDays.map(d=>d.programMonthIndex)),c.input.durationMonths);
  const dayMap=new Map(b.programDays.map(d=>[d.id,d]));
  for(const block of b.workoutBlocks) {
    const day=dayMap.get(block.programDayId);
    if(block.type==='boxing_attack_work') {
      assert.equal(block.moveCount,block.moveIds.length);assert.ok(block.moveCount<=7);
      assert.ok(getComboRequiredStage(block.moveIds)<=day.curriculumSnapshot.stage);
      if(block.moveCount===7)assert.equal(block.attackRoundRole,'challenge');
      if(day.trainingCycleSnapshot.recovery)assert.ok(block.moveCount<=3);
    }
    if(block.type==='boxing_defense_work')assert.ok(getDefenseRuleRequiredStage(rules.find(r=>r.id===block.defenseRuleId))<=day.curriculumSnapshot.stage);
  }
  const expected={sessions:b.programDays.length,blueprintFingerprint:b.blueprintFingerprint,auditFingerprint:audit.auditFingerprint,critical:audit.criticalIssueCount};
  if(write)c.expected=expected;else {
    assert.deepEqual(expected,c.expected,c.id);
    const second=g(structuredClone(c.input));assert.deepEqual(second.blueprint,b,c.id+' independent generation');assert.deepEqual(a(second.blueprint),audit);
  }
  count++;if(count%27===0)console.log(`V2 matrix ${count}/${fixture.cases.length}`);
 }
 if(write){await mkdir(new URL('./fixtures/v2/',import.meta.url),{recursive:true});await writeFile(path,JSON.stringify(fixture,null,2)+'\n');}
 const base=fixture.cases.find(c=>c.input.durationMonths===6&&c.input.programMode==='boxing_only'&&c.input.experienceLevel==='beginner'&&c.input.difficulty==='normal');
 const source=g(base.input).blueprint;
 for(const mutate of [
  b=>{b.programVersion.engineVersions.boxingMoveLibraryVersion=null;},
  b=>{b.workoutBlocks.find(x=>x.type==='boxing_attack_work').attackRoundRole='made_up';},
  b=>{b.workoutBlocks.find(x=>x.type==='boxing_attack_work').moveIds=['BOX_CATCH_LEAD'];},
  b=>{b.programDays[0].trainingCycleSnapshot.objective='made_up';},
  b=>{b.workoutBlocks.find(x=>x.type==='boxing_footwork_technique').footworkMoveId='BOX_STEP_LEAD_SIDE';},
 ]) {
  const bad=structuredClone(source);mutate(bad);bad.blueprintFingerprint=fp(bad,bad.programVersion.generationSeed);bad.programVersion.blueprintFingerprint=bad.blueprintFingerprint;
  assert.equal(a(bad).outcome,'fail','Rehashing invalid content must not bypass semantic audit.');
 }
 for(const policy of [null,0,3,999])assert.equal(g({...base.input,generationPolicyVersion:policy}).valid,false);
 assert.equal(g({...base.input,generationPolicyVersion:1,durationMonths:24}).valid,false);
 assert.equal(g({...base.input,generationLocalDate:'2026-02-30'}).valid,false);
 // Calendar density, custom time limits and each single-equipment path.
 const weekdays=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
 let boundaryCases=0;
 for(const mode of ['boxing_only','strength_only','boxing_and_strength'])for(const days of [1,7])for(const minutes of [mode==='boxing_and_strength'?30:10,120]) {
  const input={...base.input,durationMonths:24,programMode:mode,daysPerWeek:days,selectedWeekdays:weekdays.slice(0,days),sessionDurationMinutes:minutes,strengthDaysPerWeek:mode==='boxing_only'?0:days,availableEquipment:mode==='boxing_only'?[]:[['dumbbell','barbell','ez_bar'][boundaryCases%3]],generationSeed:`boundary-${mode}-${days}-${minutes}`,generationRequestId:`boundary-${mode}-${days}-${minutes}`};
  const generated=g(input);assert.equal(generated.valid,true,JSON.stringify({input,reason:generated.detail||generated.reasons}));
  const audited=a(generated.blueprint);assert.equal(audited.outcome,'pass',JSON.stringify(audited.findings));
  assert.equal(generated.blueprint.programDays.at(-1).programMonthIndex,24);boundaryCases++;
 }
 assert.equal(boundaryCases,12);
 const originalRandom=Math.random,originalNow=Date.now;
 try{Math.random=()=>{throw new Error('Random generation forbidden');};Date.now=()=>{throw new Error('Hidden clock forbidden');};assert.deepEqual(g(base.input).blueprint,source);}finally{Math.random=originalRandom;Date.now=originalNow;}
 console.log(`PASS part45: ${count} V2 cases + ${boundaryCases} boundaries; exact FP/AFP, stage/month/role/recovery invariants, independent repeat and adversarial validation`);
} finally {await server.close();}
