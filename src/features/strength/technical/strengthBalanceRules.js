/**
 * KUVVET DENGE KURALLARI V1
 * --------------------------------------------------------------
 * Stabil rule ID'ler + sabit kural meta verisi. Sayısal kg/recovery
 * eşiği uydurmaz. Program motoru ileride bu kurallara göre seçim yapar.
 * --------------------------------------------------------------
 */
import {
  STRENGTH_ALTERNATIVE_GROUPS, STRENGTH_MOVEMENT_PATTERNS,
} from '@/config/architecture';
import { MAX_PER_ALTERNATIVE_GROUP_PER_SESSION } from './strengthTechnicalConstitution';

/** Stabil rule tanımları. */
export const STRENGTH_BALANCE_RULES = Object.freeze([
  {
    id: 'STR_TECH_EQUIPMENT_001',
    kind: 'equipment_eligibility',
    description: 'Bir hareket kullanıcının availableEquipment listesiyle uyumsuzsa programa eklenemez.',
    hardFail: true,
  },
  {
    id: 'STR_TECH_ROW_001',
    kind: 'alternative_group_limit',
    alternativeGroup: STRENGTH_ALTERNATIVE_GROUPS.ROW_VARIANTS,
    maxPerSession: MAX_PER_ALTERNATIVE_GROUP_PER_SESSION[STRENGTH_ALTERNATIVE_GROUPS.ROW_VARIANTS],
    description: 'Aynı normal session içinde maksimum 1 ROW_VARIANT. Üç row ayrı pull pattern sayılmaz.',
    hardFail: true,
  },
  {
    id: 'STR_TECH_BALANCE_001',
    kind: 'pattern_coverage',
    patterns: [
      STRENGTH_MOVEMENT_PATTERNS.PUSH,
      STRENGTH_MOVEMENT_PATTERNS.ROW,
      STRENGTH_MOVEMENT_PATTERNS.SQUAT,
      STRENGTH_MOVEMENT_PATTERNS.LUNGE,
      STRENGTH_MOVEMENT_PATTERNS.HINGE,
      STRENGTH_MOVEMENT_PATTERNS.CORE_ANTI_EXTENSION,
      STRENGTH_MOVEMENT_PATTERNS.CORE_LATERAL_STABILITY,
    ],
    window: 'phase',
    description: 'Hiçbir önemli pattern uzun program fazasında tamamen yok olmamalıdır.',
    hardFail: false,
  },
  {
    id: 'STR_TECH_CORE_001',
    kind: 'core_balance',
    description: 'Plank + Side Plank aynı sessionda otomatik yasak değil; uzun dönem ikisi de ihmal edilemez.',
    hardFail: false,
  },
  {
    id: 'STR_TECH_COMBINED_001',
    kind: 'combined_day_interference',
    description: 'Beginner + combined günde yüksek alt-vücut pattern yığılması uyarılandırılır (tıbbi garanti değil).',
    hardFail: false,
  },
  {
    id: 'STR_TECH_PRESCRIPTION_001',
    kind: 'prescription_type_guard',
    description: 'REPS hareketine TIME, TIME hareketine REPS prescription verilmesini engeller.',
    hardFail: true,
  },
  {
    id: 'STR_TECH_KG_001',
    kind: 'kg_policy',
    description: 'Uygulama external load (kg) reçete etmez; yasaklı alanlar üretilmemelidir.',
    hardFail: true,
  },
]);

export const STRENGTH_BALANCE_RULE_IDS = Object.freeze(STRENGTH_BALANCE_RULES.map((r) => r.id));