/**
 * STRENGTH TEMPLATE LIBRARY INITIALIZATION
 * Version + canonical coverage + sequenceKey/movementCount fingerprint.
 * Eksik/bozuk canonical kayıt güvenli upsert ile repair.
 */
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { strengthTemplateRepository } from '@/lib/localData/repositories/strengthTemplateRepository';
import { seedStrengthTemplates } from './seedStrengthTemplates';
import { STRENGTH_TEMPLATES } from './strengthTemplates';
import { STRENGTH_TEMPLATE_LIBRARY_VERSION } from '@/config/architecture';

async function isLibraryIntact() {
  try {
    const all = await strengthTemplateRepository.list();
    const byId = new Map(all.map((t) => [t.id, t]));
    return STRENGTH_TEMPLATES.every((t) => {
      const stored = byId.get(t.id);
      return !!stored && stored.sequenceKey === t.sequenceKey && stored.movementCount === t.movementCount;
    });
  } catch {
    return false;
  }
}

export async function ensureStrengthTemplateLibrary() {
  const meta = await appMetaRepository.get();
  const versionOk = meta?.strengthTemplateLibraryVersion === STRENGTH_TEMPLATE_LIBRARY_VERSION;
  const intact = versionOk ? await isLibraryIntact() : false;
  if (versionOk && intact) {
    return { seeded: false };
  }
  await seedStrengthTemplates();
  await appMetaRepository.update({ strengthTemplateLibraryVersion: STRENGTH_TEMPLATE_LIBRARY_VERSION });
  return { seeded: true };
}