import {test,expect} from '@playwright/test';
test('24-month V2 UI: create, preview, audit, approve and run footwork; unknown versions fail closed',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/program-create');await page.getByRole('button',{name:'Sadece Boks',exact:true}).click();
 for(const value of ['1 Ay','3 Ay','6 Ay','9 Ay','12 Ay','15 Ay','18 Ay','24 Ay'])await expect(page.getByRole('button',{name:value,exact:true})).toBeVisible();
 await page.getByRole('button',{name:'24 Ay',exact:true}).click();await page.getByRole('button',{name:'1',exact:true}).click();await page.getByRole('button',{name:'Pazartesi',exact:true}).click();await page.getByRole('button',{name:'Başlangıç',exact:true}).click();await page.getByRole('button',{name:'Sol Gard (Orthodox)',exact:true}).click();
 await page.getByRole('button',{name:'Program Oluştur',exact:true}).click();await expect(page).toHaveURL(/program-preview\//);
 await page.getByRole('button',{name:'Programı Gözden Geçir',exact:true}).click();await page.getByRole('button',{name:'Onayla ve Programı Başlat',exact:true}).click();await page.getByRole('button',{name:'Onayla ve Başlat',exact:true}).click();await expect(page.getByText('Aktif',{exact:true})).toBeVisible();
 const checks=await page.evaluate(async()=>{
  const repos=await import('/src/lib/localData/repositories/index.js'),{loadProgramPreview}=await import('/src/features/programPreview/programPreviewService.js'),{loadProgramSnapshot}=await import('/src/features/programAudit/programAuditLoader.js'),{computeBlueprintFingerprint}=await import('/src/features/programGeneration/blueprintFingerprint.js');
  const programs=await repos.programRepository.list(),program=programs[0],version=await repos.programVersionRepository.getById(program.currentVersionId),snapshot=await loadProgramSnapshot(program.id);
  const months=new Set(snapshot.programDays.map(d=>d.programMonthIndex));
  const initial=(await loadProgramPreview(program.id)).valid;
  const bad=structuredClone(version);bad.engineVersions.boxingMoveLibraryVersion=999;snapshot.programVersion=bad;bad.blueprintFingerprint=computeBlueprintFingerprint(snapshot,bad.generationSeed);await repos.programVersionRepository.save(bad);
  const unknownLibrary=(await loadProgramPreview(program.id)).valid;
  await repos.programVersionRepository.save({...version,generationPolicyVersion:null});const unknownPolicy=(await loadProgramPreview(program.id)).valid;await repos.programVersionRepository.save(version);
  const backup=await import('/src/features/backup/dataBackup.js'),exported=await backup.createDataBackup();const roundTrip=await backup.parseDataBackup(JSON.stringify(exported));
  return {initial,unknownLibrary,unknownPolicy,policy:version.generationPolicyVersion,months:months.size,backupPrograms:roundTrip.stores.programs.length};
 });
 expect(checks).toEqual({initial:true,unknownLibrary:false,unknownPolicy:false,policy:2,months:24,backupPrograms:1});
 await page.getByRole('link',{name:'Ana Sayfa',exact:true}).click();await page.getByRole('link',{name:'Antrenmana git',exact:true}).click();await page.clock.install({time:new Date('2026-10-20T10:00:00Z')});
 await page.getByRole('button',{name:'Antrenmanı başlat',exact:true}).click();await expect(page.getByRole('button',{name:'Duraklat',exact:true})).toBeVisible();await page.clock.fastForward(241000);
 await expect(page.getByText('Step In',{exact:true}).first()).toBeVisible();await page.getByText('Teknik ipuçları',{exact:true}).click();await expect(page.getByText('Uygulama hareketini ölçmez; bunlar çalışma talimatlarıdır.')).toBeVisible();
 await page.screenshot({path:'test-results/v2-workout.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);expect(errors).toEqual([]);
});
