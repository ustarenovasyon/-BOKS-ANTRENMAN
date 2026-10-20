import { EXPERIENCE_LEVELS } from '@/config/architecture';

// Design target. Production duration/version gates are separate.
export const TARGET_PROGRAM_DURATIONS = Object.freeze([1, 3, 6, 9, 12, 15, 18, 24]);

const MAX_STAGES = Object.freeze({
  beginner: Object.freeze({1: 2, 3: 3, 6: 4, 9: 4, 12: 5, 15: 5, 18: 5, 24: 6}),
  intermediate: Object.freeze({1: 3, 3: 4, 6: 4, 9: 5, 12: 5, 15: 5, 18: 6, 24: 6}),
  experienced: Object.freeze({1: 4, 3: 4, 6: 5, 9: 5, 12: 6, 15: 6, 18: 6, 24: 6}),
});
const START_STAGES = Object.freeze({beginner: 1, intermediate: 2, experienced: 3});

export function getTimelineMaxStage(durationMonths, experienceLevel) {
  if (!TARGET_PROGRAM_DURATIONS.includes(durationMonths)) return null;
  if (!Object.values(EXPERIENCE_LEVELS).includes(experienceLevel)) return null;
  return MAX_STAGES[experienceLevel][durationMonths] ?? null;
}

/** Integer boundaries; every reachable stage receives at least one exposure. */
export function buildExtendedTimeline(durationMonths, experienceLevel, total) {
  const maxStage = getTimelineMaxStage(durationMonths, experienceLevel);
  if (!maxStage || !Number.isInteger(total) || total < 1) return null;
  const startStage = START_STAGES[experienceLevel];
  // Beginner 1/3/6 retains its exact legacy boundary implementation.
  const endMonths = experienceLevel === EXPERIENCE_LEVELS.BEGINNER
    ? [0, 0, 2, 4, 9, 18]
    : experienceLevel === EXPERIENCE_LEVELS.INTERMEDIATE
      ? [0, 0, durationMonths / 6, durationMonths / 3, durationMonths * 2 / 3, durationMonths * 5 / 6]
      : [0, 0, 0, durationMonths / 4, durationMonths / 2, durationMonths * 3 / 4];
  const segments = [];
  let end = 0;
  for (let stage = startStage; stage <= maxStage && end < total; stage++) {
    const start = end + 1;
    const target = stage === maxStage ? total
      : stage === 1 ? 2 : Math.floor(total * endMonths[stage] / durationMonths);
    end = Math.min(total, Math.max(start, target));
    segments.push(Object.freeze({stage, start, end}));
  }
  return Object.freeze({maxStage, startStage, segments: Object.freeze(segments)});
}

export function resolveTrainingCycle({durationMonths, programWeekIndex, stage = 1} = {}) {
  if (!TARGET_PROGRAM_DURATIONS.includes(durationMonths) || !Number.isInteger(programWeekIndex) || programWeekIndex < 1) return null;
  // A fourth-week recovery changes intensity and task difficulty, never total time.
  const recovery = durationMonths >= 9 && programWeekIndex % 4 === 0;
  const objectives = stage >= 6
    ? ['controlled_repetition', 'defense_counter', 'distance_control', 'rhythm_change']
    : stage >= 5 ? ['rhythm_change', 'distance_control', 'defense_counter', 'controlled_repetition']
      : ['controlled_repetition', 'distance_control', 'guard_return'];
  return Object.freeze({
    recovery,
    objective: recovery ? 'technical_recovery' : objectives[(programWeekIndex - 1) % objectives.length],
    workSecondsCap: recovery ? 60 : 120,
    comboCeiling: recovery ? 3 : 7,
    effortCue: recovery ? 'Rahat tempoda teknik tekrar; zorlanmayı azalt.' : 'Kontrolü koru; hız ve gücü kendi sınırına göre ayarla.',
  });
}
