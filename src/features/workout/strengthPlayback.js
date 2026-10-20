// Set windows divide the existing work budget. They are pacing windows, not measured reps.
export function strengthPlaybackSegments(block) {
  if(block.type!=='strength_exercise')return [];
  const count=block.setCount;
  if(!Number.isInteger(count)||count<1)return [];
  const base=Math.floor(block.plannedWorkWindowSeconds/count),extra=block.plannedWorkWindowSeconds%count;
  const segments=[];
  for(let i=0;i<count;i++) {
    segments.push({label:`Set ${i+1} / ${count}`,seconds:base+(i<extra?1:0)});
    if(i<count-1)segments.push({label:'Set arası dinlenme',seconds:block.interSetRestSeconds[i]});
  }
  if(block.transitionAfterExerciseSeconds>0)segments.push({label:'Sonraki harekete geçiş',seconds:block.transitionAfterExerciseSeconds});
  if(segments.reduce((sum,segment)=>sum+segment.seconds,0)!==block.plannedSeconds)throw new Error('Kuvvet blok süresi tutarsız.');
  return segments;
}
export function currentStrengthPhase(block,elapsedMs) {
  let end=0;
  for(const segment of strengthPlaybackSegments(block)) {
    end+=segment.seconds*1000;
    if(elapsedMs<end)return {...segment,remainingMs:end-elapsedMs};
  }
  return null;
}
