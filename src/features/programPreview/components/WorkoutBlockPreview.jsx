/**
 * WORKOUT BLOCK PREVIEW (PART 16)
 * --------------------------------------------------------------
 * Tek blok render. Block tipine göre switch. Source mutate YOK.
 * KG YOK. Move-by-move highlight YOK. Combo text wrap doğal.
 * Internal 3 sec/rep KULLANICIVA GÖSTERİLMEZ.
 * --------------------------------------------------------------
 */
import React from 'react';
import { BOXING_MOVES } from '@/features/boxing/library/boxingMoves';
import { STRENGTH_EXERCISES } from '@/features/strength/library/strengthExercises';
import { WORKOUT_BLOCK_TYPES } from '@/config/architecture';
import { formatSeconds, THREAT_LABELS, RANGE_LABELS } from '../previewLabels';

const MOVE_NAME_BY_ID = Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m.canonicalName]));
const EX_NAME_BY_ID = Object.fromEntries(STRENGTH_EXERCISES.map((e) => [e.id, e.displayName]));

function moveName(id) {
  return MOVE_NAME_BY_ID[id] || id;
}
function exName(id) {
  return EX_NAME_BY_ID[id] || id;
}

function Duration({ seconds }) {
  return <span className="text-muted-foreground">{formatSeconds(seconds)}</span>;
}

function Row({ label, children, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className={strong ? 'text-foreground font-medium' : 'text-muted-foreground'}>{label}</span>
      <span className="text-sm text-foreground text-right">{children}</span>
    </div>
  );
}

function renderRestArray(restArr) {
  if (!Array.isArray(restArr) || restArr.length === 0) return null;
  const allEqual = restArr.every((r) => r === restArr[0]);
  if (allEqual) {
    return <span className="text-muted-foreground">{restArr[0]} sn</span>;
  }
  return (
    <span className="text-muted-foreground text-right">
      {restArr.map((r, i) => (
        <span key={i} className="block">
          Set {i + 1} sonrası: {r} sn
        </span>
      ))}
    </span>
  );
}

export default function WorkoutBlockPreview({ block }) {
  switch (block.type) {
    case WORKOUT_BLOCK_TYPES.WARMUP:
      return <Row label="Isınma"><Duration seconds={block.plannedSeconds} /></Row>;
    case WORKOUT_BLOCK_TYPES.COOLDOWN:
      return <Row label="Soğuma / Toparlanma"><Duration seconds={block.plannedSeconds} /></Row>;
    case WORKOUT_BLOCK_TYPES.BOXING_REST:
      return <Row label="Dinlenme"><Duration seconds={block.plannedSeconds} /></Row>;
    case WORKOUT_BLOCK_TYPES.MODE_TRANSITION:
      return <Row label="Boks → Kuvvet Geçişi"><Duration seconds={block.plannedSeconds} /></Row>;
    case WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK:
      return <BoxingAttack block={block} />;
    case WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK:
      return <BoxingDefense block={block} />;
    case WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE:
      return <StrengthBlock block={block} />;
    default:
      return <Row label="Bilinmeyen blok">—</Row>;
  }
}

function BoxingAttack({ block }) {
  const seq = (block.moveIds || []).map(moveName).join(' → ');
  return (
    <div className="py-1 space-y-1">
      <Row label={`Round ${(block.roundIndex ?? 0) + 1}`} strong>
        <Duration seconds={block.plannedSeconds} />
      </Row>
      <p className="text-sm text-foreground break-words leading-relaxed">{seq}</p>
      {block.workingRange && (
        <p className="text-xs text-muted-foreground">Mesafe: {RANGE_LABELS[block.workingRange] || block.workingRange}</p>
      )}
    </div>
  );
}

function BoxingDefense({ block }) {
  const threat = THREAT_LABELS[block.incomingThreatType] || block.incomingThreatType || '—';
  const slip = moveName(block.defenseMoveId);
  const counters = (block.counterMoveIds || []).map(moveName).join(' → ');
  return (
    <div className="py-1 space-y-1">
      <Row label="Savunma + Kontra" strong>
        <Duration seconds={block.plannedSeconds} />
      </Row>
      <p className="text-xs text-muted-foreground">Tehdit: {threat}</p>
      <p className="text-sm text-foreground break-words leading-relaxed">{slip} → {counters}</p>
      {block.workingRange && (
        <p className="text-xs text-muted-foreground">Mesafe: {RANGE_LABELS[block.workingRange] || block.workingRange}</p>
      )}
    </div>
  );
}

function StrengthBlock({ block }) {
  const name = exName(block.exerciseId);
  const sets = block.setCount;
  const isTime = block.prescriptionType === 'time';
  let presText = '';
  if (isTime) {
    const per = block.holdSecondsPerSide ?? block.holdSecondsPerSet;
    const suffix = block.bothSidesRequired ? ' / her taraf' : '';
    presText = `${sets} × ${per} sn${suffix}`;
  } else {
    const per = block.repsPerSide ?? block.repsPerSet;
    const suffix = block.bothSidesRequired ? ' / her taraf' : '';
    presText = `${sets} × ${per}${suffix}`;
  }
  return (
    <div className="py-1 space-y-1">
      <Row label={name} strong>
        <span className="text-sm text-foreground">{presText}</span>
      </Row>
      {Array.isArray(block.interSetRestSeconds) && block.interSetRestSeconds.length > 0 && (
        <Row label="Set arası">{renderRestArray(block.interSetRestSeconds)}</Row>
      )}
      {block.transitionAfterExerciseSeconds > 0 && (
        <Row label="Hareket geçişi"><Duration seconds={block.transitionAfterExerciseSeconds} /></Row>
      )}
      {block.templateId && (
        <p className="text-xs text-muted-foreground">Kuvvet iskeleti: {block.templateId}</p>
      )}
    </div>
  );
}