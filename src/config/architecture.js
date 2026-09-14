/**
 * UYGULAMA MİMARİ ANAYASASI — PART 0
 * --------------------------------------------------------------
 * Bu dosya uygulamanın DEĞİŞTİRİLEMEZ teknik ilkelerini sabitler.
 * Sonraki tüm Partlar bu ilkeleri ihlal edemez.
 *
 * İlkeler:
 *  - Tek kullanıcı (hesap/login gerekmez)
 *  - Çevrimdışı çalışma ANA mimaridir (offline-required, yardımcı değil)
 *  - Harici backend / cloud DB / bulut AI bağımlılığı yoktur
 *  - Hareket resmi / GIF / animasyon YOKTUR (metin tabanlı arayüz)
 *  - Genel UI dili TÜRKÇE; boxing canonical isimleri İNGİLİCE kalır
 *  - İş mantığı client-side/offline çalışacak şekilde tasarlanır
 *  - Yerel veri repository/abstraction arkındadır (SQLite'e taşınabilir)
 *  - Veri şemasının versiyonu/migration'ı vardır
 * --------------------------------------------------------------
 */

// --- Temel mimari ilkeler (belgeleme + kodda sabitleme) ---
export const ARCHITECTURE_PRINCIPLES = Object.freeze({
  SINGLE_USER: true,            // Tek kullanıcı; kayıt/giriş/şifre/rol yok
  OFFLINE_REQUIRED: true,       // Çevrimdışı çalışma ana mimari
  NO_CLOUD_DEPENDENCY: true,    // Harici backend/cloud DB bağımlılığı yok
  NO_AI_DEPENDENCY: true,       // Bulut AI servisi bağımlılığı yok
  NO_IMAGES: true,               // Hareket resmi/GIF/animasyon yok
  TEXT_BASED_UI: true,          // Canlı ekran metin tabanlı
  UI_LANGUAGE: 'tr',            // Kullanıcıya görünen dil Türkçe
  BOXING_NAMES_LANGUAGE: 'en',  // Boxing canonical isimleri İngilizce kalır
  COMBO_NOT_PER_PUNCH_TIMED: true, // Kombinasyon tek tek zamanlanmaz
  NO_AUTO_KG_SUGGESTION: true,  // Kuvvette otomatik kilogram önerisi yasak
});

// --- Program türleri (kesinlikle birbirine karışmaz) ---
export const PROGRAM_MODES = Object.freeze({
  BOXING_ONLY: 'boxing_only',
  STRENGTH_ONLY: 'strength_only',
  BOXING_AND_STRENGTH: 'boxing_and_strength',
});

// --- Program süreleri (tamamı önceden oluşturulur) ---
export const PROGRAM_DURATION_MONTHS = Object.freeze({
  ONE: 1,
  THREE: 3,
  SIX: 6,
});

// --- Boks maksimum hamle sayısı (kullanıcı seçer, kütüphaneyi filtreler) ---
export const BOXING_MAX_MOVES = Object.freeze([4, 6, 8, 10]);

// --- Zorluk seviyeleri (kombinasyon SIRASINI değiştirmez) ---
export const DIFFICULTY_LEVELS = Object.freeze({
  EASY: 'easy',
  NORMAL: 'normal',
  HARD: 'hard',
});

// --- Deneyim seviyeleri (PART 3) ---
export const EXPERIENCE_LEVELS = Object.freeze({
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  EXPERIENCED: 'experienced',
});

// --- Boks duruşları (Lead/Rear ilişkisini belirler) ---
export const BOXING_STANCES = Object.freeze({
  ORTHODOX: 'orthodox',
  SOUTHPAW: 'southpaw',
});

