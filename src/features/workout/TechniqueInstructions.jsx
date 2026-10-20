import {buildWorkoutBlockInstructionSequence} from '@/features/boxing/instructions/boxingTechniqueInstructions';
export default function TechniqueInstructions({block}) {
  const steps=buildWorkoutBlockInstructionSequence(block);
  if(!steps.length)return null;
  return <details className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-medium">Teknik ipuçları</summary>
    <p className="mt-2 text-xs text-muted-foreground">Uygulama hareketini ölçmez; bunlar çalışma talimatlarıdır.</p>
    <div className="mt-3 space-y-3">{steps.map((step,index)=><div key={`${index}-${step.instruction.movementId}`}><p className="font-medium">{step.instruction.canonicalName}</p><p>{step.instruction.techniqueCue}</p><p className="text-muted-foreground">{step.instruction.guardReminder} {step.instruction.balanceReminder}</p></div>)}</div>
  </details>;
}
