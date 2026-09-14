/**
 * DATABASE HEALTH CHECK
 * --------------------------------------------------------------
 * İnternet kullanmaz. DB açılışı, gerekli store varlığı ve şema sürümünü
 * kontrol eder. Test/debug amaçlıdır; production UI'ye bağlı değildir.
 * --------------------------------------------------------------
 */
import { localDb } from './localDb';
import { LOCAL_DB } from '@/config/architecture';

export async function databaseHealthCheck() {
  try {
    const info = await localDb.getInfo();
    const required = Object.values(LOCAL_DB.STORES);
    const missing = required.filter((s) => !info.storeNames.includes(s));
    return {
      ok: missing.length === 0 && info.version === LOCAL_DB.VERSION,
      dbVersion: info.version,
      expectedVersion: LOCAL_DB.VERSION,
      storeCount: info.storeNames.length,
      missingStores: missing,
    };
  } catch (e) {
    return {
      ok: false,
      dbVersion: null,
      expectedVersion: LOCAL_DB.VERSION,
      storeCount: 0,
      missingStores: [],
      error: e.message,
    };
  }
}