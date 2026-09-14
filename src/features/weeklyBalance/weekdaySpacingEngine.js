/**
 * WEEKDAY SPACING ENGINE (PART 14)
 * --------------------------------------------------------------
 * Cyclic day model (Sunday→Monday adjacent). Strength weekday subset
 * optimizer: adjacent pair min, min-gap max, spread, lexicographic.
 * Deterministic. selectedWeekdays dışına çıkmaz.
 * --------------------------------------------------------------
 */
import { WEEKDAYS } from '@/config/architecture';
import { WEEKDAY_INDEX } from './weeklyBalanceConstants';

/** 0–6 weekday index üzerinden cyclic distance. */
export function cyclicDayDistance(aIdx, bIdx) {
  const d = Math.abs(aIdx - bIdx);
  return Math.min(d, 7 - d);
}

function subsets(arr, k) {
  const result = [];
  const n = arr.length;
  if (k > n || k < 0) return result;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    result.push(idx.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && idx[i] === n - k + i) i -= 1;
    if (i < 0) break;
    idx[i] += 1;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
  return result;
}

function scoreSubset(indices) {
  const sorted = [...indices].sort((a, b) => a - b);
  const k = sorted.length;
  // adjacent strength pairs (cyclic distance == 1)
  let adjacentPairs = 0;
  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      if (cyclicDayDistance(sorted[i], sorted[j]) === 1) adjacentPairs += 1;
    }
  }
  // cyclic gaps
  const gaps = [];
  for (let i = 1; i < k; i++) gaps.push(sorted[i] - sorted[i - 1]);
  if (k > 1) gaps.push(sorted[0] + 7 - sorted[k - 1]);
  const minGap = gaps.length ? Math.min(...gaps) : 0;
  const mean = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  const variance = gaps.reduce((a, g) => a + (g - mean) ** 2, 0);
  return { adjacentPairs, minGap, variance, key: JSON.stringify(sorted) };
}

/**
 * selectedWeekdays içinden exact k adet strength günü seç (deterministic).
 * Öncelik: min adjacent pairs → max min-gap → min variance → lexicographic.
 */
export function chooseStrengthWeekdays(selectedWeekdays, strengthDaysPerWeek) {
  const indices = selectedWeekdays.map((d) => WEEKDAY_INDEX[d]).sort((a, b) => a - b);
  const k = strengthDaysPerWeek;
  if (k <= 0) return [];
  if (k >= indices.length) return indices.slice();
  const candidates = subsets(indices, k);
  let best = null;
  let bestScore = null;
  for (const c of candidates) {
    const s = scoreSubset(c);
    const better = !bestScore
      || s.adjacentPairs < bestScore.adjacentPairs
      || (s.adjacentPairs === bestScore.adjacentPairs && s.minGap > bestScore.minGap)
      || (s.adjacentPairs === bestScore.adjacentPairs && s.minGap === bestScore.minGap && s.variance < bestScore.variance)
      || (s.adjacentPairs === bestScore.adjacentPairs && s.minGap === bestScore.minGap && s.variance === bestScore.variance && s.key < bestScore.key);
    if (better) {
      best = c;
      bestScore = s;
    }
  }
  return best ? best.slice().sort((a, b) => a - b) : [];
}

/** Cyclic adjacent strength pair count for a given strength-day index set. */
export function countAdjacentStrengthPairs(indices) {
  let c = 0;
  for (let i = 0; i < indices.length; i++) {
    for (let j = i + 1; j < indices.length; j++) {
      if (cyclicDayDistance(indices[i], indices[j]) === 1) c += 1;
    }
  }
  return c;
}

export function weekdayByIndex(idx) {
  return WEEKDAYS[idx];
}