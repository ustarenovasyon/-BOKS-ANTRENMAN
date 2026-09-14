/**
 * APPROVAL PANEL — Onayla ve Programı Başlat (PART 18 UI)
 * --------------------------------------------------------------
 * READY_FOR_APPROVAL program için onay butonu + confirmation dialog.
 * approveProgram service'ini çağırır.
 * Başarılı → ACTIVE + locked → sayfa yenilenir.
 * --------------------------------------------------------------
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { approveProgram } from '@/features/programApproval/programApprovalService';
import { APPROVAL_REASON_LABELS } from '@/features/programApproval/programApprovalConstants';

export default function ApprovalPanel({ programId }) {
  const [state, setState] = useState({ status: 'idle' });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = async () => {
    setConfirmOpen(false);
    setState({ status: 'running' });
    try {
      const result = await approveProgram(programId);
      if (!result.success) {
        setState({ status: 'error', reason: result.reason });
        return;
      }
      // Success: ACTIVE + locked → reload to reflect fresh state.
      setState({ status: 'running' });
      setTimeout(() => window.location.reload(), 60);
    } catch (e) {
      setState({ status: 'error', error: String(e) });
    }
  };

  if (state.status === 'running') {
    return <p className="text-xs text-muted-foreground mt-2">Program aktifleştiriliyor…</p>;
  }
  if (state.status === 'error') {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-xs text-destructive">{APPROVAL_REASON_LABELS[state.reason] || 'Onay başlatılamadı.'}</p>
        <Button onClick={() => setState({ status: 'idle' })} variant="outline" size="sm" className="w-full">Tekrar Dene</Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => setConfirmOpen(true)} className="w-full mt-2" size="sm">Onayla ve Programı Başlat</Button>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programı Onayla</DialogTitle>
            <DialogDescription>
              Bu program onaylandıktan sonra mevcut sürüm kilitlenecek ve aktif programınız olacak.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Vazgeç</Button>
            <Button onClick={run}>Onayla ve Başlat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}