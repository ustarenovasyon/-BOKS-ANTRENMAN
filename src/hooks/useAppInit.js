import { useState, useEffect, useCallback } from 'react';
import { settingsRepository } from '@/lib/localData/settingsRepository';
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { ensureBoxingMoveLibrary } from '@/features/boxing/library/ensureBoxingMoveLibrary';
import { ensureStrengthExerciseLibrary } from '@/features/strength/library/ensureStrengthExerciseLibrary';
import { ensureBoxingTransitionMatrix } from '@/features/boxing/transitions/ensureBoxingTransitionMatrix';
import { ensureBoxingCombinationLibrary } from '@/features/boxing/combinations/ensureBoxingCombinationLibrary';
import { ensureDefenseCounterLibrary } from '@/features/boxing/defense/ensureDefenseCounterLibrary';
import { ensureStrengthTemplateLibrary } from '@/features/strength/templates/ensureStrengthTemplateLibrary';

/**
 * Güvenli yerel başlatma akışı.
 * İnternet / harici backend / auth / AI beklemez — yalnızca yerel DB'yi
 * hazırlar (settings + app_meta). Başarısız olursa beyaz ekran yerine
 * kontrollü hata durumu verir.
 */
export function useAppInit() {
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const run = useCallback(async () => {
    setStatus('loading');
    try {
      await settingsRepository.ensureInitialized();
      await appMetaRepository.ensureInitialized();
      await ensureBoxingMoveLibrary();
      await ensureStrengthExerciseLibrary();
      await ensureBoxingTransitionMatrix();
      await ensureBoxingCombinationLibrary();
      await ensureDefenseCounterLibrary();
      await ensureStrengthTemplateLibrary();
      setStatus('ready');
    } catch (e) {
      console.error('App init failed:', e);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const retry = useCallback(() => {
    run();
  }, [run]);

  return { status, retry };
}