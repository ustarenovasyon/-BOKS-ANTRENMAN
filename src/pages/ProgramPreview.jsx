/**
 * PROGRAM PREVIEW PAGE (PART 16)
 * --------------------------------------------------------------
 * READ-ONLY. Persisted program'ı IndexedDB'den okur.
 * Generation engine ÇAĞIRMAZ. Regenerate YOK. Status mutate YOK.
 * Route: /program-preview/:programId
 * --------------------------------------------------------------
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { loadProgramPreview } from '@/features/programPreview/programPreviewService';
import { PREVIEW_ERROR_MESSAGES } from '@/features/programPreview/previewLabels';
import ProgramSummary from '@/features/programPreview/components/ProgramSummary';
import ProgramMonthSection from '@/features/programPreview/components/ProgramMonthSection';

export default function ProgramPreview() {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await loadProgramPreview(programId);
      if (!active) return;
      if (result.valid) {
        setState({ status: 'ready', viewModel: result.viewModel, blocksByDay: result.blocksByDay });
      } else {
        setState({ status: 'error', reason: result.reason });
      }
    })();
    return () => { active = false; };
  }, [programId]);

  if (state.status === 'loading') {
    return (
      <div>
        <PageHeader title="Program Önizleme" />
        <p className="text-sm text-muted-foreground">Program yükleniyor...</p>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="space-y-4">
        <PageHeader title="Program Önizleme" />
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {PREVIEW_ERROR_MESSAGES[state.reason] || 'Program yüklenemedi.'}
        </div>
        <button
          type="button"
          onClick={() => navigate('/programs')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Programlarım'a dön
        </button>
      </div>
    );
  }

  const { viewModel, blocksByDay } = state;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PageHeader title="Program Önizleme" />
      </div>
      <Link to="/programs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Programlarım
      </Link>

      <ProgramSummary program={viewModel.program} version={viewModel.version} summary={viewModel.summary} />

      <div className="space-y-2">
        {viewModel.months.map((m, idx) => (
          <ProgramMonthSection
            key={m.monthIndex}
            month={m}
            blocksByDay={blocksByDay}
            defaultOpen={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}