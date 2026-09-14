/**
 * DOMAIN REPOSITORY KATMANI
 * --------------------------------------------------------------
 * Sonraki Partlar IndexedDB kodu yazmaz; bu repository'leri kullanır.
 * Tüm store adları merkezi LOCAL_DB.STORES sabitinden gelir (typo/duplicate önler).
 * Repository'ler veri saklama/okuma dışında business logic içermez.
 *
 * Domain store'ları şu an BOŞTUR (içerik sonraki Partlarda gelecek).
 * --------------------------------------------------------------
 */
import { createRepository } from '../baseRepository';
import { LOCAL_DB } from '@/config/architecture';

const S = LOCAL_DB.STORES;

export const programRepository = createRepository(S.PROGRAMS);
export const programVersionRepository = createRepository(S.PROGRAM_VERSIONS);
export const programDayRepository = createRepository(S.PROGRAM_DAYS);
export const workoutBlockRepository = createRepository(S.WORKOUT_BLOCKS);
export const workoutProgressRepository = createRepository(S.WORKOUT_PROGRESS);
export const workoutHistoryRepository = createRepository(S.WORKOUT_HISTORY);
export const feedbackRepository = createRepository(S.USER_FEEDBACK);
export { boxingMoveRepository } from './boxingMoveRepository';
export { boxingCombinationRepository } from './boxingCombinationRepository';
export { boxingTransitionRepository } from './boxingTransitionRepository';
export { defenseCounterRepository } from './defenseCounterRepository';
export { strengthExerciseRepository } from './strengthExerciseRepository';
export { strengthTemplateRepository } from './strengthTemplateRepository';
export const programAuditRepository = createRepository(S.PROGRAM_AUDITS);