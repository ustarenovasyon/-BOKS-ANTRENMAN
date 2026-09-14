/**
 * COMBINATION LIBRARY INITIALIZATION
 * Yalnız version değil; canonical coverage + sequenceKey fingerprint
 * integrity check yapar. Eksik/bozuk canonical kayıt güvenli upsert ile repair.
 */
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { boxingCombinationRepository } from '@/lib/localData/repositories/boxingCombinationRepository';
import { seedBoxingCombinations } from './seedBoxingCombinations';
import { BOXING_COMBINATIONS } from './boxingCombinations';
import { BOXING_COMBINATION_LIBRARY_VERSION } from '@/config/architecture';

async function isLibraryIntact() {
  try {
    const all = await boxingCombinationRepository.list();
    const byId = new Map(all.map((c) => [c.id, c]));
    return BOXING_COMBINATIONS.every((c) => {
      const stored = byId.get(c.id);
      return !!stored && stored.sequenceKey === c.sequenceKey && stored.moveCount === c.moveCount;
    });
  } catch {
    return false;
  }
}

export async function ensureBoxingCombinationLibrary() {
  const meta = await appMetaRepository.get();
  const versionOk = meta?.boxingCombinationLibraryVersion === BOXING_COMBINATION_LIBRARY_VERSION;
  const intact = versionOk ? await isLibraryIntact() : false;
  if (versionOk && intact) {
    return { seeded: false };
  }
  await seedBoxingCombinations();
  await appMetaRepository.update({ boxingCombinationLibraryVersion: BOXING_COMBINATION_LIBRARY_VERSION });
  return { seeded: true };
}