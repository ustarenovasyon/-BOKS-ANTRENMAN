/**
 * PROGRAM CORRECTION ENGINE SABİTLERİ (PART 18)
 * --------------------------------------------------------------
 * Deterministic local correction engine. AI/remote YOK.
 * REVIEW_FAILED version'ı mutate ETMEZ. Yeni ProgramVersion üretir.
 * PROGRAM_CORRECTION_ENGINE_VERSION != DB schema version (DB stays v2).
 * --------------------------------------------------------------
 */
import { PROGRAM_CORRECTION_ENGINE_VERSION } from '@/config/architecture';

export { PROGRAM_CORRECTION_ENGINE_VERSION };

export const CORRECTION_REASON_CODES = Object.freeze({
  CORRECTION_PROGRAM_NOT_FOUND: 'correction_program_not_found',
  CORRECTION_VERSION_NOT_FOUND: 'correction_version_not_found',
  CORRECTION_NOT_REVIEW_FAILED: 'correction_not_review_failed',
  CORRECTION_AUDIT_NOT_FOUND: 'correction_audit_not_found',
  CORRECTION_AUDIT_NOT_FAILED: 'correction_audit_not_failed',
  CORRECTION_SOURCE_FINGERPRINT_MISMATCH: 'correction_source_fingerprint_mismatch',
  CORRECTION_REBUILD_FAILED: 'correction_rebuild_failed',
  CORRECTION_VALIDATION_FAILED: 'correction_validation_failed',
  CORRECTION_PERSISTENCE_FAILED: 'correction_persistence_failed',
  CORRECTION_NOT_POSSIBLE: 'correction_not_possible',
});

export const CORRECTION_REASON_LABELS = Object.freeze({
  [CORRECTION_REASON_CODES.CORRECTION_PROGRAM_NOT_FOUND]: 'Program bulunamadı.',
  [CORRECTION_REASON_CODES.CORRECTION_VERSION_NOT_FOUND]: 'Program sürümü bulunamadı.',
  [CORRECTION_REASON_CODES.CORRECTION_NOT_REVIEW_FAILED]: 'Düzeltme yalnızca incelemesi başarısız programlar için kullanılabilir.',
  [CORRECTION_REASON_CODES.CORRECTION_AUDIT_NOT_FOUND]: 'Programın kontrol kaydı bulunamadı.',
  [CORRECTION_REASON_CODES.CORRECTION_AUDIT_NOT_FAILED]: 'Program kontrolü başarısız olmadığından düzeltme gerekmez.',
  [CORRECTION_REASON_CODES.CORRECTION_SOURCE_FINGERPRINT_MISMATCH]: 'Program içeriği beklenmedik şekilde değişmiş. Düzeltme güvenli şekilde başlatılamadı.',
  [CORRECTION_REASON_CODES.CORRECTION_REBUILD_FAILED]: 'Program aynı ayarlarla yeniden üretilirken hata oluştu.',
  [CORRECTION_REASON_CODES.CORRECTION_VALIDATION_FAILED]: 'Düzeltilen program doğrulamadan geçemedi.',
  [CORRECTION_REASON_CODES.CORRECTION_PERSISTENCE_FAILED]: 'Düzeltilen program kaydedilemedi.',
  [CORRECTION_REASON_CODES.CORRECTION_NOT_POSSIBLE]: 'Program bu ayarlarla düzeltilemiyor. Ayarlarınızı değiştirip yeniden deneyin.',
});