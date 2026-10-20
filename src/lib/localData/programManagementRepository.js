import {LOCAL_DB} from '@/config/architecture';
import {localDb} from './localDb';
import {stableObjectString} from '@/features/programGeneration/blueprintFingerprint';

const S=LOCAL_DB.STORES;
const request=req=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
const changed=()=>new Error('Program veya ilerleme başka bir pencerede değişti. Sayfayı yenileyip tekrar dene.');

export async function commitProgramEdit(source,expectedProgress,blueprint,audit,progressUpdates) {
  return localDb.withTransaction([S.PROGRAMS,S.PROGRAM_VERSIONS,S.PROGRAM_DAYS,S.WORKOUT_BLOCKS,S.PROGRAM_AUDITS,S.WORKOUT_PROGRESS],'readwrite',async stores=>{
    const current=await request(stores[S.PROGRAMS].get(source.id));
    const progress=(await request(stores[S.WORKOUT_PROGRESS].getAll())).filter(row=>row.programId===source.id);
    const revisions=rows=>stableObjectString(rows.map(row=>[row.id,row.revision]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
    if(stableObjectString(current)!==stableObjectString(source)||revisions(progress)!==revisions(expectedProgress))throw changed();
    if(await request(stores[S.PROGRAM_VERSIONS].get(blueprint.programVersion.id)))throw changed();
    await request(stores[S.PROGRAMS].put(blueprint.program));
    await request(stores[S.PROGRAM_VERSIONS].put(blueprint.programVersion));
    for(const row of blueprint.programDays)await request(stores[S.PROGRAM_DAYS].put(row));
    for(const row of blueprint.workoutBlocks)await request(stores[S.WORKOUT_BLOCKS].put(row));
    await request(stores[S.PROGRAM_AUDITS].put(audit));
    for(const row of progressUpdates)await request(stores[S.WORKOUT_PROGRESS].put(row));
    return blueprint.program;
  });
}

export async function updateManagedProgram(source,patch) {
  return localDb.withTransaction([S.PROGRAMS,S.WORKOUT_PROGRESS],'readwrite',async stores=>{
    const current=await request(stores[S.PROGRAMS].get(source.id));
    if(stableObjectString(current)!==stableObjectString(source))throw changed();
    const next={...current,...patch};
    if(next.status!=='active'||next.deletedAt) {
      for(const row of await request(stores[S.WORKOUT_PROGRESS].getAll()))if(row.programId===source.id&&row.status==='in_progress')await request(stores[S.WORKOUT_PROGRESS].put({...row,status:'paused',lastTickMs:null,revision:row.revision+1}));
    }
    await request(stores[S.PROGRAMS].put(next));return next;
  });
}

export async function setHistoryDeleted(historyId,deletedAt) {
  return localDb.withTransaction([S.WORKOUT_HISTORY],'readwrite',async stores=>{
    const history=await request(stores[S.WORKOUT_HISTORY].get(historyId));
    if(!history)throw new Error('Antrenman kaydı bulunamadı.');
    await request(stores[S.WORKOUT_HISTORY].put({...history,deletedAt}));
  });
}
