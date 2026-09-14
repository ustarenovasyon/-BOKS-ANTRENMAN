/**
 * PROGRAM SUMMARY (PART 16)
 * --------------------------------------------------------------
 * Compact program özeti. Source: ProgramVersion.settingsSnapshot
 * (current profile DEĞİL). End date: son scheduled training date.
 * Status: "İnceleme Bekliyor".
 * --------------------------------------------------------------
 */
import React from 'react';
import { formatCivilDate, formatIsoCivilDate, PROGRAM_STATUS_LABELS } from '../previewLabels';
import { LABELS } from '@/features/programCreate/programPreferences';
import AuditPanel from '@/features/programAudit/components/AuditPanel';

const L = LABELS;

function Line({ label, value }) {
  return (
    <div className="flex justify-between gap-2 py-0.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-foreground text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function ProgramSummary({ program, version, summary }) {
  const s = version.settingsSnapshot || {};
  const isBoxing = s.programMode === 'boxing_only' || s.programMode === 'boxing_and_strength';
  const isStrength = s.programMode === 'strength_only' || s.programMode === 'boxing_and_strength';
  const weekdays = (s.selectedWeekdays || []).map((d) => L.weekdays[d]).join(', ');
  const equipment = (s.availableEquipment || []).map((e) => L.equipment[e]).join(', ');

  return (
    <div className="rounded-lg border border-border p-3 space-y-1">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Program Önizleme</h2>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{PROGRAM_STATUS_LABELS[program.status] || program.status}</span>
      </div>
      <Line label="Program Türü" value={L.programMode[s.programMode] || s.programMode} />
      <Line label="Program Süresi" value={L.durationMonths[s.durationMonths] || s.durationMonths} />
      <Line label="Haftada Gün" value={s.daysPerWeek} />
      <Line label="Günlük Süre" value={`${s.sessionDurationMinutes} dk`} />
      <Line label="Başlangıç" value={formatCivilDate(version.programStartDate)} />
      <Line label="Son Antrenman" value={formatCivilDate(summary.lastScheduledDate)} />
      <Line label="Toplam Antrenman" value={summary.totalSessions} />
      <Line label="Deneyim" value={L.experienceLevel[s.experienceLevel] || '—'} />
      <Line label="Yoğunluk" value={L.difficulty[s.difficulty] || '—'} />
      <Line label="Antrenman Günleri" value={weekdays || '—'} />
      {isBoxing && (
        <>
          <Line label="Duruş" value={L.boxingStance[s.boxingStance] || '—'} />
          <Line label="Maks. Hamle Sınırı" value={`${s.boxingMaxMoves} hamle`} />
        </>
      )}
      {isStrength && (
        <>
          <Line label="Kuvvet Günü" value={s.programMode === 'boxing_and_strength' ? `Haftada ${s.strengthDaysPerWeek}` : `Haftada ${s.daysPerWeek}`} />
          <Line label="Ekipman" value={equipment || '—'} />
        </>
      )}
      <div className="flex justify-between gap-2 pt-2 mt-1 border-t border-border">
        <span className="text-muted-foreground text-xs">Boks / Kuvvet / Savunma günleri</span>
        <span className="text-foreground text-xs font-medium">{summary.boxingDays} / {summary.strengthDays} / {summary.defenseDays}</span>
      </div>
      {program.createdAt && (
        <p className="text-xs text-muted-foreground pt-1">Oluşturulma: {formatIsoCivilDate(program.createdAt)}</p>
      )}
      <AuditPanel programId={program.id} programStatus={program.status} />
    </div>
  );
}