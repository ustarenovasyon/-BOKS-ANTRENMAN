/**
 * PROGRAM PREVIEW LABELS & FORMAT HELPERS (PART 16)
 * --------------------------------------------------------------
 * Yalnız display layer. Canonical DB enum'lar DEĞİŞMEZ.
 * Tarih: civil-date string parse (Date object tuzağı YOK).
 * Süre: tek formatSeconds standardı.
 * --------------------------------------------------------------
 */
import {
  PROGRESSION_PHASES, WEEKLY_PROGRESSION_FOCUS, WEEKLY_SESSION_ROLES,
  BOXING_THREAT_TYPES, WORKOUT_BLOCK_TYPES, BOXING_RANGE_CLASSES,
} from '@/config/architecture';

export const PHASE_LABELS = {
  [PROGRESSION_PHASES.FOUNDATION]: 'Temel',
  [PROGRESSION_PHASES.DEVELOPMENT]: 'Gelişim',
  [PROGRESSION_PHASES.EXPANSION]: 'Genişleme',
  [PROGRESSION_PHASES.INTEGRATION]: 'Bütünleştirme',
  [PROGRESSION_PHASES.CONSOLIDATION]: 'Pekiştirme',
};

export const FOCUS_LABELS = {
  [WEEKLY_PROGRESSION_FOCUS.BOXING_COMPLEXITY]: 'Kombinasyon Gelişimi',
  [WEEKLY_PROGRESSION_FOCUS.BOXING_WORK_CAPACITY]: 'Boks Çalışma Kapasitesi',
  [WEEKLY_PROGRESSION_FOCUS.STRENGTH_MOVEMENT_DENSITY]: 'Kuvvet Hareket Yoğunluğu',
  [WEEKLY_PROGRESSION_FOCUS.STRENGTH_PRESCRIPTION]: 'Kuvvet Çalışma Yoğunluğu',
  [WEEKLY_PROGRESSION_FOCUS.DEFENSE_INTEGRATION]: 'Savunma + Kontra',
  [WEEKLY_PROGRESSION_FOCUS.BALANCED_TECHNIQUE]: 'Dengeli Teknik',
};

export const ROLE_LABELS = {
  [WEEKLY_SESSION_ROLES.BOXING_ONLY_DAY]: 'Boks',
  [WEEKLY_SESSION_ROLES.STRENGTH_ONLY_DAY]: 'Kuvvet',
  [WEEKLY_SESSION_ROLES.COMBINED_BOXING_STRENGTH_DAY]: 'Boks + Kuvvet',
  [WEEKLY_SESSION_ROLES.UNSCHEDULED_DAY]: 'Boş',
};

export const THREAT_LABELS = {
  [BOXING_THREAT_TYPES.OPPONENT_LEAD_STRAIGHT]: 'Rakibin Lead Straight',
  [BOXING_THREAT_TYPES.OPPONENT_REAR_STRAIGHT]: 'Rakibin Rear Straight',
};

export const RANGE_LABELS = {
  [BOXING_RANGE_CLASSES.LONG]: 'Uzun',
  [BOXING_RANGE_CLASSES.MID]: 'Orta',
  [BOXING_RANGE_CLASSES.CLOSE]: 'Yakın',
  [BOXING_RANGE_CLASSES.VARIABLE]: 'Değişken',
};

export const BLOCK_TYPE_LABELS = {
  [WORKOUT_BLOCK_TYPES.WARMUP]: 'Isınma',
  [WORKOUT_BLOCK_TYPES.BOXING_ATTACK_WORK]: 'Boks Çalışması',
  [WORKOUT_BLOCK_TYPES.BOXING_DEFENSE_WORK]: 'Savunma + Kontra',
  [WORKOUT_BLOCK_TYPES.BOXING_REST]: 'Dinlenme',
  [WORKOUT_BLOCK_TYPES.MODE_TRANSITION]: 'Boks → Kuvvet Geçişi',
  [WORKOUT_BLOCK_TYPES.STRENGTH_EXERCISE]: 'Kuvvet',
  [WORKOUT_BLOCK_TYPES.COOLDOWN]: 'Soğuma / Toparlanma',
};

export const PREVIEWABLE_STATUSES = ['review_required', 'review_failed', 'ready_for_approval', 'active'];

/** Tek program-status display source (Programs + Preview ortak). */
export const PROGRAM_STATUS_LABELS = {
  draft: 'Taslak',
  review_required: 'İnceleme Bekliyor',
  review_failed: 'İnceleme Başarısız',
  ready_for_approval: 'Onaya Hazır',
  active: 'Aktif',
  paused: 'Duraklatıldı',
  completed: 'Tamamlandı',
  archived: 'Arşivlendi',
};

/** Saniye → "MM:SS" (≥3600 ise "H:MM:SS"). Tek standart. */
export function formatSeconds(total) {
  const s = Math.max(0, Math.floor(total));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    return `${h}:${String(mm).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

const TR_MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

/** YYYY-MM-DD → "21 Eylül 2026". Date object YOK (timezone-safe). */
export function formatCivilDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [, m, d] = parts.map(Number);
  if (!m || !d) return dateStr;
  return `${d} ${TR_MONTHS[m - 1]} ${parts[0]}`;
}

/** ISO string → "21 Eylül 2026" (ilk 10 karakter civil date). */
export function formatIsoCivilDate(iso) {
  if (!iso || typeof iso !== 'string') return '—';
  return formatCivilDate(iso.slice(0, 10));
}

export const PREVIEW_ERROR_MESSAGES = {
  PREVIEW_PROGRAM_NOT_FOUND: 'Program bulunamadı.',
  PREVIEW_VERSION_NOT_FOUND: 'Program sürümü bulunamadı.',
  PREVIEW_DATA_INTEGRITY_FAILED: 'Program verileri eksik veya bozuk. İnceleme devam ettirilemedi.',
  PREVIEW_FINGERPRINT_MISMATCH: 'Program verilerinin bütünlüğü doğrulanamadı. Program yeniden oluşturulmadan inceleme devam ettirilmedi.',
  PREVIEW_MISSING_WORKOUT_BLOCKS: 'Bir veya daha fazla antrenman gününün blok içeriği eksik.',
  PREVIEW_INVALID_BLOCK_ORDER: 'Blok sıralamasında bozukluk (tekrarlayan/atlanan sıra) tespit edildi.',
  PREVIEW_UNKNOWN_BLOCK_TYPE: 'Bilinmeyen blok tipi tespit edildi.',
  PREVIEW_READ_FAILED: 'Program verileri okunamadı.',
  PREVIEW_NOT_PREVIEWABLE: 'Bu program durumu henüz önizlemeye uygun değil.',
  PREVIEW_UNSUPPORTED_GENERATION_POLICY_VERSION: 'Bu programın oluşturma politikası sürümü desteklenmiyor veya henüz aktif değil.',
};