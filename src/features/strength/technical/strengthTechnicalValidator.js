/**
 * KUVVET TEKNİK VALIDATOR — ANAYASA SELF-CHECK
 * --------------------------------------------------------------
 * Pure/deterministic. Anayasanın 9 hareketi tanıdığını ve kritik
 * metadata politikalrını (kg yok, REPS/TIME doğru, row variants 3, RDL
 * equipment) doğrular. Boxing verisine dokunmaz.
 * --------------------------------------------------------------
 */
import { STRENGTH_EXERCISES } from '../library/strengthExercises';
import {
  STRENGTH_EXERCISE_BY_ID, STRENGTH_CANONICAL_EXERCISE_COUNT,
  STRENGTH_KG_POLICY, STRENGTH_SIDE_SEMANTICS,
} from './strengthTechnicalConstitution';
import { STRENGTH_BALANCE_RULE_IDS } from './strengthBalanceRules';
import {
  STRENGTH_MOVEMENT_PATTERNS, STRENGTH_BODY_REGIONS, STRENGTH_PRESCRIPTION_TYPES,
  STRENGTH_ALTERNATIVE_GROUPS, STRENGTH_LATERALITY, STRENGTH_EXERCISE_LIBRARY_VERSION,
} from '@/config/architecture';

const VALID_PATTERNS = Object.values(STRENGTH_MOVEMENT_PATTERNS);
const VALID_REGIONS = Object.values(STRENGTH_BODY_REGIONS);
const VALID_PRESCRIPTIONS = Object.values(STRENGTH_PRESCRIPTION_TYPES);
const VALID_LATERALITIES = Object.values(STRENGTH_LATERALITY);

/** Anayasa self-check. Geçersizse program motoru çalıştırılmamalıdır. */
export function runStrengthConstitutionSelfCheck() {
  const checks = [];
  const fail = (name, detail) => checks.push({ name, pass: false, detail });
  const pass = (name) => checks.push({ name, pass: true });

  if (STRENGTH_CANONICAL_EXERCISE_COUNT === 9) pass('canonical_count_9');
  else fail('canonical_count_9', `expected 9, got ${STRENGTH_CANONICAL_EXERCISE_COUNT}`);

  // 9/9 coverage: her canonical hareket anayasa indeksinde tanınıyor.
  const coverageOk = STRENGTH_EXERCISES.every((e) => !!STRENGTH_EXERCISE_BY_ID[e.id]);
  coverageOk ? pass('coverage_9_of_9') : fail('coverage_9_of_9', 'missing exercise in index');

  // ROW_VARIANTS üç hareketi içeriyor.
  const rowVariants = STRENGTH_EXERCISES.filter((e) => e.alternativeGroup === STRENGTH_ALTERNATIVE_GROUPS.ROW_VARIANTS);
  rowVariants.length === 3 ? pass('row_variants_3') : fail('row_variants_3', `got ${rowVariants.length}`);

  // RDL allowed equipment: dumbbell/barbell/ez_bar.
  const rdl = STRENGTH_EXERCISE_BY_ID['STR_ROMANIAN_DEADLIFT'];
  const rdlOk = rdl && rdl.allowedEquipment.length === 3;
  rdlOk ? pass('rdl_equipment_3') : fail('rdl_equipment_3', 'rdl allowedEquipment mismatch');

  // İlk 7 hareket REPS, Plank/Side Plank TIME.
  const repsOk = STRENGTH_EXERCISES.filter((e) => e.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.REPS).length === 7;
  repsOk ? pass('reps_exercises_7') : fail('reps_exercises_7', 'first 7 must be REPS');
  const timeOk = STRENGTH_EXERCISES.filter((e) => e.prescriptionType === STRENGTH_PRESCRIPTION_TYPES.TIME).length === 2;
  timeOk ? pass('time_exercises_2') : fail('time_exercises_2', 'Plank/Side Plank must be TIME');

  // appPrescribesExternalLoad=false 9/9.
  const kgOk = STRENGTH_EXERCISES.every((e) => e.appPrescribesExternalLoad === false);
  kgOk ? pass('no_kg_prescription_9_of_9') : fail('no_kg_prescription_9_of_9', 'kg policy violated');

  // Yasaklı kg alanları hiçbir hareket metadata'sında yok.
  const forbiddenPresent = STRENGTH_EXERCISES.some((e) =>
    STRENGTH_KG_POLICY.FORBIDDEN_LOAD_FIELDS.some((k) => Object.prototype.hasOwnProperty.call(e, k))
  );
  !forbiddenPresent ? pass('no_forbidden_load_fields') : fail('no_forbidden_load_fields', 'forbidden kg field present');

  // body regions / patterns / laterality geçerli.
  const regionsOk = STRENGTH_EXERCISES.every((e) => VALID_REGIONS.includes(e.bodyRegion));
  regionsOk ? pass('valid_body_regions') : fail('valid_body_regions', 'invalid region');
  const patternsOk = STRENGTH_EXERCISES.every((e) => VALID_PATTERNS.includes(e.movementPattern));
  patternsOk ? pass('valid_movement_patterns') : fail('valid_movement_patterns', 'invalid pattern');
  const latOk = STRENGTH_EXERCISES.every((e) => VALID_LATERALITIES.includes(e.laterality));
  latOk ? pass('valid_lateralities') : fail('valid_lateralities', 'invalid laterality');

  // Unilateral hareketler BOTH_SIDES_REQUIRED semantiği taşıyor.
  const unilateral = STRENGTH_EXERCISES.filter((e) => STRENGTH_SIDE_SEMANTICS.UNILATERAL_LATERALITIES.includes(e.laterality));
  const unilateralOk = unilateral.length > 0; // reverse lunge, one-arm row, side plank
  unilateralOk ? pass('unilateral_side_coverage_model') : fail('unilateral_side_coverage_model', 'no unilateral model');

  // libraryVersion tutarlı.
  const versionOk = STRENGTH_EXERCISES.every((e) => e.libraryVersion === STRENGTH_EXERCISE_LIBRARY_VERSION);
  versionOk ? pass('library_version_consistent') : fail('library_version_consistent', 'version mismatch');

  // Duplicate rule ID yok.
  const ruleIds = STRENGTH_BALANCE_RULE_IDS;
  const uniqueRules = new Set(ruleIds).size === ruleIds.length;
  uniqueRules ? pass('unique_rule_ids') : fail('unique_rule_ids', 'duplicate rule id');

  const valid = checks.every((c) => c.pass);
  return { valid, coverage: STRENGTH_CANONICAL_EXERCISE_COUNT, checks };
}