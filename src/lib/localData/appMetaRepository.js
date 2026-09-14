/**
 * APP META REPOSITORY
 * --------------------------------------------------------------
 * app_meta store: uygulama/database metadata (tekil kayıt).
 * installationId yalnız bu cihaz kurulumu için yerel benzersiz ID'dir;
 * kullanıcı hesabı/kimlik doğrulama DEĞİLDİR.
 * Idempotent: ilk açılışta oluşturur, tekrar korur (PART tekrarında değişmez).
 * --------------------------------------------------------------
 */
import { createRepository } from './baseRepository';
import { LOCAL_DB } from '@/config/architecture';
import { generateId } from './id';
import { nowIso } from './time';

const repo = createRepository(LOCAL_DB.STORES.APP_META);
const META_ID = 'app_meta_singleton';

export const appMetaRepository = {
  async get() {
    return repo.getById(META_ID);
  },
  async ensureInitialized() {
    let meta = await repo.getById(META_ID);
    if (!meta) {
      meta = {
        id: META_ID,
        installationId: generateId('inst'),
        schemaVersion: LOCAL_DB.VERSION,
        appInitialized: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      await repo.save(meta);
    }
    return meta;
  },
  async update(patch) {
    const meta = await this.get();
    if (!meta) return null;
    const updated = { ...meta, ...patch, updatedAt: nowIso() };
    return repo.save(updated);
  },
};