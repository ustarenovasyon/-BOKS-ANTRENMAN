/**
 * BOXING TRANSITION REPOSITORY (genişletilmiş)
 * PART 2 generic repository'si korunur; pair/aktif sorgu yardımcıları eklenir.
 * lib katmanı features'a bağımlı olmaz — verdict sabit değerleriyle çalışır.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';

const base = createRepository(LOCAL_DB.STORES.BOXING_TRANSITIONS);

export const boxingTransitionRepository = {
  ...base,
  async getActiveTransitions() {
    const all = await base.list();
    return all.filter((t) => t.active !== false && t.approved === true);
  },
  /** Yönlü, deterministic pair lookup. Reverse otomatik varsayılmaz. */
  async getByPair(fromMoveId, toMoveId) {
    const all = await base.list();
    return all.find(
      (t) => t.fromMoveId === fromMoveId && t.toMoveId === toMoveId && t.active !== false,
    ) || null;
  },
  async getAllowedTransitions() {
    const active = await this.getActiveTransitions();
    return active.filter((t) => t.verdict === 'allowed');
  },
  async getConditionalTransitions() {
    const active = await this.getActiveTransitions();
    return active.filter((t) => t.verdict === 'conditional');
  },
  async getOutgoingTransitions(fromMoveId) {
    const active = await this.getActiveTransitions();
    return active.filter((t) => t.fromMoveId === fromMoveId);
  },
};