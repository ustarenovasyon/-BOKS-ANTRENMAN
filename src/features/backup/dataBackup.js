import {LOCAL_DB} from '@/config/architecture';
import {readLocalSnapshot,replaceLocalSnapshot,getRecoveryBackup,checkpointLocalBackup} from '@/lib/localData/backupRepository';
import {auditProgramSnapshot} from '@/features/programAudit/programAuditEngine';
import {resolveGenerationPolicyVersion} from '@/features/programGeneration/generationPolicyResolver';
import {nowIso} from '@/lib/localData/time';
import {computeBlueprintFingerprint} from '@/features/programGeneration/blueprintFingerprint';
const FORMAT='box-antrenman-backup',VERSION=1;
const NAMES=Object.values(LOCAL_DB.STORES),S=LOCAL_DB.STORES;
const signedBody=backup=>JSON.stringify({format:backup.format,version:backup.version,dbVersion:backup.dbVersion,stores:backup.stores});
async function digest(backup) {
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(signedBody(backup)));
  return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export function validateBackupStores(stores) {
  if(!stores||typeof stores!=='object'||Array.isArray(stores)||Object.keys(stores).length!==NAMES.length)throw new Error('Yedek veri tabloları eksik veya bilinmiyor.');
  const ids={};
  for(const name of NAMES) {
    const records=stores[name];
    if(!Array.isArray(records))throw new Error(`Yedek tablosu eksik: ${name}`);
    ids[name]=new Map();
    for(const row of records) {
      if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id||ids[name].has(row.id))throw new Error('Yedekte geçersiz veya tekrarlanan kayıt var.');
      if(name===S.APP_META&&row.id==='LOCAL_RECOVERY_BACKUP')throw new Error('Yedekte iç içe geri dönüş kaydı var.');
      ids[name].set(row.id,row);
    }
  }
  for(const program of stores[S.PROGRAMS]) {
    const version=ids[S.PROGRAM_VERSIONS].get(program.currentVersionId);
    if(!version||version.programId!==program.id)throw new Error('Program sürüm bağlantısı bozuk.');
  }
  for(const version of stores[S.PROGRAM_VERSIONS]) {
    if(!ids[S.PROGRAMS].has(version.programId))throw new Error('Sahipsiz program sürümü.');
    const policy=resolveGenerationPolicyVersion(version);
    if(!policy.resolved||!policy.active)throw new Error('Yedekte desteklenmeyen üretim sürümü var.');
    const days=stores[S.PROGRAM_DAYS].filter(d=>d.programVersionId===version.id),dayIds=new Set(days.map(d=>d.id));
    const snapshot={program:{...ids[S.PROGRAMS].get(version.programId),currentVersionId:version.id,status:version.status,programMode:version.settingsSnapshot?.programMode,durationMonths:version.settingsSnapshot?.durationMonths},programVersion:version,programDays:days,workoutBlocks:stores[S.WORKOUT_BLOCKS].filter(b=>dayIds.has(b.programDayId))};
    if(computeBlueprintFingerprint(snapshot,version.generationSeed)!==version.blueprintFingerprint)throw new Error('Yedekteki program bütünlüğü bozuk.');
    const audit=auditProgramSnapshot({...snapshot,programVersion:{...version,locked:false}});
    if(audit.findings.some(f=>f.code==='audit_engine_version_incompatible'))throw new Error('Yedekte desteklenmeyen kütüphane sürümü var.');
    // Failed drafts may be backed up without becoming approved/active.
    if(!['review_required','review_failed'].includes(version.status)&&audit.outcome!=='pass')throw new Error('Yedekteki onaylı program denetimden geçemedi.');
    if(version.previousVersionId) {
      const previous=ids[S.PROGRAM_VERSIONS].get(version.previousVersionId);
      if(!previous||previous.programId!==version.programId||previous.versionNumber>=version.versionNumber)throw new Error('Düzenleme sürüm bağlantısı bozuk.');
    }
    if(version.carriedResults!==undefined) {
      if(!version.carriedResults||typeof version.carriedResults!=='object'||Array.isArray(version.carriedResults))throw new Error('Önceki sonuç bağlantıları geçersiz.');
      const targets=new Set();
      for(const [dayId,oldId] of Object.entries(version.carriedResults)) {
        const day=ids[S.PROGRAM_DAYS].get(dayId),old=ids[S.PROGRAM_DAYS].get(oldId),oldVersion=old&&ids[S.PROGRAM_VERSIONS].get(old.programVersionId),progress=ids[S.WORKOUT_PROGRESS].get(`WPR_${oldId}`);
        if(!dayIds.has(dayId)||!old||oldVersion?.programId!==version.programId||old.programVersionId===version.id||day.plannedDate!==old.plannedDate||!progress||!['completed','partial','skipped'].includes(progress.status)||!ids[S.WORKOUT_HISTORY].has(`WH_${oldId}`)||targets.has(oldId))throw new Error('Önceki antrenman sonucu bağlantısı bozuk.');
        targets.add(oldId);
      }
    }
  }
  for(const day of stores[S.PROGRAM_DAYS])if(!ids[S.PROGRAM_VERSIONS].has(day.programVersionId))throw new Error('Sahipsiz antrenman günü.');
  for(const block of stores[S.WORKOUT_BLOCKS])if(!ids[S.PROGRAM_DAYS].has(block.programDayId))throw new Error('Sahipsiz antrenman bloğu.');
  for(const name of [S.WORKOUT_PROGRESS,S.WORKOUT_HISTORY,S.USER_FEEDBACK])for(const row of stores[name]) {
    const day=ids[S.PROGRAM_DAYS].get(row.programDayId);
    if(!day||!ids[S.PROGRAMS].has(row.programId))throw new Error('Geçmiş/ilerleme bağlantısı bozuk.');
    if(row.programVersionId&&row.programVersionId!==day.programVersionId)throw new Error('İlerleme sürümü uyuşmuyor.');
  }
  for(const row of stores[S.WORKOUT_PROGRESS]) {
    const version=ids[S.PROGRAM_VERSIONS].get(row.programVersionId);
    const total=stores[S.WORKOUT_BLOCKS].filter(b=>b.programDayId===row.programDayId).reduce((sum,b)=>sum+b.plannedSeconds*1000,0);
    if(!['upcoming','in_progress','paused','partial','skipped','awaiting_completion_confirmation','completed'].includes(row.status)||![row.actualMs,row.positionMs,row.totalMs].every(Number.isFinite)||!Number.isInteger(row.revision)||row.revision<0||row.actualMs<0||row.positionMs<0||row.positionMs>row.totalMs||row.actualMs>row.positionMs||row.totalMs!==total||!Array.isArray(row.skippedBlockIds)||row.blueprintFingerprint!==version?.blueprintFingerprint)throw new Error('İlerleme kaydı geçersiz.');
  }
  for(const row of stores[S.WORKOUT_HISTORY]) {
    const progress=ids[S.WORKOUT_PROGRESS].get(`WPR_${row.programDayId}`);
    if(!progress||!['completed','partial','skipped'].includes(row.status)||progress.status!==row.status||row.id!==`WH_${row.programDayId}`||row.actualSeconds!==Math.floor(progress.actualMs/1000)||row.plannedSeconds!==progress.totalMs/1000||(row.status==='completed'&&(progress.positionMs!==progress.totalMs||progress.skippedBlockIds.length)))throw new Error('Geçmiş sonucu ilerlemeyle uyuşmuyor.');
  }
  return true;
}
export async function createDataBackup() {
  const backup={format:FORMAT,version:VERSION,dbVersion:LOCAL_DB.VERSION,exportedAt:nowIso(),stores:await readLocalSnapshot()};
  backup['checksum']=await digest(backup);return backup;
}
export async function parseDataBackup(text) {
  let backup;try{backup=JSON.parse(text);}catch{throw new Error('JSON yedek dosyası okunamadı.');}
  if(backup?.format!==FORMAT||backup?.version!==VERSION||backup?.dbVersion!==LOCAL_DB.VERSION)throw new Error('Yedek biçimi veya sürümü desteklenmiyor.');
  if(typeof backup.checksum!=='string'||await digest(backup)!==backup.checksum)throw new Error('Yedek bütünlüğü doğrulanamadı.');
  validateBackupStores(backup.stores);return backup;
}
export async function restoreDataBackup(backup) {
  // Revalidate at commit boundary even if a caller bypasses the file picker.
  const verified=await parseDataBackup(JSON.stringify(backup));
  await replaceLocalSnapshot(verified.stores,nowIso());
}
export async function restoreRecoveryBackup() {
  const previous=await getRecoveryBackup();if(!previous)throw new Error('Geri dönüş yedeği yok.');
  validateBackupStores(previous.stores);await replaceLocalSnapshot(previous.stores,nowIso());
}
export async function resetTrainingData() {
  await replaceLocalSnapshot(Object.fromEntries(NAMES.map(name=>[name,[]])),nowIso());
}
export async function ensureDailyBackup() {
  const previous=await getRecoveryBackup();
  const now=nowIso();
  if(!previous||new Date(now).getTime()-new Date(previous.createdAt).getTime()>=86400000)await checkpointLocalBackup(now);
}
export {getRecoveryBackup};
