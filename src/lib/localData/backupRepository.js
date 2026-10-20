import {LOCAL_DB} from '@/config/architecture';
import {localDb} from './localDb';
const STORES=Object.values(LOCAL_DB.STORES);
export const RECOVERY_BACKUP_ID='LOCAL_RECOVERY_BACKUP';
const req=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
async function capture(stores) {
  const rows=await Promise.all(STORES.map(name=>req(stores[name].getAll())));
  return Object.fromEntries(STORES.map((name,i)=>[name,rows[i].filter(row=>name!==LOCAL_DB.STORES.APP_META||row.id!==RECOVERY_BACKUP_ID)]));
}
export async function readLocalSnapshot() {
  return localDb.withTransaction(STORES,'readonly',capture);
}
export async function getRecoveryBackup() {
  return localDb.get(LOCAL_DB.STORES.APP_META,RECOVERY_BACKUP_ID);
}
export async function checkpointLocalBackup(createdAt) {
  return localDb.withTransaction(STORES,'readwrite',async stores=>{
    const snapshot=await capture(stores);
    const record={id:RECOVERY_BACKUP_ID,createdAt,stores:snapshot};
    await req(stores[LOCAL_DB.STORES.APP_META].put(record));return record;
  });
}
// Capture-before-replace and all writes share one transaction. No half restore.
export async function replaceLocalSnapshot(snapshot,createdAt) {
  return localDb.withTransaction(STORES,'readwrite',async stores=>{
    const previous=await capture(stores);
    for(const name of STORES)await req(stores[name].clear());
    for(const name of STORES)for(const row of snapshot[name])await req(stores[name].put(row));
    await req(stores[LOCAL_DB.STORES.APP_META].put({id:RECOVERY_BACKUP_ID,createdAt,stores:previous}));
    return true;
  });
}
