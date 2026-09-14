/**
 * PROGRAM AUDIT ENGINE SABİTLERİ (PART 17)
 * --------------------------------------------------------------
 * Deterministic local audit engine. AI/remote YOK. Generator ÇAĞRILMAZ.
 * LOCAL_PROGRAM_AUDIT_ENGINE_VERSION != DB schema version (DB stays v2).
 * --------------------------------------------------------------
 */
import { STRENGTH_MOVEMENT_PATTERNS } from '@/config/architecture';

export const LOCAL_PROGRAM_AUDIT_ENGINE_VERSION = 1;

export const PROGRAM_AUDIT_OUTCOMES = Object.freeze({
  PASS: 'pass',
  FAIL: 'fail',
});

export const AUDIT_FINDING_SEVERITIES = Object.freeze({
  CRITICAL: 'critical',
  WARNING: 'warning',
});

export const AUDIT_CHECK_CATEGORIES = Object.freeze({
  IDENTITY: 'identity',
  CALENDAR: 'calendar',
  TIME_BUDGET: 'time_budget',
  PROGRESSION: 'progression',
  WEEKLY_BALANCE: 'weekly_balance',
  BOXING: 'boxing',
  DEFENSE: 'defense',
  STRENGTH: 'strength',
  COVERAGE: 'coverage',
  REPETITION: 'repetition',
  POLICY: 'policy',
});

/** Kritik reason kodları (FAIL üretir). */
export const AUDIT_REASON_CODES = Object.freeze({
  AUDIT_PROGRAM_NOT_FOUND: 'audit_program_not_found',
  AUDIT_VERSION_NOT_FOUND: 'audit_version_not_found',
  AUDIT_VERSION_RELATION_MISMATCH: 'audit_version_relation_mismatch',
  AUDIT_INVALID_SETTINGS_SNAPSHOT: 'audit_invalid_settings_snapshot',
  AUDIT_ENGINE_VERSION_INCOMPATIBLE: 'audit_engine_version_incompatible',
  AUDIT_INPUT_FINGERPRINT_MISMATCH: 'audit_input_fingerprint_mismatch',
  AUDIT_DAY_COUNT_MISMATCH: 'audit_day_count_mismatch',
  AUDIT_ORDINAL_INVALID: 'audit_ordinal_invalid',
  AUDIT_DATE_ORDER_INVALID: 'audit_date_order_invalid',
  AUDIT_DATE_OUT_OF_RANGE: 'audit_date_out_of_range',
  AUDIT_WEEKDAY_INVALID: 'audit_weekday_invalid',
  AUDIT_CALENDAR_DURATION_MISMATCH: 'audit_calendar_duration_mismatch',
  AUDIT_SESSION_DURATION_MISMATCH: 'audit_session_duration_mismatch',
  AUDIT_BUDGET_SNAPSHOT_MISMATCH: 'audit_budget_snapshot_mismatch',
  AUDIT_DAY_TIME_MISMATCH: 'audit_day_time_mismatch',
  AUDIT_BLOCK_ORDER_INVALID: 'audit_block_order_invalid',
  AUDIT_ROLE_COMPOSITION_INVALID: 'audit_role_composition_invalid',
  AUDIT_PROGRESSION_MISMATCH: 'audit_progression_mismatch',
  AUDIT_WEEKLY_ROLE_MISMATCH: 'audit_weekly_role_mismatch',
  AUDIT_BALANCED_CAP_MISMATCH: 'audit_balanced_cap_mismatch',
  AUDIT_MULTIPLE_PROGRESSION_PUSH: 'audit_multiple_progression_push',
  AUDIT_UNKNOWN_BOXING_COMBINATION: 'audit_unknown_boxing_combination',
  AUDIT_BOXING_MOVE_ORDER_MISMATCH: 'audit_boxing_move_order_mismatch',
  AUDIT_SLIP_IN_ATTACK: 'audit_slip_in_attack',
  AUDIT_BOXING_COMBO_CAP_EXCEEDED: 'audit_boxing_combo_cap_exceeded',
  AUDIT_BOXING_TRANSITION_INVALID: 'audit_boxing_transition_invalid',
  AUDIT_BOXING_CONTEXT_INVALID: 'audit_boxing_context_invalid',
  AUDIT_FOOTWORK_TECHNIQUE_INVALID: 'audit_footwork_technique_invalid',
  AUDIT_BOXING_INTERVAL_MISMATCH: 'audit_boxing_interval_mismatch',
  AUDIT_EXCESSIVE_CONSECUTIVE_ATTACK_COMBO: 'audit_excessive_consecutive_attack_combo',
  AUDIT_DEFENSE_UNAUTHORIZED: 'audit_defense_unauthorized',
  AUDIT_DEFENSE_COUNT_MISMATCH: 'audit_defense_count_mismatch',
  AUDIT_DEFENSE_RULE_INVALID: 'audit_defense_rule_invalid',
  AUDIT_DEFENSE_CONTENT_MISMATCH: 'audit_defense_content_mismatch',
  AUDIT_STRENGTH_TEMPLATE_INVALID: 'audit_strength_template_invalid',
  AUDIT_STRENGTH_EQUIPMENT_INVALID: 'audit_strength_equipment_invalid',
  AUDIT_STRENGTH_MOVEMENT_CAP_EXCEEDED: 'audit_strength_movement_cap_exceeded',
  AUDIT_STRENGTH_TEMPLATE_ORDER_MISMATCH: 'audit_strength_template_order_mismatch',
  AUDIT_STRENGTH_CONSTITUTION_FAILED: 'audit_strength_constitution_failed',
  AUDIT_STRENGTH_SET_COUNT_INVALID: 'audit_strength_set_count_invalid',
  AUDIT_STRENGTH_REP_INVALID: 'audit_strength_rep_invalid',
  AUDIT_STRENGTH_HOLD_INVALID: 'audit_strength_hold_invalid',
  AUDIT_UNILATERAL_SEMANTICS_INVALID: 'audit_unilateral_semantics_invalid',
  AUDIT_STRENGTH_WORK_BUDGET_MISMATCH: 'audit_strength_work_budget_mismatch',
  AUDIT_STRENGTH_RECOVERY_BUDGET_MISMATCH: 'audit_strength_recovery_budget_mismatch',
  AUDIT_STRENGTH_REST_TOO_SHORT: 'audit_strength_rest_too_short',
  AUDIT_STRENGTH_TRANSITION_BUDGET_MISMATCH: 'audit_strength_transition_budget_mismatch',
  AUDIT_STRENGTH_TOTAL_MISMATCH: 'audit_strength_total_mismatch',
  AUDIT_FORBIDDEN_LOAD_PRESCRIPTION: 'audit_forbidden_load_prescription',
  AUDIT_FULL_PATTERN_COVERAGE_MISSED: 'audit_full_pattern_coverage_missed',
  AUDIT_ROLLING_PATTERN_COVERAGE_MISSED: 'audit_rolling_pattern_coverage_missed',
  AUDIT_PROGRAM_CHANGED_DURING_AUDIT: 'audit_program_changed_during_audit',
  AUDIT_MUTATED_BLUEPRINT: 'audit_mutated_blueprint',
  AUDIT_ENGINE_ERROR: 'audit_engine_error',
  AUDIT_UNSUPPORTED_GENERATION_POLICY_VERSION: 'audit_unsupported_generation_policy_version',
});

