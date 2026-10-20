import {PRESCRIPTION_TIER_ENVELOPES} from '@/features/progression/progressionConstants';
import {fitStrengthPrescription} from './strengthPrescriptionFitter';

// A progression tier is a ceiling. A compact session can require a lower
// prescription tier while retaining its fixed time and immutable template.
// Keep the V1 fitter and every already fitting prescription unchanged.
export function fitV2StrengthPrescription(input) {
  const tiers=Object.keys(PRESCRIPTION_TIER_ENVELOPES),cap=tiers.indexOf(input.tierKey);
  for(let index=cap;index>=0;index--) {
    const result=fitStrengthPrescription({...input,tierKey:tiers[index]});
    if(result.valid)return result;
  }
  return {valid:false,reason:'PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT'};
}
