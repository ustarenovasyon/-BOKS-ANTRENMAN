# PART 37 — Technique Cue / Guard / Balance Instruction Layer

## Status

Implementation complete on branch. Initial branch CI PASS. Final LOCK only after final branch + PR + main CI/Pages gates pass.

## Purpose

PART 37 adds a pure instructional layer for all canonical boxing movements. It is **not** a camera/sensor analysis system and does not claim to observe or score physical execution.

The layer provides four text fields per canonical movement:

- `techniqueCue`
- `guardReminder`
- `balanceReminder`
- `repetitionObjective`

Every instruction result has `mode = instruction_only`.

## Source-of-truth

Movement identity, movement type, family, side role, target and footwork direction are read from the existing authoritative `BOXING_MOVES` registry.

PART 37 does not create a second movement catalog or duplicate curriculum stage ownership.

Instruction wording is derived by movement type/family/direction, so all current 18 canonical movements are covered while Lead/Rear semantics remain stance-relative.

## Safety boundary

The instruction object intentionally contains no observed-performance fields such as:

- score
- accuracy
- confidence
- detected
- measured
- correct/incorrect physical state

The app may tell the user what to focus on; it may not state that guard, balance, pivot or stance execution was measured or verified without sensor/camera evidence.

## Block instruction sequence

`buildWorkoutBlockInstructionSequence(block)` creates a read-only instructional sequence without mutating the workout block.

Supported contexts:

- `FOOTWORK_TECHNIQUE` → isolated technique instruction
- `BOXING_ATTACK_WORK` → optional `before_combo` footwork, punch combo movements, optional `after_combo` footwork
- `BOXING_DEFENSE_WORK` → defense movement followed by counter movements

Example:

`Step In → Jab → Cross → Step Out`

Instruction sequence can contain four actions, but attack domain remains:

- `moveIds = [Jab, Cross]`
- `moveCount = 2`
- original `plannedSeconds` unchanged

## Persistence / fingerprint boundary

PART 37 instructions are derived at read/use time. They are not persisted into generated workout blocks and do not participate in blueprint fingerprint identity.

Therefore PART 37 does not change V1 generated data shape or the canonical V1 fingerprint.

## Regression gate

`tests/part37-technique-instruction-regression.mjs` verifies:

- canonical movement coverage = 18/18
- all four instructional text fields are non-empty
- every result is `instruction_only`
- no observed metric fields are exposed
- no absolute left/right wording is introduced; Lead/Rear semantics remain stance-relative
- attack prescription sequence is ordered `before_combo → combo → after_combo`
- instruction sequencing does not mutate attack block, punch `moveCount` or `plannedSeconds`
- defense and isolated-footwork sequences resolve correctly
- canonical V1 fingerprint remains unchanged
- generated V1 blocks receive no persisted instruction/scoring fields

Initial branch verification:

- canonical V1: `FP_9b61698b / AFP_3194287436`, 104 sessions — PASS
- strength regression — PASS
- PART 34 regression — PASS
- PART 35 regression — PASS
- PART 36 regression — PASS
- PART 37 coverage `18/18`, instruction-only, V1 lock — PASS
- `npm run verify:independent` — PASS
- `npm run lint` — PASS
- `npm run build` — PASS

Initial branch CI run: `34834845749`.

Known pre-existing JS/JSDoc `npm run typecheck` debt remains outside this PART gate and is not claimed as passing.
