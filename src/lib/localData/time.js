/**
 * Timestamp standardı: kalıcı kayıtlarda UTC ISO 8601 string.
 * Alanlar: createdAt, updatedAt, completedAt, pausedAt, lastCheckpointAt vb.
 * Arayüzde Türkçe tarih/saat gösterilebilir; DB içinde tek format.
 */
/** Cihaz local civil date → YYYY-MM-DD (UTC kaydırma YOK). */
export function localCivilDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function nowIso() {
  return new Date().toISOString();
}