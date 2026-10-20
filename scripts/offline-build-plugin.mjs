import {readdir,readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
export function offlineBuildPlugin() {
 let config;
 return {name:'box-offline-shell',apply:'build',configResolved(value){config=value;},async closeBundle(){
  const root=resolve(config.root,config.build.outDir),files=[];
  async function walk(dir,prefix='') {
   for(const entry of await readdir(dir,{withFileTypes:true})) {
    const path=prefix+entry.name;
    if(entry.isDirectory())await walk(join(dir,entry.name),path+'/');
    else if(!path.endsWith('.map')&&path!=='sw.js')files.push(path);
   }
  }
  await walk(root);files.sort();const hash=createHash('sha256');for(const file of files)hash.update(await readFile(join(root,file)));
  const base=config.base,urls=files.map(file=>base+file),prefix=`box-shell-${createHash('sha256').update(base).digest('hex').slice(0,8)}-`,cache=prefix+hash.digest('hex').slice(0,16);
  await writeFile(join(root,'sw.js'),`
const CACHE=${JSON.stringify(cache)},PREFIX=${JSON.stringify(prefix)},URLS=${JSON.stringify(urls)},INDEX=${JSON.stringify(base+'index.html')};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(cache=>cache.match(INDEX))));
 else if(URLS.includes(new URL(event.request.url).pathname))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request,{ignoreVary:true}))||fetch(event.request)));
});
`);
 }};
}
