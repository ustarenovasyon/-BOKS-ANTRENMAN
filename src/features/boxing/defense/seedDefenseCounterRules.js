/**
 * IDEMPOTENT DEFENSE COUNTER SEED
 * Validation-öncesi, stabil ID upsert. Tekrar çalışında count 2 kalır.
 */
import { defenseCounterRepository } from '@/lib/localData/repositories/defenseCounterRepository';
import { DEFENSE_COUNTER_RULES, validateDefenseCounterLibrary } from './defenseCounterRules';
import { nowIso } from '@/lib/localData/time';

export async function seedDefenseCounterRules() {
  const validation = validateDefenseCounterLibrary(DEFENSE_COUNTER_RULES);
  if (!validation.valid) {
    throw new Error(`Defense counter library geçersiz: ${validation.error}`);
  }
  const now = nowIso();
  for (const rule of DEFENSE_COUNTER_RULES) {
    const existing = await defenseCounterRepository.getById(rule.id);
    const record = {
      ...rule,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await defenseCounterRepository.save(record);
  }
  return { count: DEFENSE_COUNTER_RULES.length };
}