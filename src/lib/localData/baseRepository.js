/**
 * BASE REPOSITORY
 * --------------------------------------------------------------
 * Yerel veri erişimini abstraction arkasında tutar.
 * UI / iş mantığı doğrudan localDb'yi değil, bir repository'yi kullanır.
 *
 * PART 0 API'si korunmuştur (list, getById, save, remove, clearAll).
 * PART 2 ile geriye uyumlu yetenekler eklendi (getAll, add, put, delete,
 * clear, count, getByIndex, getAllByIndex).
 * --------------------------------------------------------------
 */
import { localDb } from './localDb';

export function createRepository(storeName) {
  return {
    async list() {
      return localDb.getAll(storeName);
    },
    getAll() {
      return this.list();
    },
    async getById(id) {
      return localDb.get(storeName, id);
    },
    async add(record) {
      return this.save(record);
    },
    async put(record) {
      return this.save(record);
    },
    async save(record) {
      if (!record || typeof record !== 'object') {
        throw new Error('Geçersiz kayıt.');
      }
      if (!record.id) {
        throw new Error('Kaydın id alanı zorunludur.');
      }
      return localDb.put(storeName, record);
    },
    async remove(id) {
      return localDb.delete(storeName, id);
    },
    async delete(id) {
      return this.remove(id);
    },
    async clearAll() {
      return localDb.clear(storeName);
    },
    async clear() {
      return this.clearAll();
    },
    async count() {
      return localDb.count(storeName);
    },
    async getByIndex(indexName, value) {
      return localDb.getByIndex(storeName, indexName, value);
    },
    async getAllByIndex(indexName, value) {
      return localDb.getAllByIndex(storeName, indexName, value);
    },
    get storeName() {
      return storeName;
    },
  };
}