/**
 * PROGRAM APPROVAL ENGINE SABİTLERİ (PART 18)
 * --------------------------------------------------------------
 * Deterministic local approval engine. AI/remote YOK.
 * READY_FOR_APPROVAL + matching PASS audit → ACTIVE + locked.
 * Blueprint'i MUTATE ETMEZ. Yalnız lifecycle metadata değişir.
 * PROGRAM_APPROVAL_ENGINE_VERSION != DB schema version (DB stays v2).
 * --------------------------------------------------------------
 */
import { PROGRAM_APPROVAL_ENGINE_VERSION } from '@/config/architecture';

export { PROGRAM_APPROVAL_ENGINE_VERSION };

export const APPROVAL_REASON_CODES = Object.freeze({
  APPROVAL_PROGRAM_NOT_FOUND: 'approval_program_not_found',
  APPROVAL_VERSION_NOT_FOUND: 'approval_version_not_found',
  APPROVAL_NOT_READY: 'approval_not_ready',
  APPROVAL_VERSION_LOCKED: 'approval_version_locked',
  APPROVAL_VERSION_MISMATCH: 'approval_version_mismatch',
  APPROVAL_AUDIT_NOT_FOUND: 'approval_audit_not_found',
  APPROVAL_AUDIT_NOT_PASS: 'approval_audit_not_pass',
  APPROVAL_AUDIT_ENGINE_MISMATCH: 'approval_audit_engine_mismatch',
  APPROVAL_AUDIT_VERSION_MISMATCH: 'approval_audit_version_mismatch',
  APPROVAL_AUDIT_FINGERPRINT_MISMATCH: 'approval_audit_fingerprint_mismatch',
  APPROVAL_FINGERPRINT_MISMATCH: 'approval_fingerprint_mismatch',
  APPROVAL_TRANSACTION_FAILED: 'approval_transaction_failed',
});

export const APPROVAL_REASON_LABELS = Object.freeze({
  [APPROVAL_REASON_CODES.APPROVAL_PROGRAM_NOT_FOUND]: 'Program bulunamadı.',
  [APPROVAL_REASON_CODES.APPROVAL_VERSION_NOT_FOUND]: 'Program sürümü bulunamadı.',
  [APPROVAL_REASON_CODES.APPROVAL_NOT_READY]: 'Program henüz onaya hazır değil.',
  [APPROVAL_REASON_CODES.APPROVAL_VERSION_LOCKED]: 'Program sürümü kilitli.',
  [APPROVAL_REASON_CODES.APPROVAL_VERSION_MISMATCH]: 'Program sürümü tutarsız.',
  [APPROVAL_REASON_CODES.APPROVAL_AUDIT_NOT_FOUND]: 'Programın başarılı kontrol kaydı bulunamadı.',
  [APPROVAL_REASON_CODES.APPROVAL_AUDIT_NOT_PASS]: 'Program kontrolünden geçmemiş.',
  [APPROVAL_REASON_CODES.APPROVAL_AUDIT_ENGINE_MISMATCH]: 'Kontrol motoru sürümü uyumsuz.',
  [APPROVAL_REASON_CODES.APPROVAL_AUDIT_VERSION_MISMATCH]: 'Kontrol kaydı farklı bir sürüme ait.',
  [APPROVAL_REASON_CODES.APPROVAL_AUDIT_FINGERPRINT_MISMATCH]: 'Kontrol kaydı parmak izi eşleşmiyor.',
  [APPROVAL_REASON_CODES.APPROVAL_FINGERPRINT_MISMATCH]: 'Programın onaylanan sürümü ile mevcut içerik eşleşmiyor. Yeniden gözden geçirin.',
  [APPROVAL_REASON_CODES.APPROVAL_TRANSACTION_FAILED]: 'Program onaylanırken bir hata oluştu.',
});