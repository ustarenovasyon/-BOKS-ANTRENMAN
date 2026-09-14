/**
 * BOXING CONTENT SELECTOR (PART 15)
 * --------------------------------------------------------------
 * Candidate pool yalnız canonical 52. Move order immutable. Slip yok.
 * Controlled repetition (maxConsecutiveSameCombination=2).
 * Primary combo + per-round combo + workingRange. Conditional combo
 * explicit context ile. Yeni combination üretmez.
 * --------------------------------------------------------------
 */
import { BOXING_COMBINATIONS } from '@/features/boxing/combinations/boxingCombinations';
import { BOXING_V2_FOUNDATIONAL_COMBINATIONS } from '@/features/boxing/curriculum/boxingV2FoundationalCombinations';
import { resolveV2ComboLengthPolicy, clipV2TargetRange } from '@/features/boxing/curriculum/boxingV2ComboLengthPolicy';
import { BOXING_INTERVAL_SEGMENT_TYPES, GENERATION_POLICY_VERSIONS } from '@/config/architecture';
import { MAX_CONSECUTIVE_SAME_COMBINATION, MAX_CONSECUTIVE_PRIMARY_REPEAT } from './programGenerationConstants';
import { pickBest, stableHash } from './deterministicSelection';
import { getComboRequiredStage } from '@/features/boxing/curriculum/boxingTechniqueCurriculum';
import { buildV2AttackRoundRolePlan, V2_ATTACK_ROUND_ROLES } from '@/features/boxing/curriculum/boxingV2AttackRoundRolePolicy';

const WORK = BOXING_INTERVAL_SEGMENT_TYPES.WORK;

/**
 * V2 attack selector supported curriculum stages (PART 23 PATCH).
 * Global PART 21 model supports Stage 1–6, but current V2 attack
 * selector contract is validated only for Beginner 1/3/6 month
 * programs which produce Stage 1–4. Stage 5/6 (rhythm/performance)
 * are unsupported until long-duration policy is defined.
 */
const V2_ATTACK_SELECTOR_SUPPORTED_STAGES = Object.freeze([1, 2, 3, 4]);

const V2_VALID_ROLES = Object.freeze(new Set(Object.values(V2_ATTACK_ROUND_ROLES)));

/**
 * V2 curriculum hard-constraint filter (PART 23).
 * combo.requiredStage <= curriculumStage. Unknown movement → excluded (fail-safe).
 * Only called from V2 selector path — never from V1 or audit.
 */
function filterByCurriculumStage(pool, curriculumStage) {
  return pool.filter((c) => {
    const requiredStage = getComboRequiredStage(c.moveIds);
    if (requiredStage === null) return false; // unknown movement → fail-safe
    return requiredStage <= curriculumStage;
  });
}

/** Candidate attack combinations within balanced ceiling + user cap. V1 primitive. */
export function boxingCandidatePool(effectiveComboCeiling, userBoxingMaxMoves) {
  const cap = Math.min(effectiveComboCeiling, userBoxingMaxMoves);
  return BOXING_COMBINATIONS.filter((c) => c.approved && c.active && c.moveCount <= cap && c.allowedWorkingRanges.length > 0);
}

/** V2-only supplemental foundational combo pool (PART 24). V1 never calls this. */
function v2FoundationalPool(effectiveComboCeiling, userBoxingMaxMoves) {
  const cap = Math.min(effectiveComboCeiling, userBoxingMaxMoves);
  return BOXING_V2_FOUNDATIONAL_COMBINATIONS.filter((c) => c.approved && c.active && c.moveCount <= cap && c.allowedWorkingRanges.length > 0);
}

/** Combo için deterministic workingRange. */
export function resolveWorkingRange(combo) {
  if (combo.requiredContext && combo.requiredContext.workingRange) return combo.requiredContext.workingRange;
  if (combo.allowedWorkingRanges.includes('mid')) return 'mid';
  return combo.allowedWorkingRanges[0];
}

/**
 * Per-round combo seçimi. defenseRoundIndex varsa o round defense için ayrılır.
 * focus BOXING_COMPLEXITY ise bir round ceiling'e ulaşmaya çalışır.
 */
