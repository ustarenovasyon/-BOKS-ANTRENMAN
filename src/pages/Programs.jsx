import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { programRepository } from '@/lib/localData/repositories';
import { LABELS } from '@/features/programCreate/programPreferences';
import { formatIsoCivilDate, PROGRAM_STATUS_LABELS } from '@/features/programPreview/previewLabels';

export default function Programs() {
  const [state, setState] = useState({ status: 'loading' });
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await programRepository.list();
        if (!active) return;
        const sorted = [...list].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setState({ status: 'ready', programs: sorted });
      } catch (e) {
        setState({ status: 'error' });
      }
    })();
    return () => { active = false; };
  }, []);

  if (state.status === 'loading') {
    return (
      <div>
        <PageHeader title="Programlarım" />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <PageHeader title="Programlarım" />
        <p className="text-sm text-destructive">Programlar okunamadı.</p>
      </div>
    );
  }

  if (state.programs.length === 0) {
    return (
      <div>
        <PageHeader title="Programlarım" />
        <EmptyState
          title="Henüz oluşturulmuş program yok."
          description="Program Oluştur ekranından ilk programını oluşturabilirsin."
        />
        <Button onClick={() => navigate('/program-create')} className="w-full mt-4">
          Program Oluştur
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Programlarım" />
      {state.programs.map((p) => {
        const modeLabel = LABELS.programMode[p.programMode] || p.programMode;
        const durationLabel = LABELS.durationMonths[p.durationMonths] || `${p.durationMonths} Ay`;
        const statusLabel = PROGRAM_STATUS_LABELS[p.status] || p.status;
        return (
          <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{modeLabel}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{statusLabel}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>{durationLabel}</p>
              {p.createdAt && <p>Oluşturulma: {formatIsoCivilDate(p.createdAt)}</p>}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate(`/program-preview/${p.id}`)}
            >
              Önizle
            </Button>
          </div>
        );
      })}
    </div>
  );
}