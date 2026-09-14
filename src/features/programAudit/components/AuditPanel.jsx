/**
 * AUDIT PANEL — Programı Gözden Geçir (PART 17 UI)
 * --------------------------------------------------------------
 * Gerçek runProgramAudit/loadExistingAudit service'ini çağırır.
 * PASS → READY_FOR_APPROVAL → ApprovalPanel (PART 18).
 * FAIL → REVIEW_FAILED → CorrectionPanel (PART 18).
 * --------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { runProgramAudit, loadExistingAudit } from '@/features/programAudit/programAuditService';
import { AUDIT_REASON_LABELS } from '@/features/programAudit/auditReasonLabels';
import { PROGRAM_AUDIT_OUTCOMES } from '@/features/programAudit/programAuditConstants';
import CorrectionPanel from '@/features/programCorrection/components/CorrectionPanel';
import ApprovalPanel from '@/features/programApproval/components/ApprovalPanel';

const CATEGORY_LABELS = {
  identity: 'Kimlik', calendar: 'Takvim', time_budget: 'Zaman Bütçesi', progression: 'İlerleme',
  weekly_balance: 'Haftalık Denge', boxing: 'Boks', defense: 'Savunma', strength: 'Kuvvet',
  coverage: 'Kapsam', repetition: 'Tekrar', policy: 'Politika',
};

function FindingRow({ f }) {
  const loc = f.location || {};
  const parts = [];
  if (loc.trainingOrdinal) parts.push(`Antrenman ${loc.trainingOrdinal}`);
  if (loc.plannedDate) parts.push(loc.plannedDate);
  if (Number.isInteger(loc.orderIndex)) parts.push(`Blok ${loc.orderIndex}`);
  return (
    <div className="text-xs py-1 pl-3 border-l-2 border-border">
      <span className={f.severity === 'critical' ? 'text-destructive font-medium' : 'text-amber-600 font-medium'}>
        {f.severity === 'critical' ? 'Kritik' : 'Uyarı'}
      </span>
      <span className="text-muted-foreground"> · {CATEGORY_LABELS[f.category] || f.category}</span>
      {parts.length > 0 && <span className="text-muted-foreground"> · {parts.join(' · ')}</span>}
      <p className="text-foreground mt-0.5">{AUDIT_REASON_LABELS[f.code] || f.code}</p>
      <p className="text-muted-foreground text-[10px] mt-0.5 break-all">{f.code}</p>
    </div>
  );
}

export default function AuditPanel({ programId, programStatus }) {
  const [state, setState] = useState({ status: 'loading' });

  const peek = async () => {
    const existing = await loadExistingAudit(programId);
    setState(existing ? { status: 'result', result: existing } : { status: 'idle' });
  };

  useEffect(() => { peek(); /* eslint-disable-next-line */ }, [programId]);

  const run = async () => {
    setState({ status: 'running' });
    try {
      const result = await runProgramAudit(programId);
      if (!result.success) { setState({ status: 'error', reason: result.reason, error: result.error }); return; }
      // Persisted status transition → reload to reflect fresh status + audit panel.
      if (result.persisted && result.newStatus) {
        setState({ status: 'running' });
        setTimeout(() => window.location.reload(), 60);
        return;
      }
      const r = { outcome: result.outcome, criticalIssueCount: result.criticalIssueCount, warningCount: result.warningCount, findings: result.findings, auditId: result.auditId, newStatus: result.newStatus };
      setState({ status: 'result', result: r });
    } catch (e) {
      setState({ status: 'error', error: String(e) });
    }
  };

  if (state.status === 'loading') return <p className="text-xs text-muted-foreground">Kontrol durumu okunuyor…</p>;
  if (state.status === 'running') return <p className="text-xs text-muted-foreground">Program kontrol ediliyor…</p>;
  if (state.status === 'error') return <p className="text-xs text-destructive">Kontrol çalıştırılamadı. {state.reason || state.error || ''}</p>;
  if (state.status === 'idle') {
    if (programStatus !== 'review_required') return null;
    return (
      <Button onClick={run} className="w-full mt-2" size="sm">Programı Gözden Geçir</Button>
    );
  }

  const r = state.result;
  const isPass = r.outcome === PROGRAM_AUDIT_OUTCOMES.PASS;
  return (
    <div className={`mt-2 rounded-md border p-2 space-y-1.5 ${isPass ? 'border-emerald-300 bg-emerald-50/40' : 'border-destructive/30 bg-destructive/5'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${isPass ? 'text-emerald-700' : 'text-destructive'}`}>
          {isPass ? '✓ Program kontrolden geçti' : 'Programda düzeltilmesi gereken sorunlar bulundu.'}
        </span>
      </div>
      {isPass ? (
        <p className="text-xs text-muted-foreground">Programda kritik bir sorun bulunmadı.{r.warningCount > 0 ? ` ${r.warningCount} uyarı.` : ''}</p>
      ) : (
        <p className="text-xs text-muted-foreground">{r.criticalIssueCount} kritik sorun{r.warningCount > 0 ? ` · ${r.warningCount} uyarı` : ''}</p>
      )}
      {r.findings && r.findings.length > 0 && (
        <div className="space-y-0.5 mt-1">
          {r.findings.slice(0, 50).map((f, i) => <FindingRow key={i} f={f} />)}
        </div>
      )}
      {/* PART 18: Correction (REVIEW_FAILED) / Approval (READY_FOR_APPROVAL) */}
      {!isPass && programStatus === 'review_failed' && (
        <CorrectionPanel programId={programId} />
      )}
      {isPass && programStatus === 'ready_for_approval' && (
        <ApprovalPanel programId={programId} />
      )}
    </div>
  );
}