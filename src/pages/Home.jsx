import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import {loadTrainingOverview} from '@/features/workout/workoutService';
import {LABELS} from '@/features/programCreate/programPreferences';
export default function Home() {
  const [overview,setOverview]=useState(null),[error,setError]=useState('');
  useEffect(()=>{let active=true;loadTrainingOverview().then(data=>{if(active)setOverview(data);}).catch(()=>{if(active)setError('Programlar okunamadı.');});return()=>{active=false;};},[]);
  return <div className="space-y-5"><PageHeader title="Antrenman" description="Boks ve kuvvet. Programın cihazında; kendi hızında ilerle."/>
    {error&&<p role="alert" className="text-destructive">{error}</p>}{!overview&&!error&&<p>Programlar yükleniyor…</p>}
    {overview?.plans.map(plan=><div key={plan.program.id} className="rounded-2xl border p-5 space-y-3"><p className="text-xs text-muted-foreground">AKTİF PROGRAM</p><h2 className="text-xl font-semibold">{LABELS.programMode[plan.program.programMode]} · {plan.program.durationMonths} ay</h2><p className="text-sm text-muted-foreground">{plan.done} / {plan.days.length} seans sonuçlandı</p><progress value={plan.done} max={plan.days.length} className="w-full accent-foreground" aria-label="Program ilerlemesi"/><Button asChild className="w-full"><Link to="/workout">Antrenmana git</Link></Button><Link className="block text-center text-sm underline" to={`/program-preview/${plan.program.id}`}>Program takvimi</Link></div>)}
    {overview&&!overview.programs.length&&<EmptyState title="İlk antrenman programını oluştur." description="Süreni, günlerini ve seviyeni seç. Programı inceleyip onayladıktan sonra başlayabilirsin."/>}
    {overview?.programs.length>0&&!overview.plans.length&&<p className="rounded-lg border p-4 text-sm">Programın hazır. Başlamak için Programlarım ekranındaki kontrol ve onay adımlarını tamamla.</p>}
    <Button asChild variant="outline" className="w-full"><Link to="/program-create">Yeni program oluştur</Link></Button><Button asChild variant="ghost" className="w-full"><Link to="/programs">Programlarım</Link></Button>
  </div>;
}
