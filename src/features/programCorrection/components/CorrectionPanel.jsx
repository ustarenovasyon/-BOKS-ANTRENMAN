/**
 * CORRECTION PANEL — Sorunları Düzelt (PART 18 UI)
 * --------------------------------------------------------------
 * REVIEW_FAILED program için "Sorunları Düzelt" butonu.
 * correctFailedProgram service'ini çağırır.
 * Başarılı → yeni version REVIEW_REQUIRED → sayfa yenilenir.
 * --------------------------------------------------------------
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { correctFailedProgram } from '@/features/programCorrection/programCorrectionService';
import { CORRECTION_REASON_LABELS } from '@/features/programCorrection/programCorrectionConstants';

export default function CorrectionPanel({ programId }) {
  const [state, setState] = useState({ status: 'idle' });

  const run = async () => {
    setState({ status: 'running' });
    try {
      const result = await correctFailedProgram(programId);
      if (!result.success) {
        setState({ status: 'error', reason: result.reason });
        return;
      }
      // Success: new version REVIEW_REQUIRED → reload to reflect fresh state.
      setState({ status: 'running' });
      setTimeout(() => window.location.reload(), 60);
    } catch (e) {
      setState({ status: 'error', error: String(e) });
    }
  };

  if (state.status === 'running') {
    return <p className="text-xs text-muted-foreground mt-2">Program düzeltiliyor…</p>;
  }
  if (state.status === 'error') {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-xs text-destructive">{CORRECTION_REASON_LABELS[state.reason] || 'Düzeltme başlatılamadı.'}</p>
        <Button onClick={() => setState({ status: 'idle' })} variant="outline" size="sm" className="w-full">Tekrar Dene</Button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-1">
      <Button onClick={run} variant="outline" className="w-full" size="sm">Sorunları Düzelt</Button>
      <p className="text-[10px] text-muted-foreground">Program aynı ayarlarla yeniden oluşturulacak ve yeniden kontrol edilebilecek.</p>
    </div>
  );
}