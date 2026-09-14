/**
 * CATALOG INITIALIZATION
 * Uygulama açılışında bir kez çalışır. app_meta içindeki libraryVersion
 * beklenen değerle aynıysa seed'i atlar (her açılışta 18 PUT yapmaz).
 * İnternet beklemez; tamamen yerel.
 */
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { seedBoxingMoves } from './seedBoxingMoves';
import { BOXING_MOVE_LIBRARY_VERSION } from '@/config/architecture';

export async function ensureBoxingMoveLibrary() {
  const meta = await appMetaRepository.get();
  if (meta?.boxingMoveLibraryVersion === BOXING_MOVE_LIBRARY_VERSION) {
    return { seeded: false };
  }
  await seedBoxingMoves();
  await appMetaRepository.update({ boxingMoveLibraryVersion: BOXING_MOVE_LIBRARY_VERSION });
  return { seeded: true };
}