/**
 * PROGRAM PREVIEW VIEW MODEL (PART 16)
 * --------------------------------------------------------------
 * Persisted entity'leri read-only olarak gruplar + summary türetir.
 * İçerik REGENERATE ETMEZ. Sadece group/format/derive.
 * Source ID'ler (programId/versionId/dayId/blockId) korunur.
 * --------------------------------------------------------------
 */
import { WEEKLY_SESSION_ROLES, WORKOUT_BLOCK_TYPES } from '@/config/architecture';

const ROLE_BOXING = WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY;
const ROLE_STRENGTH = WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY;
const ROLE_COMBINED = WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY;

/**
 * days: sorted by trainingOrdinal (caller ensures).
 * blocksByDay: Map<programDayId, WorkoutBlock[] (sorted orderIndex)>.
 */
export function buildProgramPreviewViewModel({ program, version, sortedDays, blocksByDay }) {
  // Month → Week grouping (source: ProgramDay metadata, regenerate YOK).
  const monthMap = new Map();
  for (const day of sortedDays) {
    const mi = day.programMonthIndex || 1;
    if (!monthMap.has(mi)) monthMap.set(mi, new Map());
    const weekMap = monthMap.get(mi);
    const wi = day.programWeekIndex || 1;
    if (!weekMap.has(wi)) weekMap.set(wi, []);
    weekMap.get(wi).push(day);
  }
  const months = [...monthMap.keys()].sort((a, b) => a - b).map((mi) => {
    const weekMap = monthMap.get(mi);
    const weeks = [...weekMap.keys()].sort((a, b) => a - b).map((wi) => ({
      weekIndex: wi,
      days: weekMap.get(wi),
    }));
    return { monthIndex: mi, weeks };
  });

  // Summary counts (derived from persisted days/blocks).
  const boxingDays = sortedDays.filter((d) => d.sessionRole === ROLE_BOXING || d.sessionRole === ROLE_COMBINED).length;
  const strengthDays = sortedDays.filter((d) => d.sessionRole === ROLE_STRENGTH || d.sessionRole === ROLE_COMBINED).length;
  let defenseDays = 0;
  let totalBlocks = 0;
  for (const day of sortedDays) {
    if (day.defenseEligible) defenseDays += 1;
    const bs = blocksByDay.get(day.id) || [];
    totalBlocks += bs.length;
  }
  const lastScheduledDate = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1].plannedDate : version.programStartDate;

  return {
    programId: program.id,
    programVersionId: version.id,
    blueprintFingerprint: version.blueprintFingerprint,
    program,
    version,
    months,
    summary: {
      totalSessions: sortedDays.length,
      totalBlocks,
      boxingDays,
      strengthDays,
      defenseDays,
      lastScheduledDate,
    },
  };
}

/** Block'u display için sadeleştir (source mutate YOK). */
export function deriveBlockView(block) {
  return { ...block };
}

export const BLOCK_TYPE = WORKOUT_BLOCK_TYPES;