/**
 * PROGRAM TERCİHLERİ — validation + normalization (program ÜRETMEZ).
 * Sadece kullanıcı tercihlerini doğrular ve mode'a göre normalize eder.
 * UI'dan gelen geçersiz/manipüle enum değerlerini reddeder.
 */
import {
  PROGRAM_MODES, PROGRAM_DURATION_MONTHS, BOXING_MAX_MOVES, DIFFICULTY_LEVELS,
  EXPERIENCE_LEVELS, BOXING_STANCES, SESSION_DURATION_OPTIONS,
  SESSION_DURATION_LIMITS, STRENGTH_EQUIPMENT, TRAINING_PROFILE,
} from '@/config/architecture';
import { minimumSessionMinutesForMode } from '@/features/sessionBudget/sessionDurationPolicy';
import { nowIso } from '@/lib/localData/time';

export const PROGRAM_MODE_VALUES = Object.values(PROGRAM_MODES);
export const DURATION_VALUES = Object.values(PROGRAM_DURATION_MONTHS);
export const EXPERIENCE_VALUES = Object.values(EXPERIENCE_LEVELS);
export const DIFFICULTY_VALUES = Object.values(DIFFICULTY_LEVELS);
export const STANCE_VALUES = Object.values(BOXING_STANCES);
export const EQUIPMENT_VALUES = Object.values(STRENGTH_EQUIPMENT);

export const LABELS = {
  programMode: {
    [PROGRAM_MODES.BOXING_ONLY]: 'Sadece Boks',
    [PROGRAM_MODES.STRENGTH_ONLY]: 'Sadece Kuvvet',
    [PROGRAM_MODES.BOXING_AND_STRENGTH]: 'Boks + Kuvvet',
  },
  durationMonths: {
    [PROGRAM_DURATION_MONTHS.ONE]: '1 Ay',
    [PROGRAM_DURATION_MONTHS.THREE]: '3 Ay',
    [PROGRAM_DURATION_MONTHS.SIX]: '6 Ay',
  },
  weekdays: {
    MONDAY: 'Pazartesi',
    TUESDAY: 'Salı',
    WEDNESDAY: 'Çarşamba',
    THURSDAY: 'Perşembe',
    FRIDAY: 'Cuma',
    SATURDAY: 'Cumartesi',
    SUNDAY: 'Pazar',
  },
  experienceLevel: {
    [EXPERIENCE_LEVELS.BEGINNER]: 'Başlangıç',
    [EXPERIENCE_LEVELS.INTERMEDIATE]: 'Orta',
    [EXPERIENCE_LEVELS.EXPERIENCED]: 'Deneyimli',
  },
  difficulty: {
    [DIFFICULTY_LEVELS.EASY]: 'Kolay',
    [DIFFICULTY_LEVELS.NORMAL]: 'Normal',
    [DIFFICULTY_LEVELS.HARD]: 'Zor',
  },
  boxingStance: {
    [BOXING_STANCES.ORTHODOX]: 'Sol Gard (Orthodox)',
    [BOXING_STANCES.SOUTHPAW]: 'Sağ Gard (Southpaw)',
  },
  equipment: {
    [STRENGTH_EQUIPMENT.DUMBBELL]: 'Dambıl',
    [STRENGTH_EQUIPMENT.BARBELL]: 'Düz Bar / Halter',
    [STRENGTH_EQUIPMENT.EZ_BAR]: 'Z Bar / EZ Bar',
  },
};