export function selectBoxingRounds({ boxingBudget, effectiveComboCeiling, userBoxingMaxMoves, focus, generationSeed, trainingOrdinal, previousPrimaryIds = [], programUsageCount = {}, generationPolicyVersion = GENERATION_POLICY_VERSIONS.V1, curriculumStage = null, durationMonths = null, experienceLevel = null, boxingExposureOrdinal = null, totalBoxingExposures = null }) {
  const isV1 = generationPolicyVersion === GENERATION_POLICY_VERSIONS.V1;
  const isV2 = generationPolicyVersion === GENERATION_POLICY_VERSIONS.V2;

  // Unknown policy → fail-safe (PART 20 security principle at selector level).
  if (!isV1 && !isV2) {
    return { valid: false, reason: 'PROGRAM_UNKNOWN_GENERATION_POLICY' };
  }

  // V2: curriculumStage must be in supported set (1–4), NOT global valid (1–6).
  // Stage 5/6 unsupported until long-duration/rhythm/performance policy is defined.
  if (isV2 && !V2_ATTACK_SELECTOR_SUPPORTED_STAGES.includes(curriculumStage)) {
    return { valid: false, reason: 'PROGRAM_V2_INVALID_CURRICULUM_STAGE' };
  }

  // V2 combo-length policy resolution (PART 25).
  // V1 NEVER resolves length policy — durationMonths/experienceLevel silently ignored.
  const v2LengthPolicy = isV2 ? resolveV2ComboLengthPolicy(durationMonths, experienceLevel) : null;
  if (isV2 && !v2LengthPolicy) {
    return { valid: false, reason: 'PROGRAM_V2_INVALID_LENGTH_POLICY' };
  }
  const rawCap = Math.min(effectiveComboCeiling, userBoxingMaxMoves);
  const v2EffectiveCeiling = isV2 ? Math.min(rawCap, v2LengthPolicy.normalCeiling) : rawCap;
  const v2EffectiveFloor = isV2 ? Math.min(v2LengthPolicy.floor, v2EffectiveCeiling) : null;
  const v2EffectiveTarget = isV2 ? clipV2TargetRange(v2LengthPolicy.targetRange, v2EffectiveFloor, v2EffectiveCeiling) : null;
  const v2SupportMax = isV2 ? Math.min(Math.max(...v2LengthPolicy.supportRange), v2EffectiveCeiling) : null;

  // V2 challenge ceiling (PART 27 §19): min(rawCap, challengeCeiling).
  // Pool is built at challenge ceiling so CHALLENGE role can access long combos.
  // Non-challenge roles filter to their own ranges, so they never see challenge-length combos.
  const v2EffectiveChallengeCeiling = isV2 ? Math.min(rawCap, v2LengthPolicy.challengeCeiling) : null;

  // V2 role plan integration (PART 27): PART 26 planner is SINGLE source of truth.
  const workSegments = boxingBudget.intervalSegments.filter((s) => s.type === WORK);
  let v2RolePlan = null;
  if (isV2) {
    const rolePlanResult = buildV2AttackRoundRolePlan({
      attackRoundCount: workSegments.length,
      durationMonths,
      experienceLevel,
      boxingExposureOrdinal,
      totalBoxingExposures,
    });
    if (!rolePlanResult.valid) {
      return { valid: false, reason: rolePlanResult.reason };
    }
    // Curriculum stage cross-check (PART 27 §7): planner resolves stage via PART 22.
    if (rolePlanResult.currentStage !== curriculumStage) {
      return { valid: false, reason: 'PROGRAM_V2_CURRICULUM_ROLE_STAGE_MISMATCH' };
    }
    v2RolePlan = rolePlanResult.rolePlan;
  }

  // V1: base pool — curriculumStage ALWAYS ignored (no accidental filtering).
  // V2: canonical base + V2 foundational supplemental (capped at challenge ceiling) → HARD curriculum filter.
  const v2PoolCeiling = isV2 ? v2EffectiveChallengeCeiling : effectiveComboCeiling;
  const basePool = boxingCandidatePool(v2PoolCeiling, userBoxingMaxMoves);
  const pool = isV2
    ? filterByCurriculumStage([...basePool, ...v2FoundationalPool(v2PoolCeiling, userBoxingMaxMoves)], curriculumStage)
    : basePool;

  // Empty pool: V2 → curriculum starvation HARD FAIL; V1 → existing behavior.
  if (pool.length === 0) return { valid: false, reason: isV2 ? 'PROGRAM_V2_CURRICULUM_STARVATION' : 'PROGRAM_NO_ELIGIBLE_BOXING_COMBINATION' };
  const rounds = [];
  const usedRecent = [];
  let ceilingReachedThisSession = false;
  for (let ri = 0; ri < workSegments.length; ri++) {
    const seg = workSegments[ri];
    const isFoundationalRound = ri === 0;
    const isComplexityPushRound = focus === 'boxing_complexity' && (ri === 1 || workSegments.length === 1);
    const cap = isV2 ? v2EffectiveCeiling : Math.min(effectiveComboCeiling, userBoxingMaxMoves);
    const foundationalCap = isV2 ? v2SupportMax : Math.min(3, cap);

    // ============================================================
    // POOL CONSTRUCTION
    // V2: role-based (PART 27). V1: index-based (unchanged).
    // ============================================================
    let scoringPool;

    if (isV2) {
      // V2 role-based pool construction (PART 27)
      const roundRole = v2RolePlan[ri];
      if (!V2_VALID_ROLES.has(roundRole)) {
        return { valid: false, reason: 'PROGRAM_V2_INVALID_ROUND_ROLE' };
      }

      if (roundRole === V2_ATTACK_ROUND_ROLES.FOUNDATIONAL || roundRole === V2_ATTACK_ROUND_ROLES.SUPPORT) {
        // FOUNDATIONAL / SUPPORT → supportRange (PART 27 §11–14)
        const supportPool = pool.filter((c) => v2LengthPolicy.supportRange.includes(c.moveCount));
        if (supportPool.length === 0) {
          return { valid: false, reason: roundRole === V2_ATTACK_ROUND_ROLES.FOUNDATIONAL
            ? 'PROGRAM_V2_FOUNDATIONAL_ROLE_STARVATION'
            : 'PROGRAM_V2_SUPPORT_ROLE_STARVATION' };
        }
        const dupSafe = supportPool.filter((c) => countTrailingSame(usedRecent, c.id) < MAX_CONSECUTIVE_SAME_COMBINATION);
        scoringPool = dupSafe.length > 0 ? dupSafe : supportPool;
      } else if (roundRole === V2_ATTACK_ROUND_ROLES.CHALLENGE) {
        // CHALLENGE → highest safe candidate ≤ challenge ceiling (PART 27 §18–24)
        const challengePool = pool.filter((c) => c.moveCount <= v2EffectiveChallengeCeiling);
        if (challengePool.length === 0) {
          return { valid: false, reason: 'PROGRAM_V2_CHALLENGE_ROLE_STARVATION' };
        }
        const maxMoveCount = challengePool.reduce((mx, c) => Math.max(mx, c.moveCount), 0);
        const ceilingPool = challengePool.filter((c) => c.moveCount === maxMoveCount);
        const dupSafe = ceilingPool.filter((c) => countTrailingSame(usedRecent, c.id) < MAX_CONSECUTIVE_SAME_COMBINATION);
        scoringPool = dupSafe.length > 0 ? dupSafe : ceilingPool;
      } else {
        // MAIN (PART 27 §15–17)
        if (isComplexityPushRound) {
          // MAIN + legacy complexity-push → normal ceiling, prefer ceiling (max v2EffectiveCeiling)
          const pushPool = pool.filter((c) => c.moveCount <= v2EffectiveCeiling);
          const basePool = pushPool.length > 0 ? pushPool : pool;
          const dupSafe = basePool.filter((c) => countTrailingSame(usedRecent, c.id) < MAX_CONSECUTIVE_SAME_COMBINATION);
          scoringPool = dupSafe.length > 0 ? dupSafe : basePool;
        } else {
          // MAIN ordinary → targetRange (structural, PART 25 PATCH)
          const normalPool = pool.filter((c) => c.moveCount >= v2EffectiveFloor && c.moveCount <= v2EffectiveCeiling);
          const basePool = normalPool.length > 0 ? normalPool : pool;
          const dupSafe = basePool.filter((c) => countTrailingSame(usedRecent, c.id) < MAX_CONSECUTIVE_SAME_COMBINATION);
          const selectionBase = dupSafe.length > 0 ? dupSafe : basePool;
          const targetPool = selectionBase.filter((c) => v2EffectiveTarget.includes(c.moveCount));
          scoringPool = targetPool.length > 0 ? targetPool : selectionBase;
        }
      }
    } else {
      // V1 pool construction (unchanged)
      let roundPool = pool;
      if (isFoundationalRound) {
        roundPool = pool.filter((c) => c.moveCount <= foundationalCap);
        if (roundPool.length === 0) roundPool = pool;
      } else if (!isComplexityPushRound) {
        const lengthFloor = Math.max(2, Math.round(cap * 0.7));
        roundPool = pool.filter((c) => c.moveCount >= lengthFloor && c.moveCount <= cap);
        if (roundPool.length === 0) roundPool = pool;
      }
      scoringPool = roundPool;
    }

    // ============================================================
    // SCORING
    // V2: role-aware length scoring. V1: unchanged.
    // ============================================================
    const scored = scoringPool.map((c) => {
      let score = 0;
      // --- Same-session repetition ---
      const consecutiveCount = countTrailingSame(usedRecent, c.id);
      if (consecutiveCount >= MAX_CONSECUTIVE_SAME_COMBINATION) score += 1000;
      if (usedRecent.length > 0 && usedRecent[usedRecent.length - 1] === c.id) score += 50;
      const sessionUseCount = usedRecent.filter((id) => id === c.id).length;
      score += sessionUseCount * 15;
      // --- Cross-session primary repeat (ALL rounds) ---
      const trailingPrimary = countTrailingSame(previousPrimaryIds, c.id);
      if (trailingPrimary >= MAX_CONSECUTIVE_PRIMARY_REPEAT) score += 200;
      // --- Program-wide usage diversity ---
      const totalUsage = programUsageCount[c.id] || 0;
      score += totalUsage * 8;

      if (isV2) {
        // V2 role-based length scoring
        const roundRole = v2RolePlan[ri];
        if (roundRole === V2_ATTACK_ROUND_ROLES.FOUNDATIONAL || roundRole === V2_ATTACK_ROUND_ROLES.SUPPORT) {
          // Prefer shorter within supportRange
          score += c.moveCount * 3;
        } else if (roundRole === V2_ATTACK_ROUND_ROLES.MAIN && isComplexityPushRound) {
          // MAIN + complexity-push: prefer ceiling
          if (c.moveCount === v2EffectiveCeiling) score -= 30;
          score -= c.moveCount;
        }
        // CHALLENGE and MAIN ordinary: no additional length scoring (pool already structurally filtered)
      } else {
        // V1 length scoring (unchanged)
        if (isFoundationalRound) {
          if (c.moveCount <= foundationalCap) score -= 20;
          score += c.moveCount;
        }
        if (!isFoundationalRound && !isComplexityPushRound) {
          score += (cap - c.moveCount) * 3;
          if (cap > 2 && c.moveCount === cap && !ceilingReachedThisSession) {
            score -= 25;
          } else if (cap > 2 && c.moveCount === cap - 1 && c.moveCount > 2) {
            score -= 8;
          }
        }
        if (isComplexityPushRound) {
          if (c.moveCount === cap) score -= 30;
          score -= c.moveCount;
        }
      }
      return { c, score };
    });
    const candidates = scored.map((s) => s.c);
    const scoreFn = (c) => scored.find((s) => s.c === c).score;
    const chosen = pickBest(candidates, scoreFn, generationSeed, trainingOrdinal, ri, 'boxing');
    rounds.push({
      roundIndex: ri,
      combinationId: chosen.id,
      moveIds: chosen.moveIds.slice(),
      moveCount: chosen.moveCount,
      workingRange: resolveWorkingRange(chosen),
      requiredContext: { ...chosen.requiredContext },
      plannedSeconds: seg.durationSeconds,
      ...(isV2 ? { attackRoundRole: v2RolePlan[ri] } : {}),
    });
    usedRecent.push(chosen.id);
    if (chosen.moveCount === cap) ceilingReachedThisSession = true;
  }
  const primaryCombinationId = rounds.length > 0 ? rounds[0].combinationId : null;
  return { valid: true, rounds, primaryCombinationId };
}

function countTrailingSame(arr, id) {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] === id) n += 1; else break;
  }
  return n;
}