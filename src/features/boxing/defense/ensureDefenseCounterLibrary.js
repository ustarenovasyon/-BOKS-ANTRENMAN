/**
 * DEFENSE COUNTER LIBRARY INITIALIZATION
 * Version + canonical ID coverage integrity check. Eksikse repair/upsert.
 */
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { defenseCounterRepository } from '@/lib/localData/repositories/defenseCounterRepository';
import { seedDefenseCounterRules } from './seedDefenseCounterRules';
import { DEFENSE_COUNTER_RULES } from './defenseCounterRules';
import { BOXING_DEFENSE_COUNTER_LIBRARY_VERSION } from '@/config/architecture';

async function isLibraryIntact() {
  try {
    const all = await defenseCounterRepository.list();
    const byId = new Map(all.map((r) => [r.id, r]));
    return DEFENSE_COUNTER_RULES.every((r) => {
      const stored = byId.get(r.id);
      return !!stored && stored.defenseMoveId === r.defenseMoveId
        && Array.isArray(stored.counterMoveIds) && stored.counterMoveIds.join('>') === r.counterMoveIds.join('>');
    });
  } catch {
    return false;
  }
}

export async function ensureDefenseCounterLibrary() {
  const meta = await appMetaRepository.get();
  const versionOk = meta?.boxingDefenseCounterLibraryVersion === BOXING_DEFENSE_COUNTER_LIBRARY_VERSION;
  const intact = versionOk ? await isLibraryIntact() : false;
  if (versionOk && intact) {
    return { seeded: false };
  }
  await seedDefenseCounterRules();
  await appMetaRepository.update({ boxingDefenseCounterLibraryVersion: BOXING_DEFENSE_COUNTER_LIBRARY_VERSION });
  return { seeded: true };
}