import { LOCAL_DB } from '@/config/architecture';
import { createRepository } from './baseRepository';

/**
 * Küçük uygulama preference'ları için settings repository.
 * Büyük program/workout verileri burada TUTULMAZ — yalnızca küçük config
 * değerleri (appInitialized, schemaVersion, uiPreferences vb.) içindir.
 * UI bu repository'yi kullanır; doğrudan IndexedDB detaylarını bilmez.
 */
const repo = createRepository(LOCAL_DB.STORES.SETTINGS);

export const settingsRepository = {
  async get(key, defaultValue = null) {
    const rec = await repo.getById(key);
    return rec ? rec.value : defaultValue;
  },
  async set(key, value) {
    return repo.save({ id: key, value });
  },
  /**
   * İlk açılışta idempotent olarak işaretler. Tekrar çalıştırılırsa
   * duplicate oluşturmaz, mevcut değeri korur.
   */
  async ensureInitialized() {
    const initialized = await this.get('appInitialized', false);
    if (!initialized) {
      await this.set('appInitialized', true);
      await this.set('schemaVersion', LOCAL_DB.VERSION);
    }
  },
};