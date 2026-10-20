import {WEEKDAYS,PROGRAM_MODES} from '@/config/architecture';
import {WEEKDAY_INDEX} from '@/features/weeklyBalance/weeklyBalanceConstants';
import {resolveProgramStartDate,addCalendarMonthsClamped,buildScheduledDates} from './programCalendarEngine';
import {buildV2ProgramContexts,v2FootworkPrescription,v2DaySnapshots,isBoxingRole} from './v2ProgramPolicy';
import {selectBoxingRounds} from './boxingContentSelector';
import {selectDefenseRule} from './defenseContentSelector';
import {selectStrengthTemplate} from './strengthTemplateSelector';
import {fitV2StrengthPrescription as fitStrengthPrescription} from './v2StrengthPrescriptionFitter';
import {buildV2StrengthCoveragePlan,eligibleV2StrengthTemplateIds} from './v2StrengthCoverage';
import {buildDayBlocks} from './workoutBlockBuilder';
import {computeBlueprintFingerprint} from './blueprintFingerprint';
import {validateFullProgramBlueprint} from './programBlueprintValidator';

export function generateProgramBlueprintV2(input,settings,engineVersions) {
 try {
  const indices=settings.selectedWeekdays.map(w=>WEEKDAY_INDEX[w]),start=resolveProgramStartDate(input.generationLocalDate,indices),end=addCalendarMonthsClamped(start,settings.durationMonths);
  const dates=buildScheduledDates(start,end,indices),contexts=buildV2ProgramContexts(settings,dates);
  const programId=`PRG_${input.generationRequestId}`,versionId=`PRV_${input.generationRequestId}`;
  const programDays=[],workoutBlocks=[],previousPrimaryIds=[],previousTemplateIds=[],usage={};let defenseCounter=0;
  const strengthCoverage=buildV2StrengthCoveragePlan(contexts,settings);
  for(const dc of contexts) {
    let rounds=null,defense=null,strength=null;
    if(isBoxingRole(dc.role)) {
      const selected=selectBoxingRounds({boxingBudget:dc.budget.boxingBudget,effectiveComboCeiling:dc.caps.boxingComplexityCap,userBoxingMaxMoves:settings.boxingMaxMoves,focus:dc.focus,generationSeed:input.generationSeed,trainingOrdinal:dc.ordinal,previousPrimaryIds,programUsageCount:usage,generationPolicyVersion:2,curriculumStage:dc.curriculum.stage,durationMonths:settings.durationMonths,experienceLevel:settings.experienceLevel,...dc.curriculum});
      if(!selected.valid)throw new Error(selected.reason);
      rounds=selected.rounds.map(round=>{const prescription=v2FootworkPrescription(settings,dc,round.roundIndex);return {...round,...(prescription?{footworkPrescription:prescription}:{})};});
      previousPrimaryIds.push(selected.primaryCombinationId);for(const round of rounds)usage[round.combinationId]=(usage[round.combinationId]||0)+1;
      if(dc.defenseEligible) {
        const selectedDefense=selectDefenseRule(defenseCounter++,{generationPolicyVersion:2,curriculumStage:dc.curriculum.stage});
        if(!selectedDefense.valid)throw new Error(selectedDefense.reason);
        defense={...selectedDefense,roundIndex:dc.budget.boxingBudget.plannedWorkRoundCount>=2?1:0};
      }
    }
    if(dc.role!=='boxing_only_day') {
      const eligible=dc.budget.strengthBudget.eligibleMovementCounts;
      const caps=[...new Set(eligible)].sort((a,b)=>b-a).filter(c=>c<=dc.caps.strengthMovementCap);
      for(const cap of caps) {
        const selection=selectStrengthTemplate({eligibleMovementCounts:eligible,availableEquipment:settings.availableEquipment,balancedMovementCap:cap,previousTemplateIds,generationSeed:input.generationSeed,trainingOrdinal:dc.ordinal,eligibleTemplateIds:eligibleV2StrengthTemplateIds(strengthCoverage,dc.ordinal,previousTemplateIds)});
        if(!selection.valid)continue;
        const fit=fitStrengthPrescription({template:selection.template,tierKey:dc.caps.strengthTierCap,budgets:dc.budget.strengthBudget,generationSeed:input.generationSeed,trainingOrdinal:dc.ordinal});
        if(fit.valid){strength=fit.prescriptions;previousTemplateIds.push(selection.template.id);break;}
      }
      if(!strength)throw new Error('V2 strength prescription does not fit');
    }
    const id=`PRD_${versionId}_${dc.ordinal}`;
    const footwork=dc.footwork?.scheduled?{footworkMoveId:dc.footwork.footworkMoveId,plannedSeconds:dc.footwork.footworkTechniqueSeconds}:null;
    workoutBlocks.push(...buildDayBlocks({programDayId:id,role:dc.role,budget:dc.budget,boxingRounds:rounds,defenseRound:defense,strengthPrescriptions:strength,footworkTechnique:footwork}));
    programDays.push({id,programVersionId:versionId,trainingOrdinal:dc.ordinal,programWeekIndex:dc.sd.programWeekIndex,programMonthIndex:dc.sd.programMonthIndex,plannedDate:dc.sd.date,weekday:WEEKDAYS[dc.sd.weekdayIndex],sessionRole:dc.role,sessionDurationMinutes:settings.sessionDurationMinutes,phaseId:dc.progression.result.phase.id,phaseIndex:dc.progression.result.phase.index,progressionFocus:dc.focus,defenseEligible:dc.defenseEligible,...v2DaySnapshots(dc),purpose:dc.cycle.objective,sortOrder:dc.ordinal});
  }
  const program={id:programId,status:'review_required',currentVersionId:versionId,programMode:settings.programMode,durationMonths:settings.durationMonths,createdAt:null,updatedAt:null};
  const programVersion={id:versionId,programId,versionNumber:1,status:'review_required',locked:false,generationRequestId:input.generationRequestId,generationSeed:input.generationSeed,settingsSnapshot:settings,engineVersions,generationPolicyVersion:2,programStartDate:start,endDateExclusive:end,totalPlannedTrainingSessions:dates.length,blueprintFingerprint:null,approvedAt:null,activatedAt:null,createdAt:null,updatedAt:null};
  const blueprint={program,programVersion,programDays,workoutBlocks,blueprintFingerprint:null,warnings:[]};
  blueprint.blueprintFingerprint=computeBlueprintFingerprint(blueprint,input.generationSeed);programVersion.blueprintFingerprint=blueprint.blueprintFingerprint;
  const validation=validateFullProgramBlueprint(blueprint);
  if(!validation.valid)return {valid:false,reasons:validation.reasons,warnings:validation.warnings,blueprint:null};
  return {valid:true,reasons:[],warnings:[],blueprint};
 } catch(error) {return {valid:false,reasons:['program_progression_failed'],warnings:[],blueprint:null,detail:error.message};}
}
