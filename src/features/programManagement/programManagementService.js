import {loadProgramSnapshot} from '@/features/programAudit/programAuditLoader';
import {loadProgramPreview} from '@/features/programPreview/programPreviewService';
import {generateProgramBlueprint} from '@/features/programGeneration/programGenerationEngine';
import {computeBlueprintFingerprint,stableObjectString} from '@/features/programGeneration/blueprintFingerprint';
import {auditProgramSnapshot} from '@/features/programAudit/programAuditEngine';
import {computeAuditId} from '@/features/programAudit/programAuditService';
import {LOCAL_PROGRAM_AUDIT_ENGINE_VERSION} from '@/features/programAudit/programAuditConstants';
import {PROGRAM_APPROVAL_ENGINE_VERSION} from '@/config/architecture';
import {resolveGenerationPolicyVersion} from '@/features/programGeneration/generationPolicyResolver';
import {programRepository,programVersionRepository,workoutProgressRepository} from '@/lib/localData/repositories';
import {commitProgramEdit,updateManagedProgram} from '@/lib/localData/programManagementRepository';
import {nowIso} from '@/lib/localData/time';
import {TERMINAL_WORKOUT_STATUSES} from '@/features/workout/workoutState';
import {LABELS} from '@/features/programCreate/programPreferences';

export const isTerminal=row=>!!row&&TERMINAL_WORKOUT_STATUSES.includes(row.status);
export const programTitle=program=>program.name||`${LABELS.programMode[program.programMode]||'Program'} · ${program.durationMonths} ay`;
export function recordedProgress(day,version,byDay) {
  return byDay.get(day.id)||byDay.get(version.carriedResults?.[day.id])||null;
}
function cleanName(name) {
  if(typeof name!=='string'||name.trim().length>80)throw new Error('Program adı en fazla 80 karakter olabilir.');
  return name.trim();
}
export async function loadProgramForEditing(id) {
  const source=await loadProgramSnapshot(id);
  if(!source.found||!source.programVersion||source.program.deletedAt)throw new Error('Düzenlenecek program bulunamadı.');
  if(!(await loadProgramPreview(id)).valid)throw new Error('Program bütünlüğü doğrulanamadı; düzenleme uygulanmadı.');
  return source;
}
const content=blocks=>stableObjectString([...blocks].sort((a,b)=>a.orderIndex-b.orderIndex).map(({id,programDayId,...block})=>block));