/** Warning kodları (PASS'i bozmaz). */
export const AUDIT_WARNING_CODES = Object.freeze({
  AUDIT_ADJACENT_STRENGTH_DAYS_UNAVOIDABLE: 'audit_adjacent_strength_days_unavoidable',
  AUDIT_HIGH_CONSECUTIVE_TRAINING_DENSITY: 'audit_high_consecutive_training_density',
  AUDIT_NO_UNSCHEDULED_WEEKDAY_GAP: 'audit_no_unscheduled_weekday_gap',
  AUDIT_FIRST_ATTACK_ROUND_COMPLEX: 'audit_first_attack_round_complex',
  AUDIT_DEFENSE_DISTRIBUTION_IMBALANCED: 'audit_defense_distribution_imbalanced',
  AUDIT_FULL_PATTERN_COVERAGE_LIMITED: 'audit_full_pattern_coverage_limited',
  AUDIT_ROLLING_PATTERN_COVERAGE_LIMITED: 'audit_rolling_pattern_coverage_limited',
  AUDIT_EXCESSIVE_TEMPLATE_REPEAT: 'audit_excessive_template_repeat',
  AUDIT_EXCESSIVE_ROW_VARIANT_REPEAT: 'audit_excessive_row_variant_repeat',
  AUDIT_EXCESSIVE_SESSION_REPETITION: 'audit_excessive_session_repetition',
  AUDIT_BEGINNER_COMBINED_LOWER_DENSITY: 'audit_beginner_combined_lower_density',
});

/** 7 pattern → bit mask (coverage DP). */
export const PATTERN_BITS = Object.freeze(
  Object.fromEntries(Object.values(STRENGTH_MOVEMENT_PATTERNS).map((p, i) => [p, 1 << i]))
);
export const FULL_PATTERN_MASK = (1 << Object.values(STRENGTH_MOVEMENT_PATTERNS).length) - 1; // 127