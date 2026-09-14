import { createServer } from 'vite';
const server = await createServer({server:{middlewareMode:true},appType:'custom',clearScreen:false,logLevel:'error'});
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
const groupIntervals=(values)=>{if(!values.length)return '-';const s=[...new Set(values)].sort((a,b)=>a-b);let out=[],a=s[0],p=s[0];for(const v of s.slice(1)){if(v===p+1){p=v;continue;}out.push(a===p?`${a}`:`${a}-${p}`);a=p=v;}out.push(a===p?`${a}`:`${a}-${p}`);return out.join(',');};
try {
 const A=await server.ssrLoadModule('/src/config/architecture.js');
 const {generateProgramBlueprint}=await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
 const {auditProgramSnapshot}=await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
 const modes=A.PROGRAM_MODES, durations=Object.values(A.PROGRAM_DURATION_MONTHS), exps=Object.values(A.EXPERIENCE_LEVELS), diffs=Object.values(A.DIFFICULTY_LEVELS), equipment=Object.values(A.STRENGTH_EQUIPMENT);
 let n=0; const input=(mode,duration,min,exp,diff)=>({programMode:mode,durationMonths:duration,daysPerWeek:4,selectedWeekdays:['MONDAY','TUESDAY','THURSDAY','SATURDAY'],sessionDurationMinutes:min,experienceLevel:exp,difficulty:diff,preferredTrainingTime:null,boxingStance:mode===modes.STRENGTH_ONLY?null:A.BOXING_STANCES.ORTHODOX,boxingMaxMoves:mode===modes.STRENGTH_ONLY?null:4,strengthDaysPerWeek:mode===modes.BOXING_ONLY?0:(mode===modes.STRENGTH_ONLY?4:2),availableEquipment:mode===modes.BOXING_ONLY?[]:equipment,generationLocalDate:'2026-01-05',generationSeed:`summary-seed-${n}`,generationRequestId:`summary-req-${n++}`});
 const run=(mode,mins)=>{const rows=[];for(const d of durations)for(const e of exps)for(const f of diffs)for(const m of mins){const r=generateProgramBlueprint(input(mode,d,m,e,f));rows.push({d,e,f,m,valid:r.valid,reason:r.reasons?.[0]||null,bp:r.blueprint});}return rows;};
 const combined=run(modes.BOXING_AND_STRENGTH,range(10,60));
 console.log(`SUMMARY combined_10_60 total=${combined.length} valid=${combined.filter(x=>x.valid).length} invalid=${combined.filter(x=>!x.valid).length}`);
 const reasons={};for(const x of combined.filter(x=>!x.valid))reasons[x.reason]=(reasons[x.reason]||0)+1;console.log(`SUMMARY combined_fail_reasons=${JSON.stringify(reasons)}`);
 for(const diff of diffs){const rows=combined.filter(x=>x.f===diff);console.log(`SUMMARY combined_${diff}_invalid_minutes=${groupIntervals(rows.filter(x=>!x.valid).map(x=>x.m))}`);}
 for(const m of [15,20,30,40,45,60]){const rows=combined.filter(x=>x.m===m);console.log(`SUMMARY combined_preset_${m}=${rows.filter(x=>x.valid).length}/${rows.length}`);}
 const strength=run(modes.STRENGTH_ONLY,[10,15,20,25,30,40,45,60,90,120]);
 console.log(`SUMMARY strength_smoke total=${strength.length} valid=${strength.filter(x=>x.valid).length} invalid=${strength.filter(x=>!x.valid).length}`);
 const sReasons={};for(const x of strength.filter(x=>!x.valid))sReasons[x.reason]=(sReasons[x.reason]||0)+1;console.log(`SUMMARY strength_fail_reasons=${JSON.stringify(sReasons)}`);
 const boxing=run(modes.BOXING_ONLY,[10,15,20,25,30,40,45,60,90,120]);console.log(`SUMMARY boxing_smoke total=${boxing.length} valid=${boxing.filter(x=>x.valid).length} invalid=${boxing.filter(x=>!x.valid).length}`);
 let auditTotal=0,auditPass=0,auditFail=0;for(const x of combined.filter(x=>x.valid&&[15,20,30,40,45,60].includes(x.m))){const a=auditProgramSnapshot(x.bp);auditTotal++;if(a.outcome==='pass')auditPass++;else auditFail++;}console.log(`SUMMARY combined_preset_audit total=${auditTotal} pass=${auditPass} fail=${auditFail}`);
 console.log('SUMMARY DONE');
} finally {await server.close();}
