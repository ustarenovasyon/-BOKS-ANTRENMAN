/**
 * STRENGTH EXERCISE REPOSITORY (genişletilmiş)
 * PART 2 generic repository'si korunur; geriye uyumlu sorgu yardımcıları eklenir.
 * lib katmanı features'a bağımlı olmaz — ekipman uyumluluğu burada çözülür.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';

const base = createRepository(LOCAL_DB.STORES.STRENGTH_EXERCISES);

async function sortedAll() {
  const all = await base.list();
  return all.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export const strengthExerciseRepository = {
  ...base,
  async getAll() {
    return sortedAll();
  },
  async getActiveExercises() {
    const all = await sortedAll();
    return all.filter((e) => e.active !== false);
  },
  async getByMovementPattern(pattern) {
    const all = await sortedAll();
    return all.filter((e) => e.movementPattern === pattern);
  },
  async getByAlternativeGroup(group) {
    const all = await sortedAll();
    return all.filter((e) => e.alternativeGroup === group);
  },
  async getAvailableForEquipment(availableEquipment) {
    const all = await sortedAll();
    const have = Array.isArray(availableEquipment) ? availableEquipment : [];
    return all.filter((e) => {
      if (e.requiresExternalEquipment === false) return true;
      return (e.allowedEquipment || []).some((eq) => have.includes(eq));
    });
  },
};