/**
 * BOXING MOVE REPOSITORY (genişletilmiş)
 * PART 2 generic repository'si korunur; katalog kullanımına yardımcı
 * geriye uyumlu fonksiyonlar eklenir. Duplicate repository oluşmaz.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';

const base = createRepository(LOCAL_DB.STORES.BOXING_MOVES);

async function sortedAll() {
  const all = await base.list();
  return all.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export const boxingMoveRepository = {
  ...base,
  /** sortOrder ile sıralı tüm hareketler. */
  async getAll() {
    return sortedAll();
  },
  async getActiveMoves() {
    const all = await sortedAll();
    return all.filter((m) => m.active !== false);
  },
  async getAttackEligibleMoves() {
    const all = await sortedAll();
    return all.filter((m) => m.allowedInAttackCombinationLibrary === true);
  },
  async getDefensiveMoves() {
    const all = await sortedAll();
    return all.filter((m) => m.isDefensive === true);
  },
  async getByCanonicalId(id) {
    return base.getById(id);
  },
};