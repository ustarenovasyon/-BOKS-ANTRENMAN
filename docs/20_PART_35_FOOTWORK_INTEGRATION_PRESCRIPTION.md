# PART 35 — Footwork Integration Prescription

## Status

Implementation complete on branch. Branch verification PASS. Final LOCK only after PR + main CI gates pass.

## Scope

Structured integration metadata is supported on boxing attack work blocks without changing attack combination identity. Production scheduling is still disabled.

Canonical shape:

```js
{
  actions: [
    { phase: 'before_combo', movementId: 'BOX_STEP_IN' },
    { phase: 'after_combo', movementId: 'BOX_STEP_OUT' }
  ]
}
```

## Invariants

- `footworkPrescription` is attack-block metadata, not attack `moveIds`.
- `moveCount` remains punch count only.
- Prescription adds no seconds and does not alter `plannedSeconds`.
- 1–2 actions only.
- At most one action per phase.
- If both phases exist, `before_combo` precedes `after_combo`.
- Movement IDs must be canonical active footwork and curriculum-eligible for that day.
- V1 carrying prescription metadata fails closed.
- Explicit V2 remains production inactive/fail-closed in audit/preview.
- Fingerprint includes phase + movement identity only when prescription exists, preserving legacy V1 signatures when absent.
- Scheduling/frequency selection remains PART 36.
- No DB schema or movement-library bump.

## Example

Display may be `Step In → Jab → Cross → Step Out`, while attack domain remains `Jab → Cross`, `moveCount=2`.

## Regression gate

`tests/part35-footwork-prescription-regression.mjs` verifies schema safety, builder cloning, curriculum rejection, fingerprint identity, V1 fail-closed audit and unchanged canonical V1 fingerprint.

Verified branch results:

- Canonical V1: `FP_9b61698b / AFP_3194287436`, 104 sessions.
- Strength generation regression: PASS.
- PART 34 isolated footwork regression: `FP_c45ecc5d / FP_790ff55e` PASS.
- PART 35 prescription fingerprint identity: `FP_8cda526a / FP_52d704eb` PASS.
- `npm run verify:independent`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS.

Known pre-existing JS/JSDoc `npm run typecheck` debt remains outside this PART gate and is not claimed as passing.
