/**
 * TRANSITION MATRIX INITIALIZATION
 * Yalnız version kontrolü DEĞİL; canonical ID coverage integrity check de yapar.
 * Version uyumlu + 17 canonical ID mevcutsa seed'i atlar; eksikse repair/upsert.
 */
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { boxingTransitionRepository } from '@/lib/localData/repositories/boxingTransitionRepository';
import { seedBoxingTransitions } from './seedBoxingTransitions';
import { BOXING_TRANSITIONS } from './boxingTransitions';
import { BOXING_TRANSITION_MATRIX_VERSION } from '@/config/architecture';

async function isMatrixIntact() {
  try {
    const all = await boxingTransitionRepository.list();
    const expected = BOXING_TRANSITIONS.map((t) => t.id);
    const present = new Set(all.map((t) => t.id));
    return expected.every((id) => present.has(id));
  } catch {
    return false;
  }
}

export async function ensureBoxingTransitionMatrix() {
  const meta = await appMetaRepository.get();
  const versionOk = meta?.boxingTransitionMatrixVersion === BOXING_TRANSITION_MATRIX_VERSION;
  const intact = versionOk ? await isMatrixIntact() : false;
  if (versionOk && intact) {
    return { seeded: false };
  }
  await seedBoxingTransitions();
  await appMetaRepository.update({ boxingTransitionMatrixVersion: BOXING_TRANSITION_MATRIX_VERSION });
  return { seeded: true };
}