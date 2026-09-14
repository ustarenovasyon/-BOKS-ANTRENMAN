import { PROGRAM_MODES, SESSION_DURATION_LIMITS } from '@/config/architecture';

/**
 * Session-duration product policy.
 * Lower-level consumers must use this helper instead of duplicating mode-specific minute limits.
 */
export const COMBINED_MIN_SESSION_MINUTES = 30;

export function minimumSessionMinutesForMode(programMode) {
  return programMode === PROGRAM_MODES.BOXING_AND_STRENGTH
    ? COMBINED_MIN_SESSION_MINUTES
    : SESSION_DURATION_LIMITS.MIN;
}
