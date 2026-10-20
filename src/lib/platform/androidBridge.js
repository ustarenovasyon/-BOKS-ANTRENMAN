/** Native file saving is available only in the packaged Android main frame. */
export function isAndroidApp() {return typeof window!=='undefined'&&typeof window['BoxAndroid']?.postMessage==='function';}
let sequence=0;
export async function saveJsonFile(json,filename) {
 if(!isAndroidApp()) {
  const url=URL.createObjectURL(new Blob([json],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);return;
 }
 const bridge=window['BoxAndroid'],id=`save-${++sequence}`;
 return new Promise((resolve,reject)=>{
  const previous=bridge.onmessage;
  bridge.onmessage=event=>{
   let reply;try{reply=JSON.parse(event.data);}catch{return;}
   if(reply.id!==id){previous?.(event);return;}bridge.onmessage=previous;
   if(reply.ok)resolve(undefined);else reject(new Error(reply.error||'Dosya kaydedilemedi.'));
  };
  bridge.postMessage(JSON.stringify({id,operation:'exportBackup',json,filename}));
 });
}
