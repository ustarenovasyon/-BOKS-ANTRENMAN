/**
 * IDEMPOTENT STRENGTH EXERCISE SEED
 * Stabil ID üzerinden upsert. PART 5 tekrar çalışsa count 9 kalır (18 olmaz).
 * Canonical alanlar mevcut kaydın üzerine güvenli eşitlenir; createdAt korunur.
 */
import { strengthExerciseRepository } from '@/lib/localData/repositories/strengthExerciseRepository';
import { STRENGTH_EXERCISES, validateStrengthExerciseLibrary } from './strengthExercises';
import { nowIso } from '@/lib/localData/time';

export async function seedStrengthExercises() {
  const validation = validateStrengthExerciseLibrary(STRENGTH_EXERCISES);
  if (!validation.valid) {
    throw new Error(`Strength exercise library geçersiz: ${validation.error}`);
  }
  const now = nowIso();
  for (const exercise of STRENGTH_EXERCISES) {
    const existing = await strengthExerciseRepository.getById(exercise.id);
    const record = {
      ...exercise,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await strengthExerciseRepository.save(record);
  }
  return { count: STRENGTH_EXERCISES.length };
}