export async function editProgram(source,settings,name,requestId) {
  name=cleanName(name);
  if(!requestId)throw new Error('Düzenleme kimliği eksik.');
  const previous=source.programVersion,policy=resolveGenerationPolicyVersion(previous);
  const unchanged=Object.keys(previous.settingsSnapshot).every(key=>stableObjectString(previous.settingsSnapshot[key])===stableObjectString(settings[key]));
  if(unchanged)return updateManagedProgram(source.program,{name,updatedAt:nowIso()});
  const progress=(await workoutProgressRepository.list()).filter(row=>row.programId===source.program.id);
  const generated=generateProgramBlueprint({...settings,generationPolicyVersion:policy.version,generationLocalDate:previous.programStartDate,generationSeed:previous.generationSeed,generationRequestId:requestId});
  if(!generated.valid)throw new Error('Yeni tercihlerle geçerli program oluşturulamadı. Süre, gün ve ekipman seçeneklerini kontrol et.');
  const blueprint=generated.blueprint,version=blueprint.programVersion,now=nowIso();
  blueprint.program.id=source.program.id;version.programId=source.program.id;
  version.versionNumber=(previous.versionNumber||1)+1;version.previousVersionId=previous.id;version.carriedResults={};
  const byDay=new Map(progress.map(row=>[row.programDayId,row]));
  const sourceByDate=new Map(source.programDays.map(day=>[day.plannedDate,day]));
  const newByDate=new Map(blueprint.programDays.map(day=>[day.plannedDate,day]));
  for(const day of blueprint.programDays) {
    const old=sourceByDate.get(day.plannedDate),record=old?recordedProgress(old,previous,byDay):null;
    if(isTerminal(record))version.carriedResults[day.id]=record.programDayId;
  }
  version.blueprintFingerprint=computeBlueprintFingerprint(blueprint,version.generationSeed);blueprint.blueprintFingerprint=version.blueprintFingerprint;
  const progressUpdates=[];
  for(const row of progress.filter(p=>p.programVersionId===previous.id&&!isTerminal(p))) {
    const oldDay=source.programDays.find(day=>day.id===row.programDayId),newDay=newByDate.get(oldDay?.plannedDate);
    if(!row.startedAt&&!row.positionMs)continue;
    const oldBlocks=source.workoutBlocks.filter(block=>block.programDayId===row.programDayId),newBlocks=blueprint.workoutBlocks.filter(block=>block.programDayId===newDay?.id).sort((a,b)=>a.orderIndex-b.orderIndex);
    if(!newDay||content(oldBlocks)!==content(newBlocks))throw new Error('Yarım kalan antrenmanın yapısı değişiyor. Önce o antrenmanı sonuçlandır veya değişiklikleri yeni program olarak oluştur. Duruş değişikliği ilerlemeyi koruyarak uygulanabilir.');
    const paused={...row,status:row.status==='in_progress'?'paused':row.status,lastTickMs:null,revision:row.revision+1};
    const blockIds=new Map(oldBlocks.map(block=>[block.id,newBlocks.find(next=>next.orderIndex===block.orderIndex).id]));
    progressUpdates.push(paused,{...paused,id:`WPR_${newDay.id}`,programVersionId:version.id,programDayId:newDay.id,blueprintFingerprint:version.blueprintFingerprint,skippedBlockIds:row.skippedBlockIds.map(id=>blockIds.get(id))});
  }
  const result=auditProgramSnapshot(blueprint);
  if(!result.success||result.outcome!=='pass')throw new Error('Düzenlenen program denetimden geçmedi; mevcut program değiştirilmedi.');
  const auditId=computeAuditId(version);
  const audit={id:auditId,programId:source.program.id,programVersionId:version.id,auditEngineVersion:LOCAL_PROGRAM_AUDIT_ENGINE_VERSION,blueprintFingerprint:version.blueprintFingerprint,...result,engineVersionsSnapshot:version.engineVersions,createdAt:now,completedAt:now};
  const approved=previous.locked===true;
  Object.assign(version,{status:approved?'active':'ready_for_approval',locked:approved,createdAt:now,updatedAt:now});
  if(approved)Object.assign(version,{approvedAt:now,activatedAt:now,approvedAuditId:auditId,approvedBlueprintFingerprint:version.blueprintFingerprint,approvalEngineVersion:PROGRAM_APPROVAL_ENGINE_VERSION});
  const status=source.program.status==='archived'?'archived':approved?source.program.status:'ready_for_approval';
  blueprint.program={...source.program,name,currentVersionId:version.id,programMode:settings.programMode,durationMonths:settings.durationMonths,status,updatedAt:now,...(status==='archived'&&!approved?{beforeArchiveStatus:'ready_for_approval'}:{}),...(approved?{approvedAuditId:auditId,approvedBlueprintFingerprint:version.blueprintFingerprint}:{})};
  return commitProgramEdit(source.program,progress,blueprint,audit,progressUpdates);
}

export async function manageProgram(program,action) {
  const now=nowIso();
  if(action==='trash'&&!program.deletedAt)return updateManagedProgram(program,{status:'archived',beforeTrashStatus:program.status,deletedAt:now,updatedAt:now});
  if(action==='restore'&&program.deletedAt)return updateManagedProgram(program,{status:program.beforeTrashStatus||'paused',deletedAt:null,updatedAt:now});
  if(program.deletedAt)throw new Error('Önce programı çöp kutusundan geri al.');
  if(action==='pause'&&program.status==='active')return updateManagedProgram(program,{status:'paused',updatedAt:now});
  if(action==='archive'&&program.status!=='archived')return updateManagedProgram(program,{status:'archived',beforeArchiveStatus:program.status,updatedAt:now});
  if(action==='unarchive'&&program.status==='archived')return updateManagedProgram(program,{status:program.beforeArchiveStatus||'paused',updatedAt:now});
  if(action==='resume'&&['paused','completed'].includes(program.status)) {
    const version=await programVersionRepository.getById(program.currentVersionId);
    if(!version?.locked||version.status!=='active'||!(await loadProgramPreview(program.id)).valid)throw new Error('Programın onayı veya bütünlüğü doğrulanamadı.');
    return updateManagedProgram(program,{status:'active',updatedAt:now});
  }
  throw new Error('Programın durumu değişti; sayfayı yenile.');
}
