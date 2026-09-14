import { createServer } from 'vite';
const server=await createServer({server:{middlewareMode:true},appType:'custom',clearScreen:false,logLevel:'error'});
try{
 const A=await server.ssrLoadModule('/src/config/architecture.js');
 const {generateProgramBlueprint}=await server.ssrLoadModule('/src/features/programGeneration/programGenerationEngine.js');
 const {auditProgramSnapshot}=await server.ssrLoadModule('/src/features/programAudit/programAuditEngine.js');
 const ds=Object.values(A.PROGRAM_DURATION_MONTHS), es=Object.values(A.EXPERIENCE_LEVELS), fs=Object.values(A.DIFFICULTY_LEVELS), eq=Object.values(A.STRENGTH_EQUIPMENT), mins=[15,20,30,40,45,60];let n=0;
 const counts={}, sample={}; let gen=0,pass=0,fail=0;
 for(const d of ds)for(const e of es)for(const f of fs)for(const m of mins){const input={programMode:A.PROGRAM_MODES.BOXING_AND_STRENGTH,durationMonths:d,daysPerWeek:4,selectedWeekdays:['MONDAY','TUESDAY','THURSDAY','SATURDAY'],sessionDurationMinutes:m,experienceLevel:e,difficulty:f,preferredTrainingTime:null,boxingStance:A.BOXING_STANCES.ORTHODOX,boxingMaxMoves:4,strengthDaysPerWeek:2,availableEquipment:eq,generationLocalDate:'2026-01-05',generationSeed:`a-${n}`,generationRequestId:`ar-${n++}`};const r=generateProgramBlueprint(input);if(!r.valid)continue;gen++;const a=auditProgramSnapshot(r.blueprint);if(a.outcome==='pass'){pass++;continue;}fail++;const codes=[...new Set(a.findings.filter(x=>x.severity==='critical').map(x=>x.code))];for(const c of codes){counts[c]=(counts[c]||0)+1;if(!sample[c])sample[c]={duration:d,experience:e,difficulty:f,minutes:m,critical:a.criticalIssueCount,warnings:a.warningCount,details:a.findings.filter(x=>x.code===c).slice(0,2).map(x=>({message:x.message,location:x.location,details:x.details}))};}}
 console.log(`AUDIT_SUMMARY generated=${gen} pass=${pass} fail=${fail}`);console.log(`AUDIT_CODES ${JSON.stringify(counts)}`);for(const [c,s] of Object.entries(sample))console.log(`AUDIT_SAMPLE ${c} ${JSON.stringify(s)}`);
}finally{await server.close();}
