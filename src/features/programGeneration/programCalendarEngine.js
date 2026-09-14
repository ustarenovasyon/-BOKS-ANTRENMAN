/**
 * PROGRAM CALENDAR ENGINE (PART 15)
 * --------------------------------------------------------------
 * Civil-date arithmetic (timezone-safe, UTC weekday). Date.now() YOK.
 * Start date, end-exclusive, scheduled dates, week/month index.
 * Yalnız selected weekdays schedule edilir. Partial hafta desteklenir.
 * --------------------------------------------------------------
 */
import { WEEKDAYS } from '@/config/architecture';

function parseYMD(s) {
  const parts = String(s).split('-').map(Number);
  return { y: parts[0], m: parts[1], d: parts[2] };
}
function toYMD(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
/** Ayın son günü (m 1-based). Date.UTC(y,m,0) = previous month last day. */
export function daysInMonth(y, m) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
/** Calendar month ekle, günü hedef ay son gününe clamp (31 Oca +1 → 28/29 Şub). */
export function addCalendarMonthsClamped(dateStr, months) {
  const { y, m, d } = parseYMD(dateStr);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const nd = Math.min(d, daysInMonth(ny, nm));
  return toYMD(ny, nm, nd);
}
/** 0=Monday .. 6=Sunday (UTC, timezone-safe). */
export function weekdayIndex(dateStr) {
  const { y, m, d } = parseYMD(dateStr);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun..6=Sat
  return (dow + 6) % 7;
}
function dayNumber(dateStr) {
  const { y, m, d } = parseYMD(dateStr);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
function nextDate(s) {
  const { y, m, d } = parseYMD(s);
  let nd = d + 1, nm = m, ny = y;
  const last = daysInMonth(y, m);
  if (nd > last) { nd = 1; nm += 1; if (nm > 12) { nm = 1; ny += 1; } }
  return toYMD(ny, nm, nd);
}

/**
 * programStartDate: genDate selected weekday ise aynı, değilse next selected.
 */
export function resolveProgramStartDate(generationLocalDate, selectedWeekdayIndices) {
  const set = new Set(selectedWeekdayIndices);
  if (set.has(weekdayIndex(generationLocalDate))) return generationLocalDate;
  let cur = generationLocalDate;
  for (let i = 0; i < 7; i++) {
    cur = nextDate(cur);
    if (set.has(weekdayIndex(cur))) return cur;
  }
  return generationLocalDate;
}

/**
 * Tüm scheduled dates (startDate inclusive, endDateExclusive exclusive).
 * Sadece selected weekdays. Returns [{date, weekdayIndex, programWeekIndex, programMonthIndex}].
 */
export function buildScheduledDates(programStartDate, endDateExclusive, selectedWeekdayIndices) {
  const set = new Set(selectedWeekdayIndices);
  const startMondayOffset = weekdayIndex(programStartDate); // Monday=0
  const startMondayDayNum = dayNumber(programStartDate) - startMondayOffset;
  const dates = [];
  let cur = programStartDate;
  let guard = 0;
  while (cur < endDateExclusive && guard < 100000) {
    guard++;
    const wi = weekdayIndex(cur);
    if (set.has(wi)) {
      const dn = dayNumber(cur);
      const programWeekIndex = Math.floor((dn - startMondayDayNum) / 7) + 1;
      const programMonthIndex = resolveProgramMonthIndex(programStartDate, cur);
      dates.push({ date: cur, weekdayIndex: wi, programWeekIndex, programMonthIndex });
    }
    cur = nextDate(cur);
  }
  return dates;
}

function resolveProgramMonthIndex(programStartDate, dateStr) {
  for (let k = 1; k <= 12; k++) {
    const segStart = addCalendarMonthsClamped(programStartDate, k - 1);
    const segEnd = addCalendarMonthsClamped(programStartDate, k);
    if (dateStr >= segStart && dateStr < segEnd) return k;
  }
  return 1;
}

export { WEEKDAYS };