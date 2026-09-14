/**
 * IDEMPOTENT BOXING TRANSITION SEED
 * Stabil transition ID ile upsert. Tekrar çalışında count 17 kalır (34 olmaz).
 * Canonical alanlar mevcut kaydın üzerine güvenli eşitlenir; createdAt korunur.
 */
import { boxingTransitionRepository } from '@/lib/localData/repositories/boxingTransitionRepository';
import { BOXING_TRANSITIONS, validateTransitionLibrary } from './boxingTransitions';
import { nowIso } from '@/lib/localData/time';

export async function seedBoxingTransitions() {
  const validation = validateTransitionLibrary(BOXING_TRANSITIONS);
  if (!validation.valid) {
    throw new Error(`Transition library geçersiz: ${validation.error}`);
  }
  const now = nowIso();
  for (const transition of BOXING_TRANSITIONS) {
    const existing = await boxingTransitionRepository.getById(transition.id);
    const record = {
      ...transition,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await boxingTransitionRepository.save(record);
  }
  return { count: BOXING_TRANSITIONS.length };
}