// --- Hafta günleri (ekran sırası her zaman Pazartesi → Pazar) ---
export const WEEKDAYS = Object.freeze([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);

// --- Günlük antrenman süresi hazır seçenekleri (dakika) + özel sınır ---
export const SESSION_DURATION_OPTIONS = Object.freeze([15, 20, 30, 40, 45, 60]);
export const SESSION_DURATION_LIMITS = Object.freeze({ MIN: 10, MAX: 120 });

// --- Kuvvet ekipmanları (vücut ağırlığı ayrı ekipman gerektirmez) ---
export const STRENGTH_EQUIPMENT = Object.freeze({
  DUMBBELL: 'dumbbell',
  BARBELL: 'barbell',
  EZ_BAR: 'ez_bar',
});

// --- Training profile (tek kullanıcı, yerel tercih kaydı) ---
export const TRAINING_PROFILE = Object.freeze({
  PRIMARY_ID: 'PRIMARY_TRAINING_PROFILE',
});

// --- Boks hareket meta sabitleri (PART 4) ---
export const BOXING_MOVEMENT_TYPES = Object.freeze({
  STRIKE: 'strike',
  DEFENSE: 'defense',
  FOOTWORK: 'footwork',
});

export const BOXING_FAMILIES = Object.freeze({
  STRAIGHT: 'straight',
  HOOK: 'hook',
  UPPERCUT: 'uppercut',
  SLIP: 'slip',
  CATCH: 'catch',
  FOOTWORK: 'footwork',
});

export const BOXING_SIDE_ROLES = Object.freeze({
  LEAD: 'lead',
  REAR: 'rear',
});

export const BOXING_TARGETS = Object.freeze({
  HEAD: 'head',
  BODY: 'body',
  NONE: 'none',
});

export const BOXING_RANGE_CLASSES = Object.freeze({
  LONG: 'long',
  MID: 'mid',
  CLOSE: 'close',
  VARIABLE: 'variable',
});

// PART 32: Structured footwork direction model (stance-relative, absolute left/right YOK).
export const BOXING_FOOTWORK_DIRECTIONS = Object.freeze({
  FORWARD: 'forward',
  BACKWARD: 'backward',
  LATERAL_LEAD: 'lateral_lead',
  LATERAL_REAR: 'lateral_rear',
});

// PART 35: Structured footwork integration phases. Metadata only; süre/punch count artırmaz.
export const BOXING_FOOTWORK_INTEGRATION_PHASES = Object.freeze({
  BEFORE_COMBO: 'before_combo',
  AFTER_COMBO: 'after_combo',
});

// Hareket kütüphanesi versiyonu (DB schema version'dan ayrı bir kavramdır).
// PART 32: 2 → 3 (footwork movement type + 4 new movements added).
export const BOXING_MOVE_LIBRARY_VERSION = 3;

// Boks teknik anayasa versiyonu (kod-level; DB schema version'dan ayrı).
export const BOXING_TECHNICAL_CONSTITUTION_VERSION = 1;

// --- Boks hareket geçiş matrisi (PART 7) ---
// Transition matrix versiyonu (DB schema, move library, constitution'dan ayrı).
export const BOXING_TRANSITION_MATRIX_VERSION = 1;

export const BOXING_TRANSITION_SOURCE_CLASSES = Object.freeze({
  FOUNDATIONAL_MANUAL_EXAMPLE: 'foundational_manual_example',
  CURATED_TECHNICAL: 'curated_technical',
});

// --- Boks saldırı kombinasyon kütüphanesi (PART 8) ---
export const BOXING_COMBINATION_LIBRARY_VERSION = 1;

export const BOXING_COMBINATION_SOURCE_CLASSES = Object.freeze({
  APP_APPROVED_CORE_V1: 'app_approved_core_v1',
});

export const BOXING_COMBINATION_CATEGORY = Object.freeze({
  ATTACK: 'attack',
});

// --- Boks savunma/kontra sistemi (PART 9) ---
export const BOXING_DEFENSE_COUNTER_LIBRARY_VERSION = 1;

// V2 supplemental defense library version (Catch family, PART 30). Separate from V1.
export const BOXING_V2_SUPPLEMENTAL_DEFENSE_LIBRARY_VERSION = 1;

export const BOXING_DEFENSE_SOURCE_CLASSES = Object.freeze({
  APP_CURATED_DEFENSE_V1: 'app_curated_defense_v1',
  APP_CURATED_DEFENSE_V2_SUPPLEMENTAL: 'app_curated_defense_v2_supplemental',
});

// V1 yalnız straight punch tehditlerini kapsar.
export const BOXING_THREAT_TYPES = Object.freeze({
  OPPONENT_LEAD_STRAIGHT: 'opponent_lead_straight',
  OPPONENT_REAR_STRAIGHT: 'opponent_rear_straight',
});

// V1 yalnız same-stance drill context destekler.
export const BOXING_OPPONENT_STANCE_RELATIONS = Object.freeze({
  SAME_STANCE: 'same_stance',
});

export const BOXING_DEFENSE_REQUIREMENTS = Object.freeze({
  OPPONENT_STANCE_SAME_REQUIRED: 'opponent_stance_same_required',
  GUARD_RECOVERY_REQUIRED: 'guard_recovery_required',
  BALANCE_RECOVERY_REQUIRED: 'balance_recovery_required',
});

// --- Kuvvet hareket meta sabitleri (PART 5) ---
export const STRENGTH_MOVEMENT_PATTERNS = Object.freeze({
  PUSH: 'push',
  SQUAT: 'squat',
  LUNGE: 'lunge',
  HINGE: 'hinge',
  ROW: 'row',
  CORE_ANTI_EXTENSION: 'core_anti_extension',
  CORE_LATERAL_STABILITY: 'core_lateral_stability',
});

export const STRENGTH_BODY_REGIONS = Object.freeze({
  UPPER: 'upper',
  LOWER: 'lower',
  CORE: 'core',
});

export const STRENGTH_UPPER_BODY_ROLES = Object.freeze({
  PUSH: 'push',
  PULL: 'pull',
  NONE: 'none',
});

export const STRENGTH_LOWER_BODY_PATTERNS = Object.freeze({
  SQUAT: 'squat',
  LUNGE: 'lunge',
  HINGE: 'hinge',
  NONE: 'none',
});

export const STRENGTH_LATERALITY = Object.freeze({
  BILATERAL: 'bilateral',
  UNILATERAL: 'unilateral',
  ISOMETRIC_BILATERAL: 'isometric_bilateral',
  ISOMETRIC_UNILATERAL: 'isometric_unilateral',
});

export const STRENGTH_PRESCRIPTION_TYPES = Object.freeze({
  REPS: 'reps',
  TIME: 'time',
});

export const STRENGTH_MOVEMENT_FAMILIES = Object.freeze({
  PUSHUP: 'pushup_family',
  SQUAT: 'squat_family',
  LUNGE: 'lunge_family',
  HIP_HINGE: 'hip_hinge_family',
  ROW: 'row_family',
  FRONT_CORE_STABILITY: 'front_core_stability_family',
  LATERAL_CORE_STABILITY: 'lateral_core_stability_family',
});

export const STRENGTH_ALTERNATIVE_GROUPS = Object.freeze({
  ROW_VARIANTS: 'row_variants',
});

// --- Kuvvet teknik anayasası (PART 10) ---
export const STRENGTH_TECHNICAL_CONSTITUTION_VERSION = 1;

export const STRENGTH_BALANCE_VERDICTS = Object.freeze({
  PASS: 'pass',
  WARNING: 'warning',
  FAIL: 'fail',
});

export const STRENGTH_SESSION_TYPES = Object.freeze({
  STRENGTH_ONLY_DAY: 'strength_only_day',
  COMBINED_BOXING_STRENGTH_DAY: 'combined_boxing_strength_day',
});

export const STRENGTH_DENSITY_CLASSES = Object.freeze({
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
});

export const STRENGTH_BALANCE_WINDOWS = Object.freeze({
  SESSION: 'session',
  WEEK: 'phase_week',
  PHASE: 'phase',
});

export const STRENGTH_REASON_CODES = Object.freeze({
  STR_UNKNOWN_EXERCISE: 'str_unknown_exercise',
  STR_INACTIVE_EXERCISE: 'str_inactive_exercise',
  STR_DUPLICATE_EXERCISE: 'str_duplicate_exercise',
  STR_EQUIPMENT_MISMATCH: 'str_equipment_mismatch',
  STR_MULTIPLE_ROW_VARIANTS: 'str_multiple_row_variants',
  STR_PATTERN_OVERCONCENTRATION: 'str_pattern_overconcentration',
  STR_PUSH_NEGLECT: 'str_push_neglect',
  STR_PULL_NEGLECT: 'str_pull_neglect',
  STR_HINGE_NEGLECT: 'str_hinge_neglect',
  STR_CORE_NEGLECT: 'str_core_neglect',
  STR_LOWER_NEGLECT: 'str_lower_neglect',
  STR_REPEATED_PATTERN_DENSITY: 'str_repeated_pattern_density',
  STR_INVALID_PRESCRIPTION_TYPE: 'str_invalid_prescription_type',
  STR_UNILATERAL_SIDE_COVERAGE_REQUIRED: 'str_unilateral_side_coverage_required',
  STR_COMBINED_DAY_INTERFERENCE_RISK: 'str_combined_day_interference_risk',
  STR_KG_PRESCRIPTION_FORBIDDEN: 'str_kg_prescription_forbidden',
});

// Kuvvet hareket kütüphanesi versiyonu (DB schema version'dan ayrı).
export const STRENGTH_EXERCISE_LIBRARY_VERSION = 1;

// --- Onaylı kuvvet antrenman iskeletleri (PART 11) ---
export const STRENGTH_TEMPLATE_LIBRARY_VERSION = 1;

export const STRENGTH_TEMPLATE_SOURCE_CLASSES = Object.freeze({
  APP_APPROVED_STRENGTH_TEMPLATE_V1: 'app_approved_strength_template_v1',
});

// --- Yerel veri katmanı ---
// Web ortamında geçici olarak IndexedDB kullanılır.
// Mimari, ZIP export sonrası native SQLite'a geçirilebilecek şekilde tutulur.
// localStorage yalnızca küçük preference/config değerleri içindir;
// büyük/karmaşık program verilerinin ana deposu DEĞİLDİR.
export const LOCAL_DB = Object.freeze({
  NAME: 'boks_kuvvet_db',
  // PART 2: v1 -> v2 (yeni domain store'ları + indexler). Eski veri silinmez.
  VERSION: 2,
  STORES: Object.freeze({
    APP_META: 'app_meta',
    SETTINGS: 'settings',
    TRAINING_PROFILES: 'training_profiles',
    PROGRAMS: 'programs',
    PROGRAM_VERSIONS: 'program_versions',
    PROGRAM_DAYS: 'program_days',
    WORKOUT_BLOCKS: 'workout_blocks',
    WORKOUT_PROGRESS: 'workout_progress',
    WORKOUT_HISTORY: 'workout_history',
    USER_FEEDBACK: 'user_feedback',
    BOXING_MOVES: 'boxing_moves',
    BOXING_TRANSITIONS: 'boxing_transitions',
    BOXING_COMBINATIONS: 'boxing_combinations',
    DEFENSE_COUNTER_RULES: 'defense_counter_rules',
    STRENGTH_EXERCISES: 'strength_exercises',
    STRENGTH_TEMPLATES: 'strength_templates',
    PROGRAM_AUDITS: 'program_audits',
  }),
});

// --- Session time budget engine (PART 12) ---
export const SESSION_TIME_BUDGET_ENGINE_VERSION = 1;

export const BOXING_INTERVAL_SEGMENT_TYPES = Object.freeze({
  WORK: 'work',
  REST: 'rest',
});

export const SESSION_BUDGET_REASON_CODES = Object.freeze({
  SESSION_INVALID_DURATION: 'session_invalid_duration',
  SESSION_INVALID_MODE: 'session_invalid_mode',
  SESSION_INVALID_EXPERIENCE: 'session_invalid_experience',
  SESSION_INVALID_DIFFICULTY: 'session_invalid_difficulty',
  SESSION_NEGATIVE_BLOCK_DURATION: 'session_negative_block_duration',
  SESSION_BUDGET_TOTAL_MISMATCH: 'session_budget_total_mismatch',
  SESSION_BOXING_INTERVAL_MISMATCH: 'session_boxing_interval_mismatch',
  SESSION_STRENGTH_BUDGET_MISMATCH: 'session_strength_budget_mismatch',
  SESSION_NO_ELIGIBLE_STRENGTH_TEMPLATE_COUNT: 'session_no_eligible_strength_template_count',
  SESSION_INVALID_CUSTOM_DURATION: 'session_invalid_custom_duration',
  SESSION_VERY_COMPACT_COMBINED: 'session_very_compact_combined',
});

// --- Program progression engine (PART 13) ---
export const PROGRAM_PROGRESSION_ENGINE_VERSION = 1;

export const PROGRESSION_PHASES = Object.freeze({
  FOUNDATION: 'foundation',
  DEVELOPMENT: 'development',
  EXPANSION: 'expansion',
  INTEGRATION: 'integration',
  CONSOLIDATION: 'consolidation',
});

export const DEFENSE_EXPOSURE_LEVELS = Object.freeze({
  NONE: 'none',
  INTRO: 'intro',
  REGULAR: 'regular',
});

export const STRENGTH_PRESCRIPTION_TIERS = Object.freeze({
  TIER_1: 'tier_1',
  TIER_2: 'tier_2',
  TIER_3: 'tier_3',
  TIER_4: 'tier_4',
});

export const RECOVERY_DENSITY_CLASSES = Object.freeze({
  GENEROUS: 'generous_recovery',
  BALANCED: 'balanced_recovery',
  DENSE: 'dense_recovery',
});

export const PROGRESSION_REASON_CODES = Object.freeze({
  PROGRESSION_INVALID_DURATION: 'progression_invalid_duration',
  PROGRESSION_INVALID_ORDINAL: 'progression_invalid_ordinal',
  PROGRESSION_INVALID_TOTAL_SESSION_COUNT: 'progression_invalid_total_session_count',
  PROGRESSION_INSUFFICIENT_SESSION_COUNT: 'progression_insufficient_session_count',
  PROGRESSION_INVALID_MODE: 'progression_invalid_mode',
  PROGRESSION_INVALID_EXPERIENCE: 'progression_invalid_experience',
  PROGRESSION_INVALID_DIFFICULTY: 'progression_invalid_difficulty',
  PROGRESSION_INVALID_BOXING_MAX_MOVES: 'progression_invalid_boxing_max_moves',
  PROGRESSION_MISSING_SESSION_BUDGET: 'progression_missing_session_budget',
  PROGRESSION_MOVEMENT_COUNT_OUTSIDE_TIME_ENVELOPE: 'progression_movement_count_outside_time_envelope',
  PROGRESSION_PRESCRIPTION_DOES_NOT_FIT: 'progression_prescription_does_not_fit',
  PROGRESSION_PHASE_ALLOCATION_MISMATCH: 'progression_phase_allocation_mismatch',
});

// --- Weekly balancing engine (PART 14) ---
export const WEEKLY_BALANCING_ENGINE_VERSION = 1;

export const WEEKLY_SESSION_ROLES = Object.freeze({
  BOXING_ONLY_DAY: 'boxing_only_day',
  STRENGTH_ONLY_DAY: 'strength_only_day',
  COMBINED_BOXING_STRENGTH_DAY: 'combined_boxing_strength_day',
  UNSCHEDULED_DAY: 'unscheduled_day',
});

export const WEEKLY_PROGRESSION_FOCUS = Object.freeze({
  BOXING_COMPLEXITY: 'boxing_complexity',
  BOXING_WORK_CAPACITY: 'boxing_work_capacity',
  STRENGTH_MOVEMENT_DENSITY: 'strength_movement_density',
  STRENGTH_PRESCRIPTION: 'strength_prescription',
  DEFENSE_INTEGRATION: 'defense_integration',
  BALANCED_TECHNIQUE: 'balanced_technique',
});

export const BALANCE_REASON_CODES = Object.freeze({
  BALANCE_INVALID_WEEKDAY_SELECTION: 'balance_invalid_weekday_selection',
  BALANCE_DAY_COUNT_MISMATCH: 'balance_day_count_mismatch',
  BALANCE_INVALID_STRENGTH_DAY_COUNT: 'balance_invalid_strength_day_count',
  BALANCE_NO_ELIGIBLE_STRENGTH_TEMPLATE: 'balance_no_eligible_strength_template',
  BALANCE_REQUIRED_PATTERN_UNREACHABLE: 'balance_required_pattern_unreachable',
  BALANCE_INVALID_WEEK_ORDINAL: 'balance_invalid_week_ordinal',
  BALANCE_INVALID_MODE: 'balance_invalid_mode',
  BALANCE_SESSION_BUDGET_INVALID: 'balance_session_budget_invalid',
  BALANCE_PROGRESSION_CONTEXT_INVALID: 'balance_progression_context_invalid',
});

export const BALANCE_WARNING_CODES = Object.freeze({
  BALANCE_ADJACENT_STRENGTH_DAYS_UNAVOIDABLE: 'balance_adjacent_strength_days_unavoidable',
  BALANCE_HIGH_CONSECUTIVE_TRAINING_DENSITY: 'balance_high_consecutive_training_density',
  BALANCE_NO_UNSCHEDULED_WEEKDAY_GAP: 'balance_no_unscheduled_weekday_gap',
  BALANCE_TEMPLATE_VARIETY_LIMITED: 'balance_template_variety_limited',
  BALANCE_DEFENSE_SPACING_LIMITED: 'balance_defense_spacing_limited',
  BALANCE_EXCESSIVE_TEMPLATE_REPEAT: 'balance_excessive_template_repeat',
  BALANCE_EXCESSIVE_SESSION_REPETITION: 'balance_excessive_session_repetition',
  BALANCE_COMBINED_INTERFERENCE_RISK: 'balance_combined_interference_risk',
});

export const ROLLING_STRENGTH_SESSION_WINDOW = 4;

// --- Full program generation engine (PART 15) ---
export const FULL_PROGRAM_GENERATOR_VERSION = 1;
export const STRENGTH_PRESCRIPTION_FITTER_VERSION = 1;

// --- Program correction engine (PART 18) ---
export const PROGRAM_CORRECTION_ENGINE_VERSION = 1;

// --- Program approval engine (PART 18) ---
export const PROGRAM_APPROVAL_ENGINE_VERSION = 1;
export const PLANNING_SECONDS_PER_REP = 3;
export const MIN_INTERSET_REST_SECONDS = 15;

// --- Generation policy versioning (PART 20) ---
// Bir programın hangi curriculum/progression kurallarıyla üretildiğini belirtir.
// engineVersions'dan AYRI semantik kavramdır (implementation version vs policy version).
// V2 henüz aktif değildir — CURRENT_GENERATION_POLICY_VERSION = V1.
export const GENERATION_POLICY_VERSIONS = Object.freeze({
  V1: 1,
  V2: 2,
});
export const CURRENT_GENERATION_POLICY_VERSION = GENERATION_POLICY_VERSIONS.V1;

export const WORKOUT_BLOCK_TYPES = Object.freeze({
  WARMUP: 'warmup',
  FOOTWORK_TECHNIQUE: 'boxing_footwork_technique',
  BOXING_ATTACK_WORK: 'boxing_attack_work',
  BOXING_DEFENSE_WORK: 'boxing_defense_work',
  BOXING_REST: 'boxing_rest',
  MODE_TRANSITION: 'mode_transition',
  STRENGTH_EXERCISE: 'strength_exercise',
  COOLDOWN: 'cooldown',
});

export const PROGRAM_GENERATION_REASON_CODES = Object.freeze({
  PROGRAM_INVALID_SETTINGS: 'program_invalid_settings',
  PROGRAM_INVALID_GENERATION_DATE: 'program_invalid_generation_date',
  PROGRAM_NO_SCHEDULED_DAYS: 'program_no_scheduled_days',
  PROGRAM_PROGRESSION_FAILED: 'program_progression_failed',
  PROGRAM_WEEKLY_BALANCE_FAILED: 'program_weekly_balance_failed',
  PROGRAM_NO_ELIGIBLE_BOXING_COMBINATION: 'program_no_eligible_boxing_combination',
  PROGRAM_NO_ELIGIBLE_STRENGTH_TEMPLATE: 'program_no_eligible_strength_template',
  PROGRAM_NO_TEMPLATE_WITHIN_BALANCED_CAP: 'program_no_template_within_balanced_cap',
  PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT: 'program_strength_prescription_does_not_fit',
  PROGRAM_DAY_TIME_MISMATCH: 'program_day_time_mismatch',
  PROGRAM_BOXING_VALIDATION_FAILED: 'program_boxing_validation_failed',
  PROGRAM_DEFENSE_VALIDATION_FAILED: 'program_defense_validation_failed',
  PROGRAM_STRENGTH_VALIDATION_FAILED: 'program_strength_validation_failed',
  PROGRAM_BLUEPRINT_VALIDATION_FAILED: 'program_blueprint_validation_failed',
  PROGRAM_IDEMPOTENCY_CONFLICT: 'program_idempotency_conflict',
  PROGRAM_PERSISTENCE_FAILED: 'program_persistence_failed',
});

export const PROGRAM_GENERATION_WARNING_CODES = Object.freeze({
  PROGRAM_ROLLING_PATTERN_COVERAGE_LIMITED: 'program_rolling_pattern_coverage_limited',
  PROGRAM_EXCESSIVE_TEMPLATE_REPEAT: 'program_excessive_template_repeat',
  PROGRAM_SESSION_REPETITION: 'program_session_repetition',
});

// --- Workout durumları (birbirinden net ayrılır; süresi biten = completed DEĞİL) ---
export const WORKOUT_STATUS = Object.freeze({
  UPCOMING: 'upcoming',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  PARTIAL: 'partial',
  SKIPPED: 'skipped',
  AWAITING_COMPLETION_CONFIRMATION: 'awaiting_completion_confirmation',
  COMPLETED: 'completed',
});

// --- Program durumları (workout status ile aynı enum'a doldurulmaz) ---
export const PROGRAM_STATUS = Object.freeze({
  DRAFT: 'draft',
  REVIEW_REQUIRED: 'review_required',
  REVIEW_FAILED: 'review_failed',
  READY_FOR_APPROVAL: 'ready_for_approval',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});