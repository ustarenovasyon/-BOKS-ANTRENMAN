/**
 * BOXING INTERVAL BUDGET (PART 12)
 * --------------------------------------------------------------
 * boxingSeconds → WORK/REST segmentlerine exact bölünür.
 * Move-by-move timing YOK. Combination seçmez.
 * Son round sonrası zorunlu rest yok; residual kaybolmaz.
 * --------------------------------------------------------------
 */
import { BOXING_INTERVAL_SEGMENT_TYPES } from '@/config/architecture';
import { BOXING_WORK_SECONDS, BOXING_REST_SECONDS } from './sessionBudgetConstants';

const WORK = BOXING_INTERVAL_SEGMENT_TYPES.WORK;
const REST = BOXING_INTERVAL_SEGMENT_TYPES.REST;

/**
 * Pure packer. boxingSeconds tam olarak tüketilir.
 */
export function buildBoxingIntervalBudget(boxingSeconds, experienceLevel, difficulty, options = {}) {
  // PART 13: progression target work seconds opsiyonel override (cap caller'da).
  // Default: PART 12 davranışı korunur (geriye uyumlu).
  const override = options && Number.isFinite(options.workSecondsOverride) && options.workSecondsOverride > 0
    ? Math.floor(options.workSecondsOverride)
    : null;
  const workSecondsPerFullRound = override !== null ? override : (BOXING_WORK_SECONDS[experienceLevel] || 0);
  const restSecondsPerFullRecovery = BOXING_REST_SECONDS[difficulty] || 0;
  const segments = [];

  if (boxingSeconds > 0 && workSecondsPerFullRound > 0) {
    const fullRound = workSecondsPerFullRound + restSecondsPerFullRecovery;
    let numFull = 0;
    let residual = boxingSeconds;
    if (fullRound > 0) {
      numFull = Math.floor(boxingSeconds / fullRound);
      residual = boxingSeconds - numFull * fullRound;
    }
    let roundIndex = 0;
    for (let i = 0; i < numFull; i++) {
      segments.push({ type: WORK, roundIndex, durationSeconds: workSecondsPerFullRound });
      segments.push({ type: REST, roundIndex, durationSeconds: restSecondsPerFullRecovery });
      roundIndex += 1;
    }
    if (residual > 0) {
      if (residual >= 30) {
        segments.push({ type: WORK, roundIndex, durationSeconds: residual });
      } else {
        // 1–29 sn residual: son WORK segmentine absorbe et (negatif yok).
        let absorbed = false;
        for (let i = segments.length - 1; i >= 0; i--) {
          if (segments[i].type === WORK) {
            segments[i].durationSeconds += residual;
            absorbed = true;
            break;
          }
        }
        if (!absorbed) {
          segments.push({ type: WORK, roundIndex, durationSeconds: residual });
        }
      }
    }
  }

  const totalWorkSeconds = segments.filter((s) => s.type === WORK).reduce((a, s) => a + s.durationSeconds, 0);
  const totalRestSeconds = segments.filter((s) => s.type === REST).reduce((a, s) => a + s.durationSeconds, 0);

  return {
    workSecondsPerFullRound,
    restSecondsPerFullRecovery,
    intervalSegments: segments,
    plannedWorkRoundCount: segments.filter((s) => s.type === WORK).length,
    totalWorkSeconds,
    totalRestSeconds,
  };
}