import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {manageProgram} from './programManagementService';

export default function ProgramActions({program,onChanged}) {
  const [busy,setBusy]=useState(false),[pending,setPending]=useState(''),[error,setError]=useState('');
  const run=async action=>{setBusy(true);setError('');try{await manageProgram(program,action);setPending('');await onChanged();}catch(e){setError(e.message);}finally{setBusy(false);}};
  return <div className="space-y-2">
    {!program.deletedAt&&<div className="grid grid-cols-2 gap-2"><Button variant="outline" className="min-w-0 h-auto min-h-11 whitespace-normal py-2" asChild><Link to={`/program-create?edit=${program.id}`}>Düzenle</Link></Button><Button variant="outline" className="min-w-0 h-auto min-h-11 whitespace-normal py-2" asChild><Link to={`/program-create?copy=${program.id}`}>Kopyasını oluştur</Link></Button></div>}
    <div className="flex flex-wrap gap-2">
      {program.status==='active'&&!program.deletedAt&&<Button variant="outline" disabled={busy} onClick={()=>run('pause')}>Programı duraklat</Button>}
      {['paused','completed'].includes(program.status)&&!program.deletedAt&&<Button variant="outline" disabled={busy} onClick={()=>run('resume')}>Programa devam et</Button>}
      {!program.deletedAt&&(program.status==='archived'?<Button variant="outline" disabled={busy} onClick={()=>run('unarchive')}>Arşivden çıkar</Button>:<Button variant="ghost" disabled={busy} onClick={()=>setPending('archive')}>Arşivle</Button>)}
      {program.deletedAt?<Button disabled={busy} onClick={()=>run('restore')}>Programı geri al</Button>:<Button variant="ghost" className="text-destructive" disabled={busy} onClick={()=>setPending('trash')}>Sil</Button>}
    </div>
    {pending&&<div role="group" aria-label="Program işlemini onayla" className="rounded-lg border p-3 space-y-2"><p className="text-sm">{pending==='trash'?'Program çöp kutusuna taşınacak. Antrenmanların, geçmişin ve notların korunur; Programlarım → Çöp kutusu üzerinden geri alabilirsin.':'Program arşive alınacak ve sıradaki antrenman listesinden kaldırılacak. İlerleme ve geçmiş korunur.'}</p><Button variant={pending==='trash'?'destructive':'default'} disabled={busy} onClick={()=>run(pending)}>{pending==='trash'?'Çöp kutusuna taşı':'Arşivlemeyi onayla'}</Button><Button variant="ghost" disabled={busy} onClick={()=>setPending('')}>Vazgeç</Button></div>}
    {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
