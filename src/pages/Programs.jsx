import {useCallback,useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import {Button} from '@/components/ui/button';
import {programRepository} from '@/lib/localData/repositories';
import {LABELS} from '@/features/programCreate/programPreferences';
import {formatIsoCivilDate,PROGRAM_STATUS_LABELS} from '@/features/programPreview/previewLabels';
import ProgramActions from '@/features/programManagement/ProgramActions';
import {programTitle} from '@/features/programManagement/programManagementService';

export default function Programs() {
  const [programs,setPrograms]=useState(null),[error,setError]=useState(''),[filter,setFilter]=useState('all'),[search,setSearch]=useState('');
  const load=useCallback(async()=>{try{const list=await programRepository.list();setPrograms([...list].sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')));setError('');}catch{setError('Programlar okunamadı.');}},[]);
  useEffect(()=>{load();},[load]);
  const visible=programs?.filter(p=>(filter==='trash'?!!p.deletedAt:!p.deletedAt&&(filter==='all'||p.status===filter))&&programTitle(p).toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')))??[];
  return <div className="space-y-4"><PageHeader title="Programlarım" description="Birden fazla program oluşturabilir, mevcut programlarını düzenleyebilirsin."/>
    <Button asChild className="w-full"><Link to="/program-create">Yeni program oluştur</Link></Button>
    <label className="block text-sm">Program ara<input className="mt-1 w-full rounded border bg-background p-2" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Program adı"/></label>
    <label className="block text-sm">Program listesi<select aria-label="Program listesi" className="mt-1 w-full rounded border bg-background p-2" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tüm programlar</option><option value="active">Aktif</option><option value="paused">Duraklatılmış</option><option value="archived">Arşiv</option><option value="trash">Çöp kutusu</option></select></label>
    {error&&<p role="alert" className="text-destructive">{error}</p>}{!programs&&!error&&<p>Yükleniyor…</p>}
    {programs&&!visible.length&&<EmptyState title="Bu listede program yok." description="Yeni program oluşturabilir veya liste filtresini değiştirebilirsin."/>}
    {visible.map(program=><article key={program.id} aria-label={programTitle(program)} className="rounded-xl border p-4 space-y-3"><div className="flex justify-between gap-2"><h2 className="font-medium break-words min-w-0">{programTitle(program)}</h2><span className="text-xs shrink-0">{program.deletedAt?'Çöp kutusunda':PROGRAM_STATUS_LABELS[program.status]||program.status}</span></div><p className="text-sm text-muted-foreground">{LABELS.programMode[program.programMode]} · {program.durationMonths} ay</p>{program.createdAt&&<p className="text-xs text-muted-foreground">Oluşturulma: {formatIsoCivilDate(program.createdAt)}</p>}
      {!program.deletedAt&&<Button asChild variant="outline" className="w-full"><Link to={`/program-preview/${program.id}`}>Önizle</Link></Button>}
      <ProgramActions program={program} onChanged={load}/>
    </article>)}
  </div>;
}
