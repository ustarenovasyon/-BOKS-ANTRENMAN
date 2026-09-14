/**
 * IDEMPOTENT BOXING COMBINATION SEED
 * Validation ÖNCE, seed SONRA. Validation fail ise yarım library seed ETMEZ.
 * Stabil ID ile upsert; createdAt korunur. Tekrar çalışında count 52 kalır.
 */
import { boxingCombinationRepository } from '@/lib/localData/repositories/boxingCombinationRepository';
import { BOXING_COMBINATIONS, validateCombinationLibrary } from './boxingCombinations';
import { nowIso } from '@/lib/localData/time';

export async function seedBoxingCombinations() {
  const validation = validateCombinationLibrary(BOXING_COMBINATIONS);
  if (!validation.valid) {
    throw new Error(`Combination library geçersiz: ${validation.error}`);
  }
  const now = nowIso();
  for (const combo of BOXING_COMBINATIONS) {
    const existing = await boxingCombinationRepository.getById(combo.id);
    const record = {
      ...combo,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await boxingCombinationRepository.save(record);
  }
  return { count: BOXING_COMBINATIONS.length };
}