import {WEEKDAYS,WEEKLY_SESSION_ROLES as R} from '@/config/architecture';
import {planWeeklyRoles} from '@/features/weeklyBalance/weeklyRolePlanner';
import {ROLE_BUDGET_MODE} from '@/features/weeklyBalance/weeklyBalanceConstants';
import {buildSessionTimeBudget} from '@/features/sessionBudget/sessionTimeBudgetEngine';
import {buildBoxingIntervalBudget} from '@/features/sessionBudget/boxingIntervalBudget';
import {buildProgramProgression} from '@/features/progression/progressionEngine';
import {pickFocus,applyProgressionFocusBalance} from '@/features/weeklyBalance/progressionFocusBalancer';
import {resolveBoxingCurriculumStage} from '@/features/boxing/curriculum/boxingCurriculumStageResolver';
import {resolveTrainingCycle} from '@/features/boxing/curriculum/longTermTimelinePolicy';
import {deriveStageLocalExposureOrdinal} from '@/features/boxing/curriculum/boxingV2AttackRoundRolePolicy';
import {planMixedDefenseSlots} from './defenseContentSelector';
import {planV2FootworkTechniqueSession} from './footworkSchedulingPolicy';
import {getEligibleFootworkMoveIdsAtStage} from './footworkTechniqueBlock';

export const isBoxingRole=role=>role===R.BOXING_ONLY_DAY||role===R.COMBINED_BOXING_STRENGTH_DAY;

function intervalBudget(seconds,experience,difficulty,workCap) {
  const result=buildBoxingIntervalBudget(seconds,experience,difficulty,{workSecondsOverride:workCap});
  // The V1 packer may absorb a remainder into work. V2 keeps its exact cap.
  const segments=result.intervalSegments.flatMap(segment=>segment.type==='work'&&segment.durationSeconds>workCap
    ?[{...segment,durationSeconds:workCap},{type:/** @type {'rest'} */('rest'),roundIndex:segment.roundIndex,durationSeconds:segment.durationSeconds-workCap}]:[segment]);
  return {...result,intervalSegments:segments,totalWorkSeconds:segments.filter(s=>s.type==='work').reduce((a,b)=>a+b.durationSeconds,0),totalRestSeconds:segments.filter(s=>s.type==='rest').reduce((a,b)=>a+b.durationSeconds,0)};
}

// Shared policy contract, consumed by generation and independently checked by audit.
export function buildV2ProgramContexts(settings,dates) {
  const roles=planWeeklyRoles(settings.programMode,settings.selectedWeekdays,settings.strengthDaysPerWeek);
  /** @type {Array<Record<string, any>>} */
  const contexts=dates.map((sd,index)=>{
    const role=roles[sd.weekdayIndex].sessionRole;
    const budget=buildSessionTimeBudget({programMode:ROLE_BUDGET_MODE[role],sessionDurationMinutes:settings.sessionDurationMinutes,experienceLevel:settings.experienceLevel,difficulty:settings.difficulty});
    const progression=buildProgramProgression({durationMonths:settings.durationMonths,programMode:settings.programMode,experienceLevel:settings.experienceLevel,difficulty:settings.difficulty,trainingOrdinal:index+1,totalPlannedTrainingSessions:dates.length,userBoxingMaxMoves:settings.boxingMaxMoves,sessionBudget:budget});
    if(!budget.valid||!progression.valid)throw new Error('V2 session budget/progression failed');
    return {sd,ordinal:index+1,role,budget,progression};
  });
  const totalBoxingExposures=contexts.filter(c=>isBoxingRole(c.role)).length;
  let exposure=0;
  for(const dc of contexts) {
    dc['curriculum']=null;dc['defenseLevel']='none';
    if(isBoxingRole(dc.role)) {
      const result=resolveBoxingCurriculumStage({durationMonths:settings.durationMonths,experienceLevel:settings.experienceLevel,boxingExposureOrdinal:++exposure,totalBoxingExposures});
      if(!result.valid)throw new Error(result.reason);
      dc['curriculum']={stage:result.stage,boxingExposureOrdinal:exposure,totalBoxingExposures};
      dc['defenseLevel']=result.stage>=3?'regular':result.stage===2?'intro':'none';
    }
  }
  const weeks=[...new Set(dates.map(d=>d.programWeekIndex))];
  for(const week of weeks) {
    const members=contexts.filter(c=>c.sd.programWeekIndex===week);
    const defense=planMixedDefenseSlots(members.filter(c=>isBoxingRole(c.role)).map(c=>({weekdayIndex:c.sd.weekdayIndex,role:c.role,level:c['defenseLevel']})),week);
    members.forEach((dc,slot)=>{
      dc['defenseEligible']=defense.has(dc.sd.weekdayIndex);
      dc['focus']=pickFocus(dc.role,week,slot,dc['defenseEligible']);
      const caps=applyProgressionFocusBalance(dc.progression,dc.role,dc['focus']);
      const cycle=resolveTrainingCycle({durationMonths:settings.durationMonths,programWeekIndex:week,stage:dc['curriculum']?.stage??1});
      if(!caps||!cycle)throw new Error('V2 balancing failed');
      dc['cycle']=cycle;
      dc['caps']={...caps};
      if(cycle.recovery) {
        if(caps.boxingComplexityCap!==null)dc['caps'].boxingComplexityCap=Math.min(caps.boxingComplexityCap,cycle.comboCeiling);
        if(caps.boxingWorkCapSeconds!==null)dc['caps'].boxingWorkCapSeconds=Math.min(caps.boxingWorkCapSeconds,cycle.workSecondsCap);
        if(caps.strengthTierCap!==null){dc['caps'].strengthTierCap='tier_1';dc['caps'].strengthMovementCap=Math.min(...dc.budget.strengthBudget.eligibleMovementCounts);}
      }
      dc['footwork']=null;
      if(isBoxingRole(dc.role)) {
        const footwork=planV2FootworkTechniqueSession({generationPolicyVersion:2,durationMonths:settings.durationMonths,experienceLevel:settings.experienceLevel,...dc['curriculum'],boxingSeconds:dc.budget.blocks.boxingSeconds});
        if(!footwork.valid)throw new Error(footwork.reason);
        dc['footwork']=footwork;
        dc.budget={...dc.budget,boxingBudget:intervalBudget(footwork.boxingIntervalSeconds,settings.experienceLevel,settings.difficulty,dc['caps'].boxingWorkCapSeconds)};
      }
    });
  }
  return contexts;
}
export function v2FootworkPrescription(settings,context,roundIndex) {
  if(!context.curriculum)return null;
  const local=deriveStageLocalExposureOrdinal({durationMonths:settings.durationMonths,experienceLevel:settings.experienceLevel,...context.curriculum});
  if(!local.valid||local.stageLocalOrdinal<=2||(context.curriculum.boxingExposureOrdinal+roundIndex)%3!==0)return null;
  const eligible=getEligibleFootworkMoveIdsAtStage(local.stage),index=(context.curriculum.boxingExposureOrdinal+roundIndex)%eligible.length;
  return {actions:[{phase:'before_combo',movementId:eligible[index]},{phase:'after_combo',movementId:eligible[(index+1)%eligible.length]}]};
}
export function v2DaySnapshots(dc) {
  return {
    budgetSnapshot:{...dc.budget.blocks,totalSeconds:dc.budget.totalSeconds,eligibleMovementCounts:dc.budget.strengthBudget?.eligibleMovementCounts??[]},
    progressionSnapshot:{phaseId:dc.progression.result.phase.id,phaseIndex:dc.progression.result.phase.index,phaseCount:dc.progression.result.phase.count},
    balancedCapsSnapshot:dc.caps,curriculumSnapshot:dc.curriculum,trainingCycleSnapshot:dc.cycle,
  };
}
