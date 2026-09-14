import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/PageHeader';
import SegmentedOptions from '@/features/programCreate/components/SegmentedOptions';
import WeekdayPicker from '@/features/programCreate/components/WeekdayPicker';
import EquipmentPicker from '@/features/programCreate/components/EquipmentPicker';
import { trainingProfileRepository } from '@/lib/localData/repositories/trainingProfileRepository';
import {
  DEFAULT_FORM, LABELS, validateProgramPreferences, normalizeProgramPreferences,
  toPersistedRecord, formFromRecord, resolveMinutes, hasBoxing, hasStrength,
} from '@/features/programCreate/programPreferences';
import { generateProgramBlueprint } from '@/features/programGeneration/programGenerationEngine';
import { persistProgramBlueprint } from '@/features/programGeneration/programPersistenceService';
import { mapProgramReason } from '@/features/programGeneration/reasonLabels';
import { generateId } from '@/lib/localData/id';
import { localCivilDate } from '@/lib/localData/time';
import {
  PROGRAM_MODES, PROGRAM_DURATION_MONTHS, BOXING_MAX_MOVES, DIFFICULTY_LEVELS,
  EXPERIENCE_LEVELS, BOXING_STANCES, SESSION_DURATION_OPTIONS, SESSION_DURATION_LIMITS,
} from '@/config/architecture';

const modeOptions = Object.values(PROGRAM_MODES).map((v) => ({ value: v, label: LABELS.programMode[v] }));
const durationOptions = Object.values(PROGRAM_DURATION_MONTHS).map((v) => ({ value: v, label: LABELS.durationMonths[v] }));
const daysOptions = [1, 2, 3, 4, 5, 6, 7].map((v) => ({ value: v, label: String(v) }));
const experienceOptions = Object.values(EXPERIENCE_LEVELS).map((v) => ({ value: v, label: LABELS.experienceLevel[v] }));
const difficultyOptions = Object.values(DIFFICULTY_LEVELS).map((v) => ({ value: v, label: LABELS.difficulty[v] }));
const stanceOptions = Object.values(BOXING_STANCES).map((v) => ({ value: v, label: LABELS.boxingStance[v] }));
const maxMovesOptions = BOXING_MAX_MOVES.map((v) => ({ value: v, label: `En fazla ${v} hamle` }));
const durationPresetOptions = SESSION_DURATION_OPTIONS.map((v) => ({ value: v, label: `${v} dk` }));

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-sm font-semibold text-foreground pt-2">{children}</h2>;
}

