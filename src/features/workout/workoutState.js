import { WORKOUT_STATUS as S } from '@/config/architecture';
export const TERMINAL_WORKOUT_STATUSES = Object.freeze([S.COMPLETED,S.PARTIAL,S.SKIPPED]);
export const WORKOUT_STATUS_LABELS = Object.freeze({upcoming:'Hazır',in_progress:'Çalışıyor',paused:'Duraklatıldı',partial:'Kısmen yapıldı',skipped:'Atlandı',awaiting_completion_confirmation:'Onay bekliyor',completed:'Tamamlandı'});

export function workoutTotalMs(blocks) {
  if(!Array.isArray(blocks)||!blocks.length||blocks.some(b=>!Number.isInteger(b.plannedSeconds)||b.plannedSeconds<=0))throw new Error('Antrenman blokları geçersiz.');
  return blocks.reduce((sum,b)=>sum+b.plannedSeconds*1000,0);
}
export function createWorkoutProgress(day,version,blocks) {
  return {id:`WPR_${day.id}`,programId:version.programId,programVersionId:version.id,programDayId:day.id,blueprintFingerprint:version.blueprintFingerprint,status:S.UPCOMING,positionMs:0,actualMs:0,totalMs:workoutTotalMs(blocks),skippedBlockIds:[],lastTickMs:null,startedAt:null,endedAt:null,revision:0};
}
export function currentWorkoutBlock(blocks,positionMs) {
  let start=0;
  for(let index=0;index<blocks.length;index++) {
    const end=start+blocks[index].plannedSeconds*1000;
    if(positionMs<end)return {block:blocks[index],index,remainingMs:end-positionMs,startMs:start,endMs:end};
    start=end;
  }
  return {block:null,index:blocks.length,remainingMs:0,startMs:start,endMs:start};
}
// Pure reducer: time is explicit. Generation never reads a device clock.
export function transitionWorkout(progress,event,nowMs,blocks) {
  if(!Number.isFinite(nowMs)||nowMs<0)throw new Error('Geçersiz saat.');
  const total=workoutTotalMs(blocks);
  if(progress.totalMs!==total||!Number.isFinite(progress.positionMs)||progress.positionMs<0||progress.positionMs>total)throw new Error('Kayıtlı ilerleme geçersiz.');
  if(TERMINAL_WORKOUT_STATUSES.some(status=>status===progress.status)) {
    if(event==='confirm')return progress;
    throw new Error('Bu antrenman sonuçlandırıldı.');
  }
  if(event==='restore')return progress.status===S.IN_PROGRESS?{...progress,status:S.PAUSED,lastTickMs:null,revision:progress.revision+1}:progress;
  if(event==='pause'&&progress.status===S.PAUSED)return progress;
  const p={...progress,skippedBlockIds:[...progress.skippedBlockIds]};
  if(p.status===S.IN_PROGRESS) {
    const delta=Math.min(Math.max(0,nowMs-p.lastTickMs),total-p.positionMs);
    p.positionMs+=delta;p.actualMs+=delta;p.lastTickMs=nowMs;
    if(p.positionMs===total){p.status=S.AWAITING_COMPLETION_CONFIRMATION;p.lastTickMs=null;}
  }
  switch(event) {
    case 'start':
      if(p.status!==S.UPCOMING)throw new Error('Antrenman zaten başlatıldı.');
      p.status=S.IN_PROGRESS;p.startedAt=new Date(nowMs).toISOString();p.lastTickMs=nowMs;break;
    case 'resume':
      if(p.status!==S.PAUSED)throw new Error('Yalnız duraklatılmış antrenman devam eder.');
      p.status=S.IN_PROGRESS;p.lastTickMs=nowMs;break;
    case 'pause':
      if(p.status===S.IN_PROGRESS){p.status=S.PAUSED;p.lastTickMs=null;}
      else if(p.status!==S.AWAITING_COMPLETION_CONFIRMATION)throw new Error('Antrenman çalışmıyor.');break;
    case 'skip_block': {
      if(![S.IN_PROGRESS,S.PAUSED].some(status=>status===p.status))throw new Error('Atlanacak aktif blok yok.');
      const current=currentWorkoutBlock(blocks,p.positionMs);p.skippedBlockIds.push(current.block.id);p.positionMs=current.endMs;
      if(p.positionMs===total){p.status=S.AWAITING_COMPLETION_CONFIRMATION;p.lastTickMs=null;}break;
    }
    case 'confirm':
      if(p.status!==S.AWAITING_COMPLETION_CONFIRMATION)throw new Error('Antrenman henüz tamamlanmadı.');
      p.status=p.skippedBlockIds.length?S.PARTIAL:S.COMPLETED;p.endedAt=new Date(nowMs).toISOString();break;
    case 'finish_partial':
      if(!p.startedAt||p.actualMs<=0)throw new Error('Yapılan süre yok; antrenmanı atlayabilirsin.');
      p.status=S.PARTIAL;p.lastTickMs=null;p.endedAt=new Date(nowMs).toISOString();break;
    case 'skip_workout':
      p.status=p.actualMs>0?S.PARTIAL:S.SKIPPED;p.lastTickMs=null;p.endedAt=new Date(nowMs).toISOString();break;
    case 'tick':if(progress.status!==S.IN_PROGRESS)return progress;break;
    default:throw new Error('Bilinmeyen antrenman işlemi.');
  }
  return {...p,revision:progress.revision+1};
}
export function workoutHistoryRecord(progress,day) {
  if(!TERMINAL_WORKOUT_STATUSES.some(status=>status===progress.status))return null;
  return {id:`WH_${progress.programDayId}`,programId:progress.programId,programVersionId:progress.programVersionId,programDayId:progress.programDayId,status:progress.status,plannedDate:day.plannedDate,trainingOrdinal:day.trainingOrdinal,plannedSeconds:progress.totalMs/1000,actualSeconds:Math.floor(progress.actualMs/1000),startedAt:progress.startedAt,completedAt:progress.endedAt,skippedBlockIds:[...progress.skippedBlockIds]};
}
