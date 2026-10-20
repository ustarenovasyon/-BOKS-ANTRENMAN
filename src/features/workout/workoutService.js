import {programRepository,programVersionRepository,programDayRepository,workoutProgressRepository} from '@/lib/localData/repositories';
import {commitWorkoutProgress} from '@/lib/localData/workoutRepository';
import {loadProgramPreview} from '@/features/programPreview/programPreviewService';
import {recordedProgress,isTerminal} from '@/features/programManagement/programManagementService';
import {createWorkoutProgress,transitionWorkout,workoutHistoryRecord,TERMINAL_WORKOUT_STATUSES} from './workoutState';
export async function loadTrainingOverview() {
  const programs=(await programRepository.list()).sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
  const progress=await workoutProgressRepository.list();const plans=[];const byDay=new Map(progress.map(p=>[p.programDayId,p]));
  for(const program of programs.filter(p=>p.status==='active'&&!p.deletedAt)) {
    const version=await programVersionRepository.getById(program.currentVersionId);
    if(!version||!version.locked||version.status!=='active')continue;
    const days=(await programDayRepository.getAllByIndex('by_programVersionId',version.id)).sort((a,b)=>a.trainingOrdinal-b.trainingOrdinal);
    plans.push({program,version,days,done:days.filter(day=>isTerminal(recordedProgress(day,version,byDay))).length});
  }
  return {programs:programs.filter(p=>!p.deletedAt),plans,progress};
}
export async function loadWorkout(dayId,nowMs,programId=null) {
  let day=dayId?await programDayRepository.getById(dayId):null;
  if(!day&&!dayId) {
    const overview=await loadTrainingOverview();
    const byDay=new Map(overview.progress.map(p=>[p.programDayId,p]));
    for(const plan of overview.plans.filter(p=>!programId||p.program.id===programId)){day=plan.days.find(d=>!isTerminal(recordedProgress(d,plan.version,byDay)));if(day)break;}
  }
  if(!day)return null;
  let version=await programVersionRepository.getById(day.programVersionId);
  const program=version?await programRepository.getById(version.programId):null;
  const carried=version?.carriedResults?.[day.id];
  if(carried){
    const oldDay=await programDayRepository.getById(carried),oldVersion=oldDay?await programVersionRepository.getById(oldDay.programVersionId):null;
    const oldProgress=await workoutProgressRepository.getById(`WPR_${carried}`);
    if(!oldDay||oldVersion?.programId!==program?.id||day.plannedDate!==oldDay.plannedDate||!isTerminal(oldProgress))throw new Error('Önceki antrenman sonucu doğrulanamadı.');
    day=oldDay;version=oldVersion;
  }
  if(!program||!version)throw new Error('Antrenman programı bulunamadı.');
  const existing=await workoutProgressRepository.getById(`WPR_${day.id}`);
  const historical=isTerminal(existing);
  if(!historical&&(!program||program.deletedAt||program.status!=='active'||!version?.locked||version.status!=='active'||program.currentVersionId!==version.id))throw new Error('Önce Programlarım ekranında programı kontrol edip onayla.');
  const preview=await loadProgramPreview(program.id,version.id);
  if(!preview.valid)throw new Error('Program bütünlüğü doğrulanamadı.');
  const blocks=preview.blocksByDay.get(day.id);
  let progress=existing||createWorkoutProgress(day,version,blocks);
  if(progress.blueprintFingerprint!==version.blueprintFingerprint)throw new Error('Antrenmanın program sürümü değişmiş.');
  if(progress.status==='in_progress')progress=await commitWorkoutProgress(transitionWorkout(progress,'restore',nowMs,blocks),progress.revision);
  return {day,program,version,blocks,progress};
}
export async function applyWorkoutEvent(context,event,nowMs) {
  const next=transitionWorkout(context.progress,event,nowMs,context.blocks);
  if(next===context.progress)return next;
  return commitWorkoutProgress(next,context.progress.revision,workoutHistoryRecord(next,context.day));
}
