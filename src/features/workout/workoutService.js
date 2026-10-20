import {programRepository,programVersionRepository,programDayRepository,workoutProgressRepository} from '@/lib/localData/repositories';
import {commitWorkoutProgress} from '@/lib/localData/workoutRepository';
import {loadProgramPreview} from '@/features/programPreview/programPreviewService';
import {createWorkoutProgress,transitionWorkout,workoutHistoryRecord,TERMINAL_WORKOUT_STATUSES} from './workoutState';
export async function loadTrainingOverview() {
  const programs=(await programRepository.list()).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const progress=await workoutProgressRepository.list();const plans=[];
  for(const program of programs.filter(p=>p.status==='active')) {
    const version=await programVersionRepository.getById(program.currentVersionId);
    if(!version||!version.locked||version.status!=='active')continue;
    const days=(await programDayRepository.getAllByIndex('by_programVersionId',version.id)).sort((a,b)=>a.trainingOrdinal-b.trainingOrdinal);
    plans.push({program,version,days,done:days.filter(day=>progress.some(p=>p.programDayId===day.id&&TERMINAL_WORKOUT_STATUSES.some(status=>status===p.status))).length});
  }
  return {programs,plans,progress};
}
export async function loadWorkout(dayId,nowMs) {
  let day=dayId?await programDayRepository.getById(dayId):null;
  if(!day&&!dayId) {
    const overview=await loadTrainingOverview();
    for(const plan of overview.plans){day=plan.days.find(d=>!overview.progress.some(p=>p.programDayId===d.id&&TERMINAL_WORKOUT_STATUSES.some(status=>status===p.status)));if(day)break;}
  }
  if(!day)return null;
  const version=await programVersionRepository.getById(day.programVersionId);
  const program=version?await programRepository.getById(version.programId):null;
  if(!program||program.status!=='active'||!version?.locked||version.status!=='active'||program.currentVersionId!==version.id)throw new Error('Önce Programlarım ekranında programı kontrol edip onayla.');
  const preview=await loadProgramPreview(program.id);
  if(!preview.valid)throw new Error('Program bütünlüğü doğrulanamadı.');
  const blocks=preview.blocksByDay.get(day.id);
  let progress=await workoutProgressRepository.getById(`WPR_${day.id}`)||createWorkoutProgress(day,version,blocks);
  if(progress.blueprintFingerprint!==version.blueprintFingerprint)throw new Error('Antrenmanın program sürümü değişmiş.');
  if(progress.status==='in_progress')progress=await commitWorkoutProgress(transitionWorkout(progress,'restore',nowMs,blocks),progress.revision);
  return {day,program,version,blocks,progress};
}
export async function applyWorkoutEvent(context,event,nowMs) {
  const next=transitionWorkout(context.progress,event,nowMs,context.blocks);
  if(next===context.progress)return next;
  return commitWorkoutProgress(next,context.progress.revision,workoutHistoryRecord(next,context.day));
}
