import {localDb} from './localDb';
import {LOCAL_DB} from '@/config/architecture';
const S=LOCAL_DB.STORES;
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
export async function commitWorkoutProgress(progress,expectedRevision,history=null) {
  return localDb.withTransaction([S.WORKOUT_PROGRESS,S.WORKOUT_HISTORY],'readwrite',async stores=>{
    const existing=await request(stores[S.WORKOUT_PROGRESS].get(progress.id));
    if((existing?.revision??0)!==expectedRevision)throw new Error('İlerleme başka bir pencerede değişti. Ekranı yeniden aç.');
    await request(stores[S.WORKOUT_PROGRESS].put(progress));
    if(history)await request(stores[S.WORKOUT_HISTORY].put(history));
    return progress;
  });
}
