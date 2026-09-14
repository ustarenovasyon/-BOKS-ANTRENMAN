/**
 * GENERATION REASON → Türkçe mapping (PART 16.91)
 * --------------------------------------------------------------
 * Developer reason code'larını kullanıcı dostu mesaja çevirir.
 * Fail'i saklamaz. Ham stack trace göstermez.
 * --------------------------------------------------------------
 */
import { PROGRAM_GENERATION_REASON_CODES as R } from '@/config/architecture';

const MAP = {
  [R.PROGRAM_INVALID_SETTINGS]: 'Program ayarlarında eksik/geçersiz değer var.',
  [R.PROGRAM_INVALID_GENERATION_DATE]: 'Program tarihi alınamadı.',
  [R.PROGRAM_NO_SCHEDULED_DAYS]: 'Seçilen günlerde planlanacak antrenman günü bulunamadı.',
  [R.PROGRAM_PROGRESSION_FAILED]: 'Program ilerleyim planı oluşturulamadı.',
  [R.PROGRAM_WEEKLY_BALANCE_FAILED]: 'Haftalık denge planı oluşturulamadı.',
  [R.PROGRAM_NO_ELIGIBLE_BOXING_COMBINATION]: 'Uygun boks kombinasyonu bulunamadı.',
  [R.PROGRAM_NO_ELIGIBLE_STRENGTH_TEMPLATE]: 'Seçili ekipman/süre için uygun kuvvet iskeleti bulunamadı.',
  [R.PROGRAM_NO_TEMPLATE_WITHIN_BALANCED_CAP]: 'Dengeli süre sınırı içinde uygun kuvvet iskeleti bulunamadı.',
  [R.PROGRAM_STRENGTH_PRESCRIPTION_DOES_NOT_FIT]: 'Kuvvet set/tekrar planı süreye sığmadı.',
  [R.PROGRAM_DAY_TIME_MISMATCH]: 'Günlük süre bütçesi uyuşmuyor.',
  [R.PROGRAM_BOXING_VALIDATION_FAILED]: 'Boks içeriği doğrulanamadı.',
  [R.PROGRAM_DEFENSE_VALIDATION_FAILED]: 'Savunma/kontra içeriği doğrulanamadı.',
  [R.PROGRAM_STRENGTH_VALIDATION_FAILED]: 'Kuvvet içeriği doğrulanamadı.',
  [R.PROGRAM_BLUEPRINT_VALIDATION_FAILED]: 'Program planı bütünlük doğrulamasından geçemedi.',
  [R.PROGRAM_IDEMPOTENCY_CONFLICT]: 'Aynı istek farklı içerikle çakıştı.',
  [R.PROGRAM_PERSISTENCE_FAILED]: 'Program kaydedilemedi.',
};

export function mapProgramReason(reason) {
  return MAP[reason] || 'Program oluşturulamadı. Ayarları kontrol edip tekrar dene.';
}