/**
 * IDEMPOTENT BOXING MOVE SEED
 * --------------------------------------------------------------
 * Stabil ID üzerinden upsert (put). PART 32 sonrası 18 hareket
 * kaydı upsert edilir. Canonical alanlar mevcut kaydın üzerine
 * güvenli şekilde eşitlenir; createdAt korunur.
 *
 * UI içine hardcode seed YAPILMAZ; repository üzerinden IndexedDB'ye yazılır.
 * --------------------------------------------------------------
 */
import { boxingMoveRepository } from '@/lib/localData/repositories/boxingMoveRepository';
import { BOXING_MOVES, validateBoxingMoveLibrary } from './boxingMoves';
import { nowIso } from '@/lib/localData/time';

export async function seedBoxingMoves() {
  const validation = validateBoxingMoveLibrary(BOXING_MOVES);
  if (!validation.valid) {
    throw new Error(`Boxing move library geçersiz: ${validation.error}`);
  }
  const now = nowIso();
  for (const move of BOXING_MOVES) {
    const existing = await boxingMoveRepository.getById(move.id);
    const record = {
      ...move,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await boxingMoveRepository.save(record);
  }
  return { count: BOXING_MOVES.length };
}