export default function ProgramCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState(null);
  const stanceRef = useRef(null);
  const buttonAreaRef = useRef(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const rec = await trainingProfileRepository.get();
        if (active) setForm(formFromRecord(rec));
      } catch (e) {
        console.error('Profile load failed', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setStatus(null); };

  const scrollToValidation = () => {
    buttonAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const showBoxing = hasBoxing(form.programMode);
  const showStanceError = status?.type === 'error' && showBoxing && !form.boxingStance;
  const showStrength = hasStrength(form.programMode);
  const isCombined = form.programMode === PROGRAM_MODES.BOXING_AND_STRENGTH;

  const handleGenerate = async () => {
    setStatus({ type: 'checking', message: 'Kontrol ediliyor...' });
    await new Promise((r) => setTimeout(r, 0));
    const { valid, errors } = validateProgramPreferences(form);
    if (!valid) {
      setStatus({ type: 'error', message: 'Eksik bilgiler:', errors });
      scrollToValidation();
      return;
    }
    setIsGenerating(true);
    setStatus({ type: 'checking', message: 'Program oluşturuluyor...' });
    try {
      const normalized = normalizeProgramPreferences(form);
      const existing = await trainingProfileRepository.get();
      const record = toPersistedRecord(normalized, existing);
      await trainingProfileRepository.save(record);
      setForm(formFromRecord(record));

      const requestId = generateId('REQ');
      const input = {
        programMode: record.programMode,
        durationMonths: record.durationMonths,
        daysPerWeek: record.daysPerWeek,
        selectedWeekdays: record.selectedWeekdays,
        sessionDurationMinutes: record.sessionDurationMinutes,
        experienceLevel: record.experienceLevel,
        difficulty: record.difficulty,
        preferredTrainingTime: record.preferredTrainingTime,
        boxingStance: record.boxingStance,
        boxingMaxMoves: record.boxingMaxMoves,
        strengthDaysPerWeek: record.strengthDaysPerWeek,
        availableEquipment: record.availableEquipment,
        generationLocalDate: localCivilDate(),
        generationRequestId: requestId,
        generationSeed: requestId,
      };
      await new Promise((r) => setTimeout(r, 0));
      const result = generateProgramBlueprint(input);
      if (!result.valid) {
        const reason = (result.reasons && result.reasons[0]) || null;
        setStatus({ type: 'error', message: 'Program oluşturulamadı:', errors: [mapProgramReason(reason)] });
        return;
      }
      const persisted = await persistProgramBlueprint(result.blueprint);
      if (!persisted.valid || !persisted.persisted) {
        const reason = (persisted.reasons && persisted.reasons[0]) || null;
        setStatus({ type: 'error', message: 'Program oluşturulamadı:', errors: [mapProgramReason(reason)] });
        return;
      }
      navigate(`/program-preview/${persisted.programId}`);
    } catch (e) {
      console.error('Generation failed', e);
      setStatus({ type: 'error', message: `İşlem tamamlanamadı: ${e?.message || 'Bilinmeyen hata'}` });
    } finally {
      setIsGenerating(false);
    }
  };

  const onDurationSelect = (val) => {
    if (val === 'custom') set({ sessionDurationMode: 'custom' });
    else set({ sessionDurationMode: 'preset', sessionDurationMinutes: val });
  };
  const durationValue = form.sessionDurationMode === 'custom' ? 'custom' : form.sessionDurationMinutes;

  const handleSave = async () => {
    setStatus({ type: 'checking', message: 'Kontrol ediliyor...' });
    await new Promise((r) => setTimeout(r, 0));
    const { valid, errors } = validateProgramPreferences(form);
    if (!valid) {
      setStatus({ type: 'error', message: 'Eksik bilgiler:', errors });
      scrollToValidation();
      return;
    }
    setSaving(true);
    setStatus({ type: 'checking', message: 'Tercihler kaydediliyor...' });
    try {
      const normalized = normalizeProgramPreferences(form);
      const existing = await trainingProfileRepository.get();
      const record = toPersistedRecord(normalized, existing);
      await trainingProfileRepository.save(record);
      setForm(formFromRecord(record));
      setStatus({ type: 'success', message: 'Program tercihlerin kaydedildi.' });
    } catch (e) {
      console.error('Save failed', e);
      setStatus({ type: 'error', message: `İşlem tamamlanamadı: ${e?.message || 'Bilinmeyen hata'}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Program Oluştur" description="Antrenman tercihlerini belirle." />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  const strengthDayOptions = Array.from({ length: form.daysPerWeek }, (_, i) => i + 1).map((v) => ({ value: v, label: String(v) }));
  const summary = buildSummary(form, { showBoxing, showStrength, isCombined });

  return (
    <div className="space-y-6">
      <PageHeader title="Program Oluştur" description="Antrenman tercihlerini belirle." />

      <Field label="Program Türü">
        <SegmentedOptions options={modeOptions} value={form.programMode} onChange={(v) => set({ programMode: v })} />
      </Field>

      {form.programMode && (
        <>
          <Field label="Program Süresi">
            <SegmentedOptions options={durationOptions} value={form.durationMonths} onChange={(v) => set({ durationMonths: v })} />
          </Field>

          <Field label="Haftada Kaç Gün">
            <SegmentedOptions options={daysOptions} value={form.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} />
          </Field>

          <Field label="Antrenman Günleri">
            <WeekdayPicker selected={form.selectedWeekdays} onChange={(wd) => set({ selectedWeekdays: wd })} expectedCount={form.daysPerWeek} />
          </Field>

          <Field label="Günlük Antrenman Süresi">
            <SegmentedOptions
              options={[...durationPresetOptions, { value: 'custom', label: 'Özel Süre' }]}
              value={durationValue}
              onChange={onDurationSelect}
            />
            {form.sessionDurationMode === 'custom' && (
              <Input
                type="number"
                inputMode="numeric"
                value={form.customMinutes}
                onChange={(e) => set({ customMinutes: e.target.value })}
                placeholder={`${SESSION_DURATION_LIMITS.MIN}–${SESSION_DURATION_LIMITS.MAX} dakika`}
              />
            )}
          </Field>

          <Field label="Deneyim Seviyesi">
            <SegmentedOptions options={experienceOptions} value={form.experienceLevel} onChange={(v) => set({ experienceLevel: v })} />
          </Field>

          <Field label="Yoğunluk">
            <SegmentedOptions options={difficultyOptions} value={form.difficulty} onChange={(v) => set({ difficulty: v })} />
          </Field>

          {showBoxing && (
            <>
              <SectionTitle>Boks Ayarları</SectionTitle>
              <div ref={stanceRef} className={showStanceError ? 'rounded-md border border-destructive/40 p-2 -m-2' : ''}>
                <Field label="Duruş">
                  <SegmentedOptions options={stanceOptions} value={form.boxingStance} onChange={(v) => set({ boxingStance: v })} />
                </Field>
                {showStanceError && (
                  <p className="text-xs text-destructive mt-1">Lütfen boks duruşunuzu seçin.</p>
                )}
              </div>
              <Field label="Maksimum Kombinasyon Uzunluğu">
                <SegmentedOptions options={maxMovesOptions} value={form.boxingMaxMoves} onChange={(v) => set({ boxingMaxMoves: v })} />
              </Field>
            </>
          )}

          {showStrength && (
            <>
              <SectionTitle>Kuvvet Ayarları</SectionTitle>
              {isCombined && (
                <Field label="Haftada Kaç Kuvvet Günü">
                  <SegmentedOptions options={strengthDayOptions} value={form.strengthDaysPerWeek} onChange={(v) => set({ strengthDaysPerWeek: v })} />
                </Field>
              )}
              <Field label="Mevcut Ekipman">
                <EquipmentPicker selected={form.availableEquipment} onChange={(eq) => set({ availableEquipment: eq })} />
              </Field>
            </>
          )}

          <Field label="Tercih Edilen Antrenman Saati (opsiyonel)">
            <Input type="time" value={form.preferredTrainingTime} onChange={(e) => set({ preferredTrainingTime: e.target.value })} />
          </Field>

          {summary.length > 0 && (
            <div className="rounded-md border border-border p-3 space-y-1">
              <SectionTitle>Tercih Özeti</SectionTitle>
              {summary.map((line) => (
                <p key={line.label} className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{line.label}:</span> {line.value}
                </p>
              ))}
              <p className="text-xs text-muted-foreground pt-1">Program henüz oluşturulmadı.</p>
            </div>
          )}

          <div ref={buttonAreaRef} className="space-y-2">
            {status && (
              <div
                className={`rounded-md p-3 text-sm border space-y-1 ${
                  status.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-foreground'
                    : status.type === 'checking'
                    ? 'bg-muted border-border text-muted-foreground'
                    : 'bg-destructive/5 border-destructive/30 text-destructive'
                }`}
              >
                <p className="font-medium">{status.message}</p>
                {status.errors && status.errors.length > 0 && (
                  <ul className="ml-4 list-disc space-y-0.5">
                    {status.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}
            <Button onClick={handleSave} disabled={saving || isGenerating} variant="outline" className="w-full">
              {saving ? 'Kaydediliyor...' : 'Tercihleri Kaydet'}
            </Button>
            <Button onClick={handleGenerate} disabled={isGenerating || saving} className="w-full">
              {isGenerating ? 'Program oluşturuluyor...' : 'Program Oluştur'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function buildSummary(form, { showBoxing, showStrength, isCombined }) {
  if (!form.programMode) return [];
  const lines = [
    { label: 'Program', value: LABELS.programMode[form.programMode] },
    { label: 'Süre', value: LABELS.durationMonths[form.durationMonths] },
    { label: 'Haftalık', value: `${form.daysPerWeek} Gün` },
    { label: 'Günler', value: (form.selectedWeekdays || []).map((d) => LABELS.weekdays[d]).join(', ') || '—' },
    { label: 'Günlük', value: `${resolveMinutes(form)} Dakika` },
    { label: 'Seviye', value: LABELS.experienceLevel[form.experienceLevel] || '—' },
    { label: 'Yoğunluk', value: LABELS.difficulty[form.difficulty] || '—' },
  ];
  if (showBoxing) {
    lines.push({ label: 'Duruş', value: LABELS.boxingStance[form.boxingStance] || '—' });
    lines.push({ label: 'Maksimum Kombinasyon', value: `${form.boxingMaxMoves} Hamle` });
  }
  if (showStrength) {
    const sDays = isCombined ? form.strengthDaysPerWeek : form.daysPerWeek;
    lines.push({ label: 'Kuvvet', value: `Haftada ${sDays} Gün` });
    lines.push({ label: 'Ekipman', value: (form.availableEquipment || []).map((e) => LABELS.equipment[e]).join(', ') || '—' });
  }
  return lines;
}