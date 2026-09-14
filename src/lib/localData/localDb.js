/**
 * YEREL VERİ ERİŞİM KATMANI — IndexedDB adaptörü
 * --------------------------------------------------------------
 * Uygulamanın yerel kalıcı verisinin gerçek depolandığı tek yerdir.
 * Tüm repository'ler bu adaptör üzerinden gider; UI doğrudan kullanmaz.
 *
 * Mevcut ortam: gerçek IndexedDB (sahte değil, memory-only değil).
 * ZIP export sonrası Capacitor/native Android'de implementasyon SQLite'a
 * geçirilebilir; dışarıya açılan API aynı kalır.
 *
 * Migration: onupgradeneeded içinde sürüm bazlı, idempotent adımlarla.
 * --------------------------------------------------------------
 */
import { LOCAL_DB } from '@/config/architecture';
import { migrations } from './migrations';

let dbInstance = null;

/**
 * Sıralı migration runner. oldVersion < version olan tüm adımları uygular.
 * Idempotent; eski kayıtları silmez.
 */
function runMigrations(db, oldVersion, tx) {
  migrations.forEach(({ version, run }) => {
    if (oldVersion < version) {
      run(db, tx);
    }
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB bu ortamda desteklenmiyor.'));
    }
    const request = indexedDB.open(LOCAL_DB.NAME, LOCAL_DB.VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const tx = event.target.transaction;
      runMigrations(db, event.oldVersion, tx);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

async function getStore(storeName, mode = 'readonly') {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const localDb = {
  async getAll(storeName) {
    const store = await getStore(storeName);
    const result = await requestToPromise(store.getAll());
    return result || [];
  },
  async get(storeName, id) {
    const store = await getStore(storeName);
    const result = await requestToPromise(store.get(id));
    return result || null;
  },
  async put(storeName, value) {
    const store = await getStore(storeName, 'readwrite');
    await requestToPromise(store.put(value));
    return value;
  },
  async delete(storeName, id) {
    const store = await getStore(storeName, 'readwrite');
    await requestToPromise(store.delete(id));
    return true;
  },
  async clear(storeName) {
    const store = await getStore(storeName, 'readwrite');
    await requestToPromise(store.clear());
    return true;
  },
  async count(storeName) {
    const store = await getStore(storeName);
    const result = await requestToPromise(store.count());
    return typeof result === 'number' ? result : 0;
  },
  async getByIndex(storeName, indexName, value) {
    const store = await getStore(storeName);
    const index = store.index(indexName);
    const result = await requestToPromise(index.get(value));
    return result || null;
  },
  async getAllByIndex(storeName, indexName, value) {
    const store = await getStore(storeName);
    const index = store.index(indexName);
    const result = await requestToPromise(index.getAll(value));
    return result || [];
  },
  /**
   * Çoklu store transaction. callback(stores, tx) alır.
   * Hata olursa transaction abort edilir; yarım kayıt kalmaz (atomic save).
   */
  async withTransaction(storeNames, mode, callback) {
    const db = await openDb();
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const tx = db.transaction(names, mode);
    const stores = {};
    names.forEach((n) => {
      stores[n] = tx.objectStore(n);
    });
    let result;
    try {
      result = await callback(stores, tx);
    } catch (e) {
      try {
        tx.abort();
      } catch (_) {
        /* abort hatasını yut */
      }
      throw e;
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Transaction hatası.'));
      tx.onabort = () => reject(tx.error || new Error('Transaction iptal edildi.'));
    });
  },
  /** DB meta bilgi (health check / debug). */
  async getInfo() {
    const db = await openDb();
    return {
      version: db.version,
      storeNames: Array.from(db.objectStoreNames),
    };
  },
  getVersion() {
    return LOCAL_DB.VERSION;
  },
};