/**
 * STRENGTH CATALOG INITIALIZATION
 * app_meta içindeki strengthExerciseLibraryVersion beklenen değerle aynıysa
 * seed'i atlar (her açılışta 9 PUT yapmaz). İnternet beklemez; tamamen yerel.
 */
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { seedStrengthExercises } from './seedStrengthExercises';
import { STRENGTH_EXERCISE_LIBRARY_VERSION } from '@/config/architecture';

export async function ensureStrengthExerciseLibrary() {
  const meta = await appMetaRepository.get();
  if (meta?.strengthExerciseLibraryVersion === STRENGTH_EXERCISE_LIBRARY_VERSION) {
    return { seeded: false };
  }
  await seedStrengthExercises();
  await appMetaRepository.update({ strengthExerciseLibraryVersion: STRENGTH_EXERCISE_LIBRARY_VERSION });
  return { seeded: true };
}