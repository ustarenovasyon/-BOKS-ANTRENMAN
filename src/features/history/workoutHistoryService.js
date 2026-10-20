import {workoutHistoryRepository,feedbackRepository} from '@/lib/localData/repositories';
import {nowIso} from '@/lib/localData/time';
export async function loadWorkoutHistory() {
  return {rows:(await workoutHistoryRepository.list()).sort((a,b)=>(b.completedAt||'').localeCompare(a.completedAt||'')),feedback:await feedbackRepository.list()};
}
export async function saveWorkoutFeedback(historyId,effort,note) {
  const history=await workoutHistoryRepository.getById(historyId);
  if(!history)throw new Error('Antrenman sonucu bulunamadı.');
  if(effort!==null&&(!Number.isInteger(effort)||effort<1||effort>10))throw new Error('Zorlanma 1–10 arasında olmalı.');
  if(typeof note!=='string'||note.length>1000)throw new Error('Not en fazla 1000 karakter olabilir.');
  return feedbackRepository.save({id:`FB_${history.programDayId}`,programId:history.programId,programDayId:history.programDayId,effort,note:note.trim(),source:'self_report',createdAt:nowIso()});
}
