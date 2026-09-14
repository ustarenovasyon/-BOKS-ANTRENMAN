/**
 * AUDIT LOADER (PART 17)
 * --------------------------------------------------------------
 * Persisted DB entities source-of-truth. Preview view-model KULLANILMAZ.
 * Generator ÇAĞRILMAZ. Read-only repository erişimi.
 * --------------------------------------------------------------
 */
import {
  programRepository, programVersionRepository, programDayRepository, workoutBlockRepository,
} from '@/lib/localData/repositories';

export async function loadProgramSnapshot(programId) {
  const program = await programRepository.getById(programId);
  if (!program) return { found: false, reason: 'AUDIT_PROGRAM_NOT_FOUND' };
  if (!program.currentVersionId) return { found: true, reason: 'AUDIT_VERSION_NOT_FOUND', program };
  const programVersion = await programVersionRepository.getById(program.currentVersionId);
  if (!programVersion) return { found: true, reason: 'AUDIT_VERSION_NOT_FOUND', program };
  const programDays = await programDayRepository.getAllByIndex('by_programVersionId', programVersion.id);
  const workoutBlocks = [];
  for (const d of programDays || []) {
    const bs = await workoutBlockRepository.getAllByIndex('by_programDayId', d.id);
    for (const b of bs || []) workoutBlocks.push(b);
  }
  return { found: true, program, programVersion, programDays: programDays || [], workoutBlocks };
}