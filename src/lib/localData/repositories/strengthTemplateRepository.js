/**
 * STRENGTH TEMPLATE REPOSITORY (genişletilmiş)
 * PART 2 generic repository'si korunur; template sorgu yardımcıları eklenir.
 * Program/seçim stratejisi uygulamaz.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';
import { isStrengthTemplateAvailable } from '@/features/strength/templates/strengthTemplates';

const base = createRepository(LOCAL_DB.STORES.STRENGTH_TEMPLATES);

function bySortOrder(list) {
  return list.slice().sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

export const strengthTemplateRepository = {
  ...base,
  async getActiveApprovedTemplates() {
    const all = await base.list();
    return bySortOrder(all.filter((t) => t.active !== false && t.approved === true));
  },
  async getByMovementCount(count) {
    const active = await this.getActiveApprovedTemplates();
    return active.filter((t) => t.movementCount === count);
  },
  async getByMovementCountRange(min, max) {
    const active = await this.getActiveApprovedTemplates();
    return active.filter((t) => t.movementCount >= min && t.movementCount <= max);
  },
  async getEligibleTemplates(availableEquipment) {
    const active = await this.getActiveApprovedTemplates();
    return active.filter((t) => isStrengthTemplateAvailable(t, availableEquipment));
  },
  async getEligibleTemplatesByMovementCount(availableEquipment, movementCount) {
    const active = await this.getActiveApprovedTemplates();
    return active.filter((t) => t.movementCount === movementCount && isStrengthTemplateAvailable(t, availableEquipment));
  },
};