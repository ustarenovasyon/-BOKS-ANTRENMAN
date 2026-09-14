/**
 * DETERMINISTIC SELECTION (PART 15)
 * --------------------------------------------------------------
 * Math.random YOK. Stable hash + deterministic tie-break.
 * Aynı seed+input → aynı seçim.
 * --------------------------------------------------------------
 */

/** djb2 variant, uint32. */
export function stableHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Deterministic index picker. */
export function pickIndex(seed, length, ...parts) {
  if (length <= 0) return -1;
  return stableHash([seed, ...parts].join('|')) % length;
}

/**
 * Deterministic tie-break: candidates sorted by scoreFn asc, then
 * stable hash-based jitter for equal-score ties (optional).
 * Returns best candidate.
 */
export function pickBest(candidates, scoreFn, seed, ...tieParts) {
  if (!candidates || candidates.length === 0) return null;
  const scored = candidates.map((c, i) => ({ c, score: scoreFn(c), i }));
  scored.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return 0;
  });
  // deterministic tie-break: among equal-score min, pick by hash(candidateId)
  const minScore = scored[0].score;
  const ties = scored.filter((s) => s.score === minScore);
  if (ties.length === 1) return ties[0].c;
  let best = ties[0];
  let bestHash = stableHash([seed, ...tieParts, idOf(ties[0].c)].join('|'));
  for (let i = 1; i < ties.length; i++) {
    const h = stableHash([seed, ...tieParts, idOf(ties[i].c)].join('|'));
    if (h < bestHash) { best = ties[i]; bestHash = h; }
  }
  return best.c;
}

function idOf(c) {
  return (c && (c.id || c.combinationId || c.templateId)) || String(c);
}