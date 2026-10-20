import {test,expect} from '@playwright/test';
import {createApprovedProgram} from './helpers';

test('history feedback and backup/reset/restore use real records; corrupt imports preserve data',async({page})=>{
 await page.goto('/');await expect(page.getByText('İlk antrenman programını oluştur.')).toBeVisible();
 const dayId=await createApprovedProgram(page);await page.goto(`/workout?day=${dayId}`);
 await page.getByRole('button',{name:'Antrenmanı sonlandır',exact:true}).click();await page.getByRole('button',{name:'Sonlandır ve kaydet'}).click();await expect(page.getByText('Sonucun kaydedildi.')).toBeVisible();
 await page.goto('/history');await expect(page.getByRole('heading',{name:'Antrenman 1',exact:true})).toBeVisible();
 await page.getByText('Not ve kendi değerlendirmem').click();await page.getByLabel('Hissedilen zorlanma').selectOption('4');await page.getByRole('textbox',{name:'Antrenman notu',exact:true}).fill('Kontrollü tekrar çalıştım.');await page.getByRole('button',{name:'Notu kaydet'}).click();await expect(page.getByText('Kaydedildi.',{exact:true})).toBeVisible();
 const results=await page.evaluate(async()=>{
  const api=await import('/src/features/backup/dataBackup.js'),repos=await import('/src/lib/localData/repositories/index.js');
  const backup=await api.createDataBackup();const bad=structuredClone(backup);bad.stores.programs[0].durationMonths=24;
  let rejected=false;try{await api.restoreDataBackup(bad);}catch{rejected=true;}
  const unchanged=(await repos.programRepository.list())[0].durationMonths===1;
  await api.resetTrainingData();const empty=await repos.programRepository.count();
  await api.restoreRecoveryBackup();const recovered=await repos.workoutHistoryRepository.count();
  await api.restoreDataBackup(backup);
  const after=await api.createDataBackup();
  return {rejected,unchanged,empty,recovered,equal:JSON.stringify(backup.stores)===JSON.stringify(after.stores)};
 });
 expect(results).toEqual({rejected:true,unchanged:true,empty:0,recovered:1,equal:true});
 await page.reload();await page.getByText('Not ve kendi değerlendirmem').click();await expect(page.getByRole('textbox',{name:'Antrenman notu',exact:true})).toHaveValue('Kontrollü tekrar çalıştım.');
 await page.goto('/settings');await page.getByLabel('Tema',{exact:true}).selectOption('dark');await expect(page.locator('html')).toHaveClass(/dark/);
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'JSON yedeğini indir'}).click();expect((await download).suggestedFilename()).toMatch(/^box-antrenman-.*\.json$/);
});

test('IndexedDB v1 migration preserves existing settings and adds v2 indexes',async({page})=>{
 await page.goto('/');await expect(page.getByText('İlk antrenman programını oluştur.')).toBeVisible();
 // A separate named DB verifies the actual browser migration functions without clearing user stores.
 const result=await page.evaluate(async()=>{
  const {migrations}=await import('/src/lib/localData/migrations/index.js');
  const name='box-migration-regression';
  const open=version=>new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=e=>{for(const step of migrations)if(e.oldVersion<step.version&&step.version<=version)step.run(r.result,r.transaction);};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  let db=await open(1);await new Promise((resolve,reject)=>{const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put({id:'sentinel',value:'retained'});tx.oncomplete=resolve;tx.onerror=reject;});db.close();db=await open(2);
  const value=await new Promise(resolve=>{const r=db.transaction('settings').objectStore('settings').get('sentinel');r.onsuccess=()=>resolve(r.result.value);});
  const index=db.transaction('workout_progress').objectStore('workout_progress').indexNames.contains('by_programDayId');db.close();indexedDB.deleteDatabase(name);return {value,index};
 });
 expect(result).toEqual({value:'retained',index:true});
});

test('production build reloads and navigates offline after cache install',async({page,context})=>{
 const base='http://127.0.0.1:4174'+(process.env.GITHUB_ACTIONS?'/-BOKS-ANTRENMAN/':'/');
 await page.goto(base);await expect(page.getByText('İlk antrenman programını oluştur.')).toBeVisible();
 const manifest=await page.evaluate(async()=>{const url=document.querySelector('link[rel=manifest]').href;const manifest=await (await fetch(url)).json();return {url,manifest,start:new URL(manifest.start_url,url).href,scope:new URL(manifest.scope,url).href};});
 expect(manifest.url).toBe(base+'manifest.json');expect(manifest.start).toBe(base);expect(manifest.scope).toBe(base);expect(manifest.manifest.display).toBe('standalone');
 for(const size of [192,512]){const icon=manifest.manifest.icons.find(i=>i.sizes===`${size}x${size}`);expect(icon).toBeTruthy();const image=await page.evaluate(async url=>{const image=new Image();image.src=url;await image.decode();return {width:image.naturalWidth,height:image.naturalHeight};},new URL(icon.src,manifest.url).href);expect(image).toEqual({width:size,height:size});}
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
 await context.setOffline(true);await page.reload();await expect(page.getByText('İlk antrenman programını oluştur.')).toBeVisible();
 await page.getByRole('link',{name:'Yeni program oluştur'}).click();await expect(page.getByText('Program Türü',{exact:true})).toBeVisible();
 await context.setOffline(false);
});
