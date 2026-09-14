/**
 * PROGRAM GENERATION SABİTLERİ (PART 15)
 * --------------------------------------------------------------
 * Block types, reason/warning codes, rep/hold target tier başına.
 * Tüm değerler PART 13 envelope içindedir. Kg YOK.
 * --------------------------------------------------------------
 */
import { WORKOUT_BLOCK_TYPES, PROGRAM_GENERATION_REASON_CODES, PROGRAM_GENERATION_WARNING_CODES, PLANNING_SECONDS_PER_REP, MIN_INTERSET_REST_SECONDS } from '@/config/architecture';

export { WORKOUT_BLOCK_TYPES, PROGRAM_GENERATION_REASON_CODES, PROGRAM_GENERATION_WARNING_CODES, PLANNING_SECONDS_PER_REP, MIN_INTERSET_REST_SECONDS };

/** Tier başına preferred rep target (PART 13 repRange içinde). */
export const REP_TARGETS = Object.freeze({ tier_1: 8, tier_2: 10, tier_3: 10, tier_4: 12 });
/** Tier başına preferred hold target (PART 13 holdRangeSeconds içinde). */
export const HOLD_TARGETS = Object.freeze({ tier_1: 25, tier_2: 30, tier_3: 40, tier_4: 45 });

export const MAX_CONSECUTIVE_SAME_COMBINATION = 2;
export const MAX_CONSECUTIVE_PRIMARY_REPEAT = 2;
export const MAX_CONSECUTIVE_TEMPLATE_REPEAT = 3;