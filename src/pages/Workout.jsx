import {useCallback,useEffect,useRef,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import {Button} from '@/components/ui/button';
import WorkoutBlockPreview from '@/features/programPreview/components/WorkoutBlockPreview';
import TechniqueInstructions from '@/features/workout/TechniqueInstructions';
import {loadWorkout,applyWorkoutEvent} from '@/features/workout/workoutService';
import {currentWorkoutBlock,WORKOUT_STATUS_LABELS,TERMINAL_WORKOUT_STATUSES} from '@/features/workout/workoutState';
import {formatCivilDate,formatSeconds,BLOCK_TYPE_LABELS} from '@/features/programPreview/previewLabels';
import {currentStrengthPhase} from '@/features/workout/strengthPlayback';
import {loadAppPreferences} from '@/features/settings/appPreferences';
import {LABELS} from '@/features/programCreate/programPreferences';
import {programTitle} from '@/features/programManagement/programManagementService';
import {TRAINING_OBJECTIVE_INSTRUCTIONS} from '@/features/boxing/instructions/trainingObjectiveInstructions';

export default function Workout() {
  const [params]=useSearchParams();const dayId=params.get('day'),programId=params.get('program');
  const [context,setContext]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const contextRef=useRef(null),queue=useRef(Promise.resolve()),mounted=useRef(true);
  const [confirmStop,setConfirmStop]=useState(false);
  const preferences=useRef({sound:false,vibration:false});
  const audio=useRef(null);
  useEffect(()=>{loadAppPreferences().then(value=>{preferences.current=value;}).catch(()=>{});return()=>{audio.current?.close();};},[]);
  useEffect(()=>{
    let active=true;mounted.current=true;setLoading(true);setError('');
    loadWorkout(dayId,Date.now(),programId).then(result=>{if(active){contextRef.current=result;setContext(result);setLoading(false);}}).catch(e=>{if(active){setError(e.message);setLoading(false);}});
    return()=>{active=false;mounted.current=false;};
  },[dayId,programId]);
  const execute=useCallback(event=>{
    if(['start','resume'].includes(event)&&preferences.current.sound&&typeof window.AudioContext==='function') {
      audio.current??=new AudioContext();audio.current.resume().catch(()=>{});
    }
    queue.current=queue.current.then(async()=>{
      const current=contextRef.current;if(!current)return;
      try{const progress=await applyWorkoutEvent(current,event,Date.now());const next={...current,progress};contextRef.current=next;
        if(currentWorkoutBlock(current.blocks,current.progress.positionMs).index!==currentWorkoutBlock(current.blocks,progress.positionMs).index) {
          if(preferences.current.vibration&&typeof navigator.vibrate==='function')navigator.vibrate(120);
          if(preferences.current.sound&&audio.current?.state==='running') {
            const oscillator=audio.current.createOscillator(),gain=audio.current.createGain();gain.gain.value=0.15;
            oscillator.frequency.value=660;oscillator.connect(gain);gain.connect(audio.current.destination);oscillator.start();oscillator.stop(audio.current.currentTime+0.15);
          }
        }
        if(mounted.current){setContext(next);setError('');setConfirmStop(false);}}
      catch(e){if(mounted.current)setError(e.message);}
    });return queue.current;
  },[]);
  useEffect(()=>{
    if(context?.progress.status!=='in_progress'||error)return;
    const timer=window.setInterval(()=>execute('tick'),500);
    const hide=()=>{if(document.hidden)execute('pause');};
    document.addEventListener('visibilitychange',hide);
    return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',hide);};
  },[context?.progress.status,error,execute]);
  if(loading)return <><PageHeader title="Antrenman"/><p>Yükleniyor…</p></>;
  if(!context)return <div className="space-y-4"><PageHeader title="Antrenman"/>{error?<p role="alert" className="text-destructive">{error}</p>:<EmptyState title="Sıradaki antrenman hazır değil." description="Program oluştur, incele ve onayla. Tüm seansların sonuçlandıysa yeni program oluşturabilirsin."/>}<Button asChild><Link to="/programs">Programlarım</Link></Button></div>;
  const {progress,blocks,day}=context,current=currentWorkoutBlock(blocks,progress.positionMs);
  const terminal=TERMINAL_WORKOUT_STATUSES.some(status=>status===progress.status);
  const strengthPhase=current.block?currentStrengthPhase(current.block,progress.positionMs-current.startMs):null;
  return <div className="space-y-5">
    <PageHeader title={`Antrenman ${day.trainingOrdinal}`} description={formatCivilDate(day.plannedDate)}/>
    <p className="text-sm font-medium break-words">{programTitle(context.program)}</p>
    {context.version.settingsSnapshot.boxingStance&&<p className="text-sm">Duruş: {LABELS.boxingStance[context.version.settingsSnapshot.boxingStance]}</p>}
    {!context.program.deletedAt&&<Link className="block text-sm underline" to={`/program-create?edit=${context.program.id}`}>Programı düzenle</Link>}
    {context.program.currentVersionId!==context.version.id&&<p className="text-sm text-muted-foreground">Bu sonuç önceki program düzenine aittir; o antrenmanın özgün duruşu ve içeriği gösteriliyor.</p>}
    {day.trainingCycleSnapshot&&<p className="rounded-lg bg-muted p-3 text-sm">{TRAINING_OBJECTIVE_INSTRUCTIONS[day.trainingCycleSnapshot.objective]}</p>}
    {error&&<p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error} <button className="underline" onClick={()=>window.location.reload()}>Yeniden aç</button></p>}
    <div className="rounded-2xl border bg-muted/30 p-5 text-center space-y-2">
      <p className="text-sm font-medium">{WORKOUT_STATUS_LABELS[progress.status]}</p>
      <p className="text-xs text-muted-foreground">Blok {Math.min(current.index+1,blocks.length)} / {blocks.length}{current.block?` · ${BLOCK_TYPE_LABELS[current.block.type]}`:''}</p>
      {strengthPhase&&<p className="font-medium">{strengthPhase.label}</p>}
      <p className="tabular-nums text-6xl font-semibold tracking-tight" aria-label="Kalan süre">{formatSeconds(Math.ceil((strengthPhase?.remainingMs??current.remainingMs)/1000))}</p>
      <progress className="w-full accent-foreground" value={progress.positionMs} max={progress.totalMs} aria-label="Antrenman ilerlemesi"/>
      <p className="text-xs text-muted-foreground">Yapılan {formatSeconds(progress.actualMs/1000)} · Planlanan {formatSeconds(progress.totalMs/1000)}</p>
    </div>
    {current.block&&!terminal&&<div className="rounded-xl border p-4 space-y-3"><WorkoutBlockPreview block={current.block}/><TechniqueInstructions block={current.block}/></div>}
    {progress.status==='upcoming'&&<Button className="w-full h-12" onClick={()=>execute('start')}>Antrenmanı başlat</Button>}
    {progress.status==='in_progress'&&<Button className="w-full h-12" onClick={()=>execute('pause')}>Duraklat</Button>}
    {progress.status==='paused'&&<Button className="w-full h-12" onClick={()=>execute('resume')}>Devam et</Button>}
    {['paused','in_progress'].includes(progress.status)&&<Button variant="outline" className="w-full" onClick={()=>execute('skip_block')}>Bu bloğu atla</Button>}
    {progress.status==='awaiting_completion_confirmation'&&<div className="rounded-xl border p-4 space-y-3"><p>Planlanan süre bitti. Antrenmanı yaptığını onayla.</p>{progress.skippedBlockIds.length>0&&<p className="text-sm text-muted-foreground">Atlanan bloklar nedeniyle sonuç kısmen yapıldı olarak kaydedilecek.</p>}<Button className="w-full" onClick={()=>execute('confirm')}>Yaptım, sonucu kaydet</Button></div>}
    {!terminal&&<div className="space-y-2">{!confirmStop?<Button variant="ghost" className="w-full" onClick={()=>setConfirmStop(true)}>Antrenmanı sonlandır</Button>:<div className="rounded-lg border p-3 space-y-2"><p className="text-sm">{progress.actualMs>0?'Yapılan süre kısmen yapıldı olarak kaydedilsin mi?':'Antrenman atlandı olarak kaydedilsin mi?'}</p><Button variant="destructive" className="w-full" onClick={()=>execute(progress.actualMs>0?'finish_partial':'skip_workout')}>Sonlandır ve kaydet</Button><Button variant="ghost" className="w-full" onClick={()=>setConfirmStop(false)}>Vazgeç</Button></div>}</div>}
    {terminal&&<div className="rounded-xl border p-4 space-y-3"><p>Sonucun kaydedildi.</p><Button asChild className="w-full"><Link to={`/workout?program=${context.program.id}`} onClick={()=>{if(!dayId)window.location.reload();}}>Sıradaki antrenman</Link></Button><Button asChild variant="outline" className="w-full"><Link to="/history">Geçmişi gör</Link></Button></div>}
    <p className="text-xs text-muted-foreground">Uygulama arka plana geçtiğinde duraklar. Yeniden açıldığında kayıtlı noktadan devam edebilirsin.</p>
  </div>;
}
