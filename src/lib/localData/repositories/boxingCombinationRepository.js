/**
 * BOXING COMBINATION REPOSITORY (genişletilmiş)
 * PART 2 generic repository'si korunur; kütüphane sorgu yardımcıları eklenir.
 * Seçim stratejisi / random program generation UYGULAMAZ.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';

const base = createRepository(LOCAL_DB.STORES.BOXING_COMBINATIONS);

function bySortOrder(list) {
  return list.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export const boxingCombinationRepository = {
  ...base,
  async getActiveApprovedCombinations() {
    const all = await base.list();
    return bySortOrder(all.filter((c) => c.active !== false && c.approved === true));
  },
  async getByMoveCount(moveCount) {
    const active = await this.getActiveApprovedCombinations();
    return active.filter((c) => c.moveCount === moveCount);
  },
  async getByMoveCountRange(min, max) {
    const active = await this.getActiveApprovedCombinations();
    return active.filter((c) => c.moveCount >= min && c.moveCount <= max);
  },
  /** Program motoru için: maxMoves <= kullanıcı boxingMaxMoves olan kombinasyonlar. */
  async getUpToMaxMoves(maxMoves) {
    const active = await this.getActiveApprovedCombinations();
    return active.filter((c) => c.moveCount <= maxMoves);
  },
};