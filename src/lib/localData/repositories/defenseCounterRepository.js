/**
 * DEFENSE COUNTER REPOSITORY (genişletilmiş)
 * PART 2 generic repository'si korunur; savunma sorgu yardımcıları eklenir.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';

const base = createRepository(LOCAL_DB.STORES.DEFENSE_COUNTER_RULES);

function bySortOrder(list) {
  return list.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export const defenseCounterRepository = {
  ...base,
  async getActiveRules() {
    const all = await base.list();
    return bySortOrder(all.filter((r) => r.active !== false && r.approved === true));
  },
  async getByIncomingThreat(threatType) {
    const active = await this.getActiveRules();
    return active.filter((r) => r.incomingThreatType === threatType);
  },
  async getByDefenseMove(defenseMoveId) {
    const active = await this.getActiveRules();
    return active.filter((r) => r.defenseMoveId === defenseMoveId);
  },
  async getForOpponentStanceRelation(relation) {
    const active = await this.getActiveRules();
    return active.filter((r) => r.opponentStanceRelation === relation);
  },
};