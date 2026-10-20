import {STRENGTH_TEMPLATES} from '@/features/strength/templates/strengthTemplates';
import {strengthCandidatePool} from './strengthTemplateSelector';

const byId=new Map(STRENGTH_TEMPLATES.map(template=>[template.id,template]));

export function buildV2StrengthCoveragePlan(contexts,settings) {
  return contexts.filter(dc=>dc.role!=='boxing_only_day').map(dc=>{
    const pool=strengthCandidatePool(dc.budget.strengthBudget.eligibleMovementCounts,settings.availableEquipment,dc.caps.strengthMovementCap);
    return {ordinal:dc.ordinal,pool,possible:new Set(pool.flatMap(template=>template.movementPatterns))};
  });
}

// Before a constrained recovery run, preserve patterns that later templates
// cannot supply. Current and next three rolling windows share the same rule
// as audit. A V1/default selection remains unchanged when already feasible.
export function eligibleV2StrengthTemplateIds(plan,ordinal,previousTemplateIds) {
  const current=plan.findIndex(item=>item.ordinal===ordinal),required=new Set();
  for(let end=current;end<=Math.min(current+3,plan.length-1);end++) {
    if(end<3)continue;
    const possible=new Set(),coveredElsewhere=new Set();
    for(let index=end-3;index<=end;index++) {
      for(const pattern of plan[index].possible)possible.add(pattern);
      if(index<current)for(const pattern of byId.get(previousTemplateIds[index])?.movementPatterns??[])coveredElsewhere.add(pattern);
      if(index>current)for(const pattern of plan[index].possible)coveredElsewhere.add(pattern);
    }
    for(const pattern of possible)if(!coveredElsewhere.has(pattern))required.add(pattern);
  }
  return plan[current].pool.filter(template=>[...required].every(pattern=>template.movementPatterns.includes(pattern))).map(template=>template.id);
}
