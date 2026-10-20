import {useEffect,useState} from 'react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import {Button} from '@/components/ui/button';
import {loadWorkoutHistory,saveWorkoutFeedback} from '@/features/history/workoutHistoryService';
import {WORKOUT_STATUS_LABELS} from '@/features/workout/workoutState';
import {formatCivilDate,formatSeconds} from '@/features/programPreview/previewLabels';

function Feedback({row,initial}) {
  const [effort,setEffort]=useState(initial?.effort??''),[note,setNote]=useState(initial?.note??''),[message,setMessage]=useState('');
  return <details className="text-sm"><summary className="cursor-pointer py-1">Not ve kendi değerlendirmem</summary><div className="mt-2 space-y-2">
    <label className="block">Hissettiğin zorlanma (1–10)<select aria-label="Hissedilen zorlanma" className="mt-1 w-full rounded border bg-background p-2" value={effort} onChange={e=>setEffort(e.target.value)}><option value="">Seçmek zorunlu değil</option>{Array.from({length:10},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label>
    <label className="block">Not<textarea aria-label="Antrenman notu" className="mt-1 w-full rounded border bg-background p-2" value={note} maxLength={1000} rows={3} onChange={e=>setNote(e.target.value)}/></label>
    <Button variant="outline" size="sm" onClick={async()=>{try{await saveWorkoutFeedback(row.id,effort===''?null:Number(effort),note);setMessage('Kaydedildi.');}catch(e){setMessage(e.message);}}}>Notu kaydet</Button><p role="status" className="text-xs">{message}</p>
    <p className="text-xs text-muted-foreground">Bu, kendi değerlendirmen; uygulama teknik doğruluğunu ölçmez.</p>
  </div></details>;
}
export default function History() {
  const [data,setData]=useState(null),[error,setError]=useState(''),[status,setStatus]=useState('all'),[from,setFrom]=useState(''),[to,setTo]=useState('');
  useEffect(()=>{let active=true;loadWorkoutHistory().then(d=>{if(active)setData(d);}).catch(()=>setError('Geçmiş okunamadı.'));return()=>{active=false;};},[]);
  const rows=data?.rows.filter(row=>(status==='all'||row.status===status)&&(!from||row.plannedDate>=from)&&(!to||row.plannedDate<=to))??[];
  return <div className="space-y-4"><PageHeader title="Geçmiş" description="Onayladığın sonuçlar ve kendi antrenman notların."/>
    {error&&<p role="alert" className="text-destructive">{error}</p>}{!data&&!error&&<p>Yükleniyor…</p>}
    {data&&<><div className="grid grid-cols-3 gap-2 text-center">{['completed','partial','skipped'].map(value=><div key={value} className="rounded-xl border p-3"><p className="text-2xl font-semibold">{data.rows.filter(r=>r.status===value).length}</p><p className="text-xs text-muted-foreground">{WORKOUT_STATUS_LABELS[value]}</p></div>)}</div>
    <div className="rounded-lg border p-3 space-y-2"><label className="block text-sm">Durum<select className="mt-1 w-full rounded border bg-background p-2" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">Tüm sonuçlar</option>{['completed','partial','skipped'].map(s=><option key={s} value={s}>{WORKOUT_STATUS_LABELS[s]}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><label className="text-sm">Plan başlangıcı<input aria-label="Plan başlangıcı" className="mt-1 w-full rounded border bg-background p-2" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="text-sm">Plan bitişi<input aria-label="Plan bitişi" className="mt-1 w-full rounded border bg-background p-2" type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div></div>
    {!rows.length&&<EmptyState title="Bu aralıkta sonuç yok." description="Antrenman süresinin dolması tek başına kayıt oluşturmaz; tamamlamayı onaylamalısın."/>}
    {rows.map(row=><article key={row.id} className="rounded-xl border p-4 space-y-2"><div className="flex justify-between gap-2"><h2 className="font-medium">Antrenman {row.trainingOrdinal}</h2><span className="text-sm">{WORKOUT_STATUS_LABELS[row.status]}</span></div><p className="text-xs text-muted-foreground">Plan: {formatCivilDate(row.plannedDate)}</p><p className="text-sm">Yapılan {formatSeconds(row.actualSeconds)} / Planlanan {formatSeconds(row.plannedSeconds)}</p>{row.completedAt&&<p className="text-xs text-muted-foreground">Kayıt: {new Date(row.completedAt).toLocaleString('tr-TR')}</p>}<Feedback row={row} initial={data.feedback.find(f=>f.programDayId===row.programDayId)}/></article>)}</>}
  </div>;
}
