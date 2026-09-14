/**
 * TRAINING PROFILE REPOSITORY
 * Tek kullanıcı için tek yerel tercih kaydı (PRIMARY_TRAINING_PROFILE).
 * Upsert (put); createdAt korunur, updatedAt yenilenir. İkinci profil oluşturmaz.
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB, TRAINING_PROFILE } from '@/config/architecture';
import { nowIso } from '../time';

const repo = createRepository(LOCAL_DB.STORES.TRAINING_PROFILES);

export const trainingProfileRepository = {
  async get() {
    return repo.getById(TRAINING_PROFILE.PRIMARY_ID);
  },
  async save(record) {
    const existing = await this.get();
    const now = nowIso();
    const persisted = {
      ...record,
      id: TRAINING_PROFILE.PRIMARY_ID,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    return repo.save(persisted);
  },
};