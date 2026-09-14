/**
 * WORKOUT BLOCK BUILDER (PART 15)
 * --------------------------------------------------------------
 * ProgramDay içinde ordered WorkoutBlocks. Block order role'e göre.
 * Her block plannedSeconds. Exact day total = sessionDuration*60.
 * Kg/image/timer YOK. Yalnız plan içerik.
 * --------------------------------------------------------------
 */
import { WORKOUT_BLOCK_TYPES, WEEKLY_SESSION_ROLES } from '@/config/architecture';

let orderCounter = 0;
function newBlock(programDayId, type, plannedSeconds, content = {}) {
  const block = {
    id: `WKB_${programDayId}_${orderCounter}`,
    programDayId,
    orderIndex: orderCounter,
    type,
    plannedSeconds,
    ...content,
  };
  orderCounter += 1;
  return block;
}

/**
 * Build blocks for a day. boxingRounds: [{combinationId,moveIds,moveCount,workingRange,requiredContext,plannedSeconds,roundIndex}].
 * defenseBlock: {defenseRuleId,...,plannedSeconds} or null (replaces one attack round slot).
 * strengthPrescriptions: [{exerciseId,...,plannedBlockSeconds}] or null.
 */
export function buildDayBlocks({ programDayId, role, budget, boxingRounds = [], defenseRound = null, strengthPrescriptions = null, footworkTechnique = null }) {
  orderCounter = 0;
  const blocks = [];
  const b = budget.blocks;

  blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.WARMUP, b.warmupSeconds, { label: 'Isınma' }));

  // PART 34: dormant V2 isolated-learning block. Generator V1 passes null.
  if (footworkTechnique) {
    blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE, footworkTechnique.plannedSeconds, {
      footworkMoveId: footworkTechnique.footworkMoveId,
    }));
  }

  // Boxing interval: iterate boxingBudget intervalSegments in order; WORK segments → attack/defense, REST → rest.
  if (b.boxingSeconds > 0) {
    const segments = budget.boxingBudget.intervalSegments;
    let workRoundIdx = 0;
    for (const seg of segments) {
      if (seg.type === 'rest') {
        blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.BOXING_REST, seg.durationSeconds, { roundIndex: seg.roundIndex }));
      } else {
        // WORK
        if (defenseRound && defenseRound.roundIndex === workRoundIdx) {
          blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK, seg.durationSeconds, {
            roundIndex: workRoundIdx,
            defenseRuleId: defenseRound.defenseRuleId,
            incomingThreatType: defenseRound.incomingThreatType,
            defenseMoveId: defenseRound.defenseMoveId,
            counterMoveIds: defenseRound.counterMoveIds.slice(),
            opponentStanceRelation: defenseRound.opponentStanceRelation,
            workingRange: defenseRound.workingRange,
          }));
        } else {
          const round = boxingRounds[workRoundIdx] || boxingRounds[0];
          if (round) {
            blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK, seg.durationSeconds, {
              roundIndex: workRoundIdx,
              combinationId: round.combinationId,
              moveIds: round.moveIds.slice(),
              moveCount: round.moveCount,
              workingRange: round.workingRange,
              requiredContext: { ...round.requiredContext },
            }));
          } else {
            blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK, seg.durationSeconds, { roundIndex: workRoundIdx }));
          }
        }
        workRoundIdx += 1;
      }
    }
  }

  if (role === WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY) {
    blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.MODE_TRANSITION, b.transitionSeconds, { label: 'Boks → Kuvvet Geçişi' }));
  }

  if (strengthPrescriptions) {
    for (const pres of strengthPrescriptions) {
      blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE, pres.plannedBlockSeconds, pres));
    }
  }

  blocks.push(newBlock(programDayId, WORKOUT_BLOCK_TYPES.COOLDOWN, b.cooldownSeconds, { label: 'Soğuma / Toparlanma' }));

  return blocks;
}