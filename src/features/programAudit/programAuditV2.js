import {PROGRAM_MODES,PROGRAM_DURATION_MONTHS,EXPERIENCE_LEVELS,DIFFICULTY_LEVELS,WEEKDAYS,BOXING_STANCES,BOXING_MAX_MOVES,WORKOUT_BLOCK_TYPES as T,BOXING_MOVEMENT_TYPES} from '@/config/architecture';
import {AUDIT_REASON_CODES as RC,AUDIT_WARNING_CODES as WC,LOCAL_PROGRAM_AUDIT_ENGINE_VERSION} from './programAuditConstants';
import {planWeeklyRoles,computeWeeklyMetrics} from '@/features/weeklyBalance/weeklyRolePlanner';
import {computeBlueprintFingerprint,stableObjectString} from '@/features/programGeneration/blueprintFingerprint';
import {stableHash} from '@/features/programGeneration/deterministicSelection';
import {buildEngineVersions} from '@/features/programGeneration/engineVersionSnapshot';
import {buildScheduledDates,addCalendarMonthsClamped,weekdayIndex} from '@/features/programGeneration/programCalendarEngine';
import {buildV2ProgramContexts,v2DaySnapshots,v2FootworkPrescription,isBoxingRole} from '@/features/programGeneration/v2ProgramPolicy';
import {validateFullProgramBlueprint} from '@/features/programGeneration/programBlueprintValidator';
import {BOXING_COMBINATIONS} from '@/features/boxing/combinations/boxingCombinations';
import {BOXING_V2_FOUNDATIONAL_COMBINATIONS} from '@/features/boxing/curriculum/boxingV2FoundationalCombinations';
import {BOXING_MOVES} from '@/features/boxing/library/boxingMoves';
import {getComboRequiredStage} from '@/features/boxing/curriculum/boxingTechniqueCurriculum';
import {buildV2AttackRoundRolePlan} from '@/features/boxing/curriculum/boxingV2AttackRoundRolePolicy';
import {resolveV2ComboLengthPolicy} from '@/features/boxing/curriculum/boxingV2ComboLengthPolicy';
import {getV2DefenseEligibleRules} from '@/features/boxing/curriculum/boxingV2DefenseCurriculumEligibility';
import {STRENGTH_TEMPLATES,isStrengthTemplateAvailable} from '@/features/strength/templates/strengthTemplates';
import {fitV2StrengthPrescription as fitStrengthPrescription} from '@/features/programGeneration/v2StrengthPrescriptionFitter';
import {templatePatternMask} from './auditFinding';

const comboById=new Map([...BOXING_COMBINATIONS,...BOXING_V2_FOUNDATIONAL_COMBINATIONS].map(c=>[c.id,c]));
const moveById=new Map(BOXING_MOVES.map(m=>[m.id,m]));
const templateById=new Map(STRENGTH_TEMPLATES.map(t=>[t.id,t]));
const eq=(a,b)=>stableObjectString(a)===stableObjectString(b);

export function auditProgramSnapshotV2(snapshot) {
 const findings=[];let checks=0,recomputed=null;
 const check=(condition,code,day=null,details={})=>{checks++;if(!condition)findings.push({code,severity:'critical',category:'policy',message:'Program doğrulaması başarısız.',location:day?{trainingOrdinal:day.trainingOrdinal,plannedDate:day.plannedDate}:{},details});};
 try {
  const {program,programVersion:version}=snapshot,s=version.settingsSnapshot,days=[...snapshot.programDays].sort((a,b)=>a.trainingOrdinal-b.trainingOrdinal),blocks=snapshot.workoutBlocks;
  check(program.currentVersionId===version.id&&version.programId===program.id,RC.AUDIT_VERSION_RELATION_MISMATCH);
  check(Object.values(PROGRAM_MODES).includes(s.programMode)&&Object.values(PROGRAM_DURATION_MONTHS).includes(s.durationMonths)&&Object.values(EXPERIENCE_LEVELS).includes(s.experienceLevel)&&Object.values(DIFFICULTY_LEVELS).includes(s.difficulty)&&Number.isInteger(s.daysPerWeek)&&s.daysPerWeek>=1&&s.daysPerWeek<=7&&Array.isArray(s.selectedWeekdays)&&s.selectedWeekdays.length===s.daysPerWeek&&new Set(s.selectedWeekdays).size===s.daysPerWeek&&s.selectedWeekdays.every(w=>WEEKDAYS.includes(w))&&Number.isInteger(s.sessionDurationMinutes)&&s.sessionDurationMinutes>=10&&s.sessionDurationMinutes<=120,RC.AUDIT_INVALID_SETTINGS_SNAPSHOT);
  if(s.programMode!=='strength_only')check(Object.values(BOXING_STANCES).includes(s.boxingStance)&&BOXING_MAX_MOVES.includes(s.boxingMaxMoves),RC.AUDIT_INVALID_SETTINGS_SNAPSHOT);
  check(eq(version.engineVersions,buildEngineVersions()),RC.AUDIT_ENGINE_VERSION_INCOMPATIBLE);
  recomputed=computeBlueprintFingerprint(snapshot,version.generationSeed);
  check(recomputed===version.blueprintFingerprint,RC.AUDIT_INPUT_FINGERPRINT_MISMATCH);
  const end=addCalendarMonthsClamped(version.programStartDate,s.durationMonths),indices=s.selectedWeekdays.map(w=>WEEKDAYS.indexOf(w));
  const dates=buildScheduledDates(version.programStartDate,end,indices);
  check(end===version.endDateExclusive&&dates.length===days.length&&days.length===version.totalPlannedTrainingSessions,RC.AUDIT_CALENDAR_DURATION_MISMATCH);
  const contexts=buildV2ProgramContexts(s,dates),byDay=new Map(days.map(d=>[d.id,[]]));
  const seen=new Set();for(const block of blocks){check(byDay.has(block.programDayId)&&!seen.has(block.id),RC.AUDIT_BLOCK_ORDER_INVALID);seen.add(block.id);byDay.get(block.programDayId)?.push(block);}
  check(new Set(days.map(d=>d.id)).size===days.length,RC.AUDIT_DAY_COUNT_MISMATCH);
  const structural=validateFullProgramBlueprint({...snapshot,program:{...program,status:'review_required'},programVersion:{...version,status:'review_required',locked:false}});
  check(structural.valid,RC.AUDIT_ROLE_COMPOSITION_INVALID,null,{reasons:structural.reasons});
  const strengthMasks=[];
  for(let i=0;i<days.length;i++) {
    const day=days[i],dc=contexts[i];if(!dc){check(false,RC.AUDIT_DAY_COUNT_MISMATCH);continue;}
    const bs=byDay.get(day.id).sort((a,b)=>a.orderIndex-b.orderIndex),expected=v2DaySnapshots(dc);
    check(day.programVersionId===version.id&&day.trainingOrdinal===i+1&&day.plannedDate===dc.sd.date&&day.weekday===WEEKDAYS[dc.sd.weekdayIndex]&&day.programWeekIndex===dc.sd.programWeekIndex&&day.programMonthIndex===dc.sd.programMonthIndex,RC.AUDIT_CALENDAR_DURATION_MISMATCH,day);
    check(day.sessionRole===dc.role&&day.defenseEligible===dc.defenseEligible&&day.progressionFocus===dc.focus&&day.sessionDurationMinutes===s.sessionDurationMinutes,RC.AUDIT_WEEKLY_ROLE_MISMATCH,day);
    for(const key of Object.keys(expected))check(eq(day[key],expected[key]),RC.AUDIT_PROGRESSION_MISMATCH,day,{field:key});
    check(day.phaseId===dc.progression.result.phase.id&&day.phaseIndex===dc.progression.result.phase.index&&day.purpose===dc.cycle.objective,RC.AUDIT_PROGRESSION_MISMATCH,day);
    check(bs.every((b,index)=>b.orderIndex===index&&Number.isInteger(b.plannedSeconds)&&b.plannedSeconds>0)&&bs.reduce((sum,b)=>sum+b.plannedSeconds,0)===s.sessionDurationMinutes*60,RC.AUDIT_DAY_TIME_MISMATCH,day);
    check(bs[0]?.type===T.WARMUP&&bs.at(-1)?.type===T.COOLDOWN&&bs[0].plannedSeconds===dc.budget.blocks.warmupSeconds&&bs.at(-1).plannedSeconds===dc.budget.blocks.cooldownSeconds,RC.AUDIT_BLOCK_ORDER_INVALID,day);
    const foot=bs.filter(b=>b.type===T.FOOTWORK_TECHNIQUE);
    check(foot.length===(dc.footwork?.scheduled?1:0)&&(!foot.length||(foot[0].footworkMoveId===dc.footwork.footworkMoveId&&foot[0].plannedSeconds===dc.footwork.footworkTechniqueSeconds)),RC.AUDIT_FOOTWORK_TECHNIQUE_INVALID,day);
    const boxing=bs.filter(b=>[T.BOXING_ATTACK_WORK,T.BOXING_DEFENSE_WORK,T.BOXING_REST].includes(b.type));
    if(isBoxingRole(dc.role)) {
      const segments=dc.budget.boxingBudget.intervalSegments;
      check(boxing.length===segments.length&&boxing.every((b,index)=>b.plannedSeconds===segments[index]?.durationSeconds&&b.roundIndex===segments[index]?.roundIndex&&(segments[index]?.type==='rest'?b.type===T.BOXING_REST:b.type!==T.BOXING_REST)),RC.AUDIT_BOXING_INTERVAL_MISMATCH,day);
      const rolePlan=buildV2AttackRoundRolePlan({attackRoundCount:dc.budget.boxingBudget.plannedWorkRoundCount,durationMonths:s.durationMonths,experienceLevel:s.experienceLevel,...dc.curriculum});
      const length=resolveV2ComboLengthPolicy(s.durationMonths,s.experienceLevel);
      const attacks=boxing.filter(b=>b.type===T.BOXING_ATTACK_WORK);
      for(const block of attacks) {
        const combo=comboById.get(block.combinationId),required=combo?getComboRequiredStage(combo.moveIds):null;
        check(!!combo&&required!==null&&required<=dc.curriculum.stage&&eq(block.moveIds,combo?.moveIds)&&block.moveCount===combo?.moveCount&&block.moveIds?.every(id=>moveById.get(id)?.movementType===BOXING_MOVEMENT_TYPES.STRIKE),RC.AUDIT_BOXING_MOVE_ORDER_MISMATCH,day);
        check(block.attackRoundRole===rolePlan.rolePlan[block.roundIndex]&&block.moveCount<=s.boxingMaxMoves&&block.moveCount<=dc.caps.boxingComplexityCap&&block.moveCount<=(block.attackRoundRole==='challenge'?length.challengeCeiling:length.normalCeiling),RC.AUDIT_BOXING_COMBO_CAP_EXCEEDED,day);
        if(['foundational','support'].includes(block.attackRoundRole))check(length.supportRange.includes(block.moveCount),RC.AUDIT_BOXING_COMBO_CAP_EXCEEDED,day);
        check(combo?.allowedWorkingRanges.includes(block.workingRange)&&eq(block.requiredContext,combo?.requiredContext),RC.AUDIT_BOXING_CONTEXT_INVALID,day);
        check(eq(block.footworkPrescription??null,v2FootworkPrescription(s,dc,block.roundIndex)),RC.AUDIT_FOOTWORK_PRESCRIPTION_INVALID,day);
      }
      const defense=boxing.filter(b=>b.type===T.BOXING_DEFENSE_WORK);
      check(defense.length===(dc.defenseEligible?1:0),RC.AUDIT_DEFENSE_COUNT_MISMATCH,day);
      for(const block of defense) {
        const rule=getV2DefenseEligibleRules(dc.curriculum.stage).find(r=>r.id===block.defenseRuleId);
        check(!!rule&&block.roundIndex===(dc.budget.boxingBudget.plannedWorkRoundCount>=2?1:0)&&block.defenseMoveId===rule?.defenseMoveId&&eq(block.counterMoveIds,rule?.counterMoveIds)&&block.incomingThreatType===rule?.incomingThreatType&&block.opponentStanceRelation===rule?.opponentStanceRelation&&block.workingRange==='mid',RC.AUDIT_DEFENSE_CONTENT_MISMATCH,day);
      }
    } else check(boxing.length===0&&foot.length===0,RC.AUDIT_ROLE_COMPOSITION_INVALID,day);
    const strength=bs.filter(b=>b.type===T.STRENGTH_EXERCISE);
    if(dc.role!=='boxing_only_day') {
      const template=templateById.get(strength[0]?.templateId),eligible=dc.budget.strengthBudget.eligibleMovementCounts;
      check(!!template&&isStrengthTemplateAvailable(template,s.availableEquipment)&&template.movementCount<=dc.caps.strengthMovementCap&&eligible.includes(template.movementCount)&&eq(strength.map(b=>b.exerciseId),template.exerciseIds),RC.AUDIT_STRENGTH_TEMPLATE_INVALID,day);
      if(template) {
        const fit=fitStrengthPrescription({template,tierKey:dc.caps.strengthTierCap,budgets:dc.budget.strengthBudget,generationSeed:version.generationSeed,trainingOrdinal:dc.ordinal});
        check(fit.valid&&strength.length===fit.prescriptions.length&&strength.every((block,index)=>Object.keys(fit.prescriptions[index]).every(key=>eq(block[key],fit.prescriptions[index][key]))),RC.AUDIT_STRENGTH_CONSTITUTION_FAILED,day);
        const available=STRENGTH_TEMPLATES.filter(t=>isStrengthTemplateAvailable(t,s.availableEquipment)&&eligible.includes(t.movementCount)&&t.movementCount<=dc.caps.strengthMovementCap);
        strengthMasks.push({actual:templatePatternMask(template),possible:available.reduce((mask,t)=>mask|templatePatternMask(t),0),day});
      }
    } else check(!strength.length,RC.AUDIT_ROLE_COMPOSITION_INVALID,day);
    const transitions=bs.filter(b=>b.type===T.MODE_TRANSITION);
    check(transitions.length===(dc.role==='combined_boxing_strength_day'?1:0)&&(!transitions.length||transitions[0].plannedSeconds===dc.budget.blocks.transitionSeconds),RC.AUDIT_ROLE_COMPOSITION_INVALID,day);
    if(transitions.length)check(boxing.every(b=>b.orderIndex<transitions[0].orderIndex)&&strength.every(b=>b.orderIndex>transitions[0].orderIndex),RC.AUDIT_BLOCK_ORDER_INVALID,day);
  }
  for(let i=0;i+4<=strengthMasks.length;i++) {
    const window=strengthMasks.slice(i,i+4),actual=window.reduce((m,s)=>m|s.actual,0),possible=window.reduce((m,s)=>m|s.possible,0);
    check((actual&possible)===possible,RC.AUDIT_ROLLING_PATTERN_COVERAGE_MISSED,window[0].day);
  }
  const metrics=computeWeeklyMetrics(planWeeklyRoles(s.programMode,s.selectedWeekdays,s.strengthDaysPerWeek),s.sessionDurationMinutes);
  for(const [present,code] of [[metrics.adjacentStrengthPairCount>0,WC.AUDIT_ADJACENT_STRENGTH_DAYS_UNAVOIDABLE],[metrics.maxConsecutiveTrainingDays>=4,WC.AUDIT_HIGH_CONSECUTIVE_TRAINING_DENSITY],[metrics.trainingDayCount===7,WC.AUDIT_NO_UNSCHEDULED_WEEKDAY_GAP]])if(present)findings.push({code,severity:'warning',category:'weekly_balance',message:'Haftalık yoğunluk uyarısı.',location:{},details:{}});
 } catch(error) {check(false,RC.AUDIT_ENGINE_ERROR,null,{error:error.message});}
 const critical=findings.filter(f=>f.severity==='critical').length,outcome=critical?'fail':'pass';
 const auditFingerprint=`AFP_${stableHash([snapshot?.programVersion?.id,snapshot?.programVersion?.blueprintFingerprint,LOCAL_PROGRAM_AUDIT_ENGINE_VERSION,outcome,checks,stableObjectString(findings)].join('|'))}`;
 return {success:true,outcome,criticalIssueCount:critical,warningCount:findings.length-critical,findings,checkSummary:{totalChecks:checks,v2Checks:checks},auditFingerprint,recomputedFingerprint:recomputed};
}
