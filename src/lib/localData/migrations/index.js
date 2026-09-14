/**
 * MIGRATION KAYIT DEPOSU
 * --------------------------------------------------------------
 * Her migration: { version, run(db, tx) }.
 * Runner, oldVersion < version olan tüm adımları sırayla uygular
 * (v1->v2->v3 ... atlanan sürümleri sıralı kapatır).
 *
 * Tüm adımlar idempotent'tir: store/index varsa atlar, eski veriyi silmez.
 * PART 2 tekrar çalışsa da version tekrar artmaz, duplicate oluşmaz.
 * --------------------------------------------------------------
 */
import { LOCAL_DB } from '@/config/architecture';

const S = LOCAL_DB.STORES;

/** Store yoksa oluşturur, varsa mevcut store'u döner. */
function ensureStore(db, tx, name, keyPath = 'id') {
  if (!db.objectStoreNames.contains(name)) {
    return db.createObjectStore(name, { keyPath });
  }
  return tx.objectStore(name);
}

/** Index yoksa oluşturur. */
function ensureIndex(store, indexName, keyPath) {
  if (store && !store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath, { unique: false });
  }
}

// v1: temel canonical store'lar (taze kurulum).
function migrationV1(db, tx) {
  Object.values(S).forEach((name) => ensureStore(db, tx, name));
}

// v2: mevcut v1 DB'sinden gelenek yeni store'lar + sorgu indexleri.
//     Idempotent: taze kurulumda store'lar zaten var, sadece index ekler.
function migrationV2(db, tx) {
  // Tüm canonical store'ların varlığını garanti et (eski v1 DB'de eksik olanlar).
  Object.values(S).forEach((name) => ensureStore(db, tx, name));

  ensureIndex(ensureStore(db, tx, S.PROGRAM_VERSIONS), 'by_programId', 'programId');
  ensureIndex(ensureStore(db, tx, S.PROGRAM_VERSIONS), 'by_status', 'status');

  ensureIndex(ensureStore(db, tx, S.PROGRAM_DAYS), 'by_programVersionId', 'programVersionId');
  ensureIndex(ensureStore(db, tx, S.PROGRAM_DAYS), 'by_dayIndex', 'dayIndex');
  ensureIndex(ensureStore(db, tx, S.PROGRAM_DAYS), 'by_weekIndex', 'weekIndex');

  ensureIndex(ensureStore(db, tx, S.WORKOUT_BLOCKS), 'by_programDayId', 'programDayId');
  ensureIndex(ensureStore(db, tx, S.WORKOUT_BLOCKS), 'by_orderIndex', 'orderIndex');

  ensureIndex(ensureStore(db, tx, S.WORKOUT_PROGRESS), 'by_programDayId', 'programDayId');
  ensureIndex(ensureStore(db, tx, S.WORKOUT_PROGRESS), 'by_status', 'status');

  ensureIndex(ensureStore(db, tx, S.WORKOUT_HISTORY), 'by_programId', 'programId');
  ensureIndex(ensureStore(db, tx, S.WORKOUT_HISTORY), 'by_programDayId', 'programDayId');
  ensureIndex(ensureStore(db, tx, S.WORKOUT_HISTORY), 'by_completedAt', 'completedAt');
  ensureIndex(ensureStore(db, tx, S.WORKOUT_HISTORY), 'by_status', 'status');

  ensureIndex(ensureStore(db, tx, S.USER_FEEDBACK), 'by_programId', 'programId');
  ensureIndex(ensureStore(db, tx, S.USER_FEEDBACK), 'by_programDayId', 'programDayId');
  ensureIndex(ensureStore(db, tx, S.USER_FEEDBACK), 'by_createdAt', 'createdAt');

  ensureIndex(ensureStore(db, tx, S.PROGRAM_AUDITS), 'by_programVersionId', 'programVersionId');
  ensureIndex(ensureStore(db, tx, S.PROGRAM_AUDITS), 'by_checkedAt', 'checkedAt');
}

export const migrations = [
  { version: 1, run: migrationV1 },
  { version: 2, run: migrationV2 },
];