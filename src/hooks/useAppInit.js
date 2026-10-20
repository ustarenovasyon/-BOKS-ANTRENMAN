import { useState, useEffect, useCallback } from 'react';
import { settingsRepository } from '@/lib/localData/settingsRepository';
import { appMetaRepository } from '@/lib/localData/appMetaRepository';
import { ensureBoxingMoveLibrary } from '@/features/boxing/library/ensureBoxingMoveLibrary';
import { ensureStrengthExerciseLibrary } from '@/features/strength/library/ensureStrengthExerciseLibrary';
import { ensureBoxingTransitionMatrix } from '@/features/boxing/transitions/ensureBoxingTransitionMatrix';
import { ensureBoxingCombinationLibrary } from '@/features/boxing/combinations/ensureBoxingCombinationLibrary';
import { ensureDefenseCounterLibrary } from '@/features/boxing/defense/ensureDefenseCounterLibrary';
import { ensureStrengthTemplateLibrary } from '@/features/strength/templates/ensureStrengthTemplateLibrary';
import {ensureDailyBackup} from '@/features/backup/dataBackup';
import {loadAppPreferences,applyTheme} from '@/features/settings/appPreferences';

/**
 * Güvenli yerel başlatma akışı.
 * İnternet / harici backend / auth / AI beklemez — yalnızca yerel DB'yi
 * hazırlar (settings + app_meta). Başarısız olursa beyaz ekran yerine
 * kontrollü hata durumu verir.
 */
export function useAppInit() {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [warning,setWarning]=useState('');

  const run = useCallback(async () => {
    setStatus('loading');
    setWarning('');
    try {
      await settingsRepository.ensureInitialized();
      await appMetaRepository.ensureInitialized();
      await ensureBoxingMoveLibrary();
      await ensureStrengthExerciseLibrary();
      await ensureBoxingTransitionMatrix();
      await ensureBoxingCombinationLibrary();
      await ensureDefenseCounterLibrary();
      await ensureStrengthTemplateLibrary();
      applyTheme((await loadAppPreferences()).theme);
      try{await ensureDailyBackup();}catch{setWarning('Otomatik yerel yedek alınamadı. Ayarlar’dan JSON yedeğini indir.');}
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

  return { status, retry, warning };
}