/** Makul UI defaultları — kaydetmeden store'a YAZILMAZ. */
export const DEFAULT_FORM = {
  programMode: '',
  durationMonths: PROGRAM_DURATION_MONTHS.ONE,
  daysPerWeek: 3,
  selectedWeekdays: [],
  sessionDurationMode: 'preset',
  sessionDurationMinutes: 30,
  customMinutes: '',
  experienceLevel: '',
  difficulty: DIFFICULTY_LEVELS.NORMAL,
  preferredTrainingTime: '',
  boxingStance: '',
  boxingMaxMoves: BOXING_MAX_MOVES[0],
  strengthDaysPerWeek: 1,
  availableEquipment: [],
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const hasBoxing = (mode) =>
  mode === PROGRAM_MODES.BOXING_ONLY || mode === PROGRAM_MODES.BOXING_AND_STRENGTH;
export const hasStrength = (mode) =>
  mode === PROGRAM_MODES.STRENGTH_ONLY || mode === PROGRAM_MODES.BOXING_AND_STRENGTH;

export function resolveMinutes(form) {
  if (form.sessionDurationMode === 'custom') {
    const n = parseInt(form.customMinutes, 10);
    return Number.isNaN(n) ? NaN : n;
  }
  return form.sessionDurationMinutes;
}

export function validateProgramPreferences(form) {
  const errors = [];
  const mode = form.programMode;

  if (!PROGRAM_MODE_VALUES.includes(mode)) errors.push('Program türü seç.');
  if (!DURATION_VALUES.includes(form.durationMonths)) errors.push('Program süresi seç.');
  if (!Number.isInteger(form.daysPerWeek) || form.daysPerWeek < 1 || form.daysPerWeek > 7) {
    errors.push('Haftalık gün sayısı 1–7 arasında olmalı.');
  }

  const wd = form.selectedWeekdays || [];
  if (wd.length !== new Set(wd).size) errors.push('Tekrarlanan gün seçimi var.');
  if (wd.length !== form.daysPerWeek) {
    errors.push(`Haftada ${form.daysPerWeek} gün seçtin. Lütfen ${form.daysPerWeek} antrenman günü belirle.`);
  }

  const mins = resolveMinutes(form);
  if (!Number.isInteger(mins) || mins < SESSION_DURATION_LIMITS.MIN || mins > SESSION_DURATION_LIMITS.MAX) {
    errors.push(`Günlük süre ${SESSION_DURATION_LIMITS.MIN}–${SESSION_DURATION_LIMITS.MAX} dakika arasında tam sayı olmalı.`);
  } else if (PROGRAM_MODE_VALUES.includes(mode) && mins < minimumSessionMinutesForMode(mode)) {
    errors.push(`${LABELS.programMode[mode]} için günlük süre en az ${minimumSessionMinutesForMode(mode)} dakika olmalı.`);
  }

  if (!EXPERIENCE_VALUES.includes(form.experienceLevel)) errors.push('Deneyim seviyesi seç.');
  if (!DIFFICULTY_VALUES.includes(form.difficulty)) errors.push('Yoğunluk seç.');

  if (hasBoxing(mode)) {
    if (!STANCE_VALUES.includes(form.boxingStance)) errors.push('Lütfen boks duruşunuzu seçin.');
    if (!BOXING_MAX_MOVES.includes(form.boxingMaxMoves)) errors.push('Maksimum kombinasyon uzunluğu seç.');
  }

  if (hasStrength(mode)) {
    const eq = (form.availableEquipment || []).filter((e) => EQUIPMENT_VALUES.includes(e));
    if (eq.length === 0) {
      errors.push('Dengeli kuvvet programı oluşturabilmek için en az bir mevcut ekipman seç.');
    }
  }

  if (mode === PROGRAM_MODES.BOXING_AND_STRENGTH) {
    const s = form.strengthDaysPerWeek;
    if (!Number.isInteger(s) || s < 1 || s > form.daysPerWeek) {
      errors.push('Kuvvet gün sayısı 1 ile haftalık gün sayısı arasında olmalı.');
    }
  }

  const t = (form.preferredTrainingTime || '').trim();
  if (t && !TIME_RE.test(t)) errors.push('Tercih edilen saat HH:mm formatında olmalı.');

  return { valid: errors.length === 0, errors };
}

/** Mode'a ait olmayan alanları tek standartla temizler. */
export function normalizeProgramPreferences(form) {
  const mode = form.programMode;
  const minutes = resolveMinutes(form);
  const base = {
    id: TRAINING_PROFILE.PRIMARY_ID,
    programMode: mode,
    durationMonths: form.durationMonths,
    daysPerWeek: form.daysPerWeek,
    selectedWeekdays: [...(form.selectedWeekdays || [])],
    sessionDurationMinutes: minutes,
    experienceLevel: form.experienceLevel,
    difficulty: form.difficulty,
    preferredTrainingTime: (form.preferredTrainingTime || '').trim() || null,
  };

  if (hasBoxing(mode)) {
    base.boxingStance = form.boxingStance;
    base.boxingMaxMoves = form.boxingMaxMoves;
  } else {
    base.boxingStance = null;
    base.boxingMaxMoves = null;
  }

  if (mode === PROGRAM_MODES.BOXING_AND_STRENGTH) {
    base.strengthDaysPerWeek = form.strengthDaysPerWeek;
  } else if (mode === PROGRAM_MODES.STRENGTH_ONLY) {
    base.strengthDaysPerWeek = form.daysPerWeek;
  } else {
    base.strengthDaysPerWeek = 0;
  }

  base.availableEquipment = hasStrength(mode)
    ? (form.availableEquipment || []).filter((e) => EQUIPMENT_VALUES.includes(e))
    : [];

  return base;
}

export function toPersistedRecord(normalized, existing) {
  const now = nowIso();
  return {
    ...normalized,
    id: TRAINING_PROFILE.PRIMARY_ID,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
}

export function formFromRecord(record) {
  if (!record) return { ...DEFAULT_FORM };
  const isCustom = !SESSION_DURATION_OPTIONS.includes(record.sessionDurationMinutes);
  return {
    programMode: PROGRAM_MODE_VALUES.includes(record.programMode) ? record.programMode : '',
    durationMonths: DURATION_VALUES.includes(record.durationMonths) ? record.durationMonths : PROGRAM_DURATION_MONTHS.ONE,
    daysPerWeek: Number.isInteger(record.daysPerWeek) ? record.daysPerWeek : 3,
    selectedWeekdays: Array.isArray(record.selectedWeekdays) ? [...record.selectedWeekdays] : [],
    sessionDurationMode: isCustom ? 'custom' : 'preset',
    sessionDurationMinutes: isCustom ? SESSION_DURATION_OPTIONS[0] : record.sessionDurationMinutes,
    customMinutes: isCustom ? String(record.sessionDurationMinutes) : '',
    experienceLevel: EXPERIENCE_VALUES.includes(record.experienceLevel) ? record.experienceLevel : '',
    difficulty: DIFFICULTY_VALUES.includes(record.difficulty) ? record.difficulty : DIFFICULTY_LEVELS.NORMAL,
    preferredTrainingTime: record.preferredTrainingTime || '',
    boxingStance: STANCE_VALUES.includes(record.boxingStance) ? record.boxingStance : '',
    boxingMaxMoves: BOXING_MAX_MOVES.includes(record.boxingMaxMoves) ? record.boxingMaxMoves : BOXING_MAX_MOVES[0],
    strengthDaysPerWeek: Number.isInteger(record.strengthDaysPerWeek) ? record.strengthDaysPerWeek : 1,
    availableEquipment: Array.isArray(record.availableEquipment) ? [...record.availableEquipment] : [],
  };
}
