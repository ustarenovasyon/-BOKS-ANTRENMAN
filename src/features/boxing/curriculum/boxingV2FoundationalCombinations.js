/**
 * V2 FOUNDATIONAL SUPPLEMENTAL ATTACK COMBINATIONS (PART 24)
 * --------------------------------------------------------------
 * V2-only supplemental foundational 2-move combos using exclusively
 * Stage 1 movements (Jab, Cross). Solves the PART 23 Stage 1 + cap 2
 * diversity risk (1 candidate → 3 candidates).
 *
 * Invariants:
 *  - V1 selector NEVER sees these combos.
 *  - Only Jab and Cross used — Stage 1 curriculum only.
 *  - Each adjacent pair exists in the canonical transition whitelist.
 *  - requiredStage is DERIVED via getComboRequiredStage (not hardcoded).
 *  - No duplicate ID or sequence vs canonical 52.
 *  - Immutable definitions (Object.freeze on arrays/objects).
 * --------------------------------------------------------------
 */
import { BOXING_MOVES, BOXING_MOVE_IDS } from '@/features/boxing/library/boxingMoves';
import { BOXING_TRANSITIONS } from '@/features/boxing/transitions/boxingTransitions';
import { BOXING_COMBINATION_CATEGORY } from '@/config/architecture';

const I = BOXING_MOVE_IDS;

const MOVE_BY_ID = Object.freeze(Object.fromEntries(BOXING_MOVES.map((m) => [m.id, m])));

/** V2 supplemental library version (separate from canonical V1 library version). */
const V2_FOUNDATIONAL_LIBRARY_VERSION = 1;

/** V2 supplemental source class identifier. */
const V2_FOUNDATIONAL_SOURCE_CLASS = 'app_v2_foundational_supplement_v1';

/** Transition pair index (from>to) for allowedRanges derivation. */
const PAIR_INDEX = Object.freeze(
  Object.fromEntries(BOXING_TRANSITIONS.map((t) => [`${t.fromMoveId}>${t.toMoveId}`, t]))
);

/** Adjacent transition allowedRanges intersection (same logic as canonical library). */
function deriveAllowedWorkingRanges(moveIds) {
  let allowed = null;
  for (let i = 0; i < moveIds.length - 1; i++) {
    const t = PAIR_INDEX[`${moveIds[i]}>${moveIds[i + 1]}`];
    if (!t) return [];
    allowed = allowed ? allowed.filter((r) => t.allowedRanges.includes(r)) : t.allowedRanges.slice();
    if (allowed.length === 0) return [];
  }
  return allowed || [];
}

/**
 * Raw V2 supplemental foundational definitions.
 * Cross → Cross REJECTED: BOX_TR_CROSS_CROSS does not exist in transition whitelist.
 */
const RAW_V2_FOUNDATIONAL = [
  { id: 'BOX_V2_COMBO_02_FND_001', sortOrder: 1, moveIds: [I.JAB, I.JAB] },
  { id: 'BOX_V2_COMBO_02_FND_002', sortOrder: 2, moveIds: [I.CROSS, I.JAB] },
];

/** Build a frozen combo object compatible with the selector schema. */
function buildV2Combo(raw) {
  const moveIds = raw.moveIds;
  return Object.freeze({
    id: raw.id,
    moveIds: Object.freeze(moveIds.slice()),
    moveCount: moveIds.length,
    category: BOXING_COMBINATION_CATEGORY.ATTACK,
    approved: true,
    active: true,
    libraryVersion: V2_FOUNDATIONAL_LIBRARY_VERSION,
    sourceClass: V2_FOUNDATIONAL_SOURCE_CLASS,
    sortOrder: raw.sortOrder,
    requiredContext: Object.freeze({}),
    displaySequence: moveIds.map((id) => (MOVE_BY_ID[id] ? MOVE_BY_ID[id].canonicalName : id)).join(' → '),
    allowedWorkingRanges: Object.freeze(deriveAllowedWorkingRanges(moveIds)),
    sequenceKey: moveIds.join('>'),
  });
}

/** V2-only supplemental foundational combos (immutable). */
export const BOXING_V2_FOUNDATIONAL_COMBINATIONS = Object.freeze(RAW_V2_FOUNDATIONAL.map(buildV2Combo));

/** V2 supplemental combo IDs. */
export const BOXING_V2_FOUNDATIONAL_IDS = Object.freeze(BOXING_V2_FOUNDATIONAL_COMBINATIONS.map((c) => c.id));