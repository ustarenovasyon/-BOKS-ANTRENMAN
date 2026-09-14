# PART 36 — Footwork Scheduling / Frequency Policy

## Status

Implementation candidate. Final LOCK only after branch + PR + main gates pass.

## Scope

This PART defines a deterministic V2-only isolated-learning scheduling policy. It does **not** activate V2 production generation and does not connect the policy to the current V1 generator.

The policy is a separate pedagogical layer from V2 attack round roles (`FOUNDATIONAL / SUPPORT / MAIN / CHALLENGE`). Footwork cadence does not depend on attack role assignment.

## Policy

### Duration allocation

When isolated footwork is scheduled:

- `footworkTechniqueSeconds = 60`
- the 60 seconds come from the existing boxing budget
- remaining boxing interval budget must be at least `180` seconds
- invariant: `footworkTechniqueSeconds + boxingIntervalSeconds = boxingSeconds`
- invalid budget fails closed; no overtime and no silent shrinking below the minimum envelope

### Stage-local cadence

Scheduling uses boxing exposure ordinal and the existing curriculum timeline.

For each curriculum stage:

1. The first stage-local boxing exposure schedules isolated footwork.
2. If the stage unlocks new footwork movements, the introduction window continues until each newly unlocked movement receives one isolated exposure.
3. After the introduction window, every 3rd stage-local exposure schedules controlled repetition.

Current movement library therefore yields:

- Stage 1: local exposure 1 = Step In, local exposure 2 = Step Out.
- Stage 2: local exposure 1 = Lead-side Step, local exposure 2 = Rear-side Step.
- Stage 3/4: no new footwork movement unlock; first exposure is a refresh, then every 3rd local exposure repeats.

Movement lists are **not** duplicated in the policy. Eligible and newly unlocked movement IDs are derived from the canonical movement registry + curriculum helpers.

### Movement choice

- During a new-movement introduction window, newly unlocked footwork movements are selected in canonical registry order.
- Otherwise the current stage's eligible footwork pool is cycled deterministically by stage-local exposure ordinal.
- No `Math.random`, hidden clock input, or non-deterministic selection is allowed.

## V1 / V2 lock

`planV2FootworkTechniqueSession` requires explicit `GENERATION_POLICY_VERSIONS.V2`.

- V1 call => fail closed.
- Current production generator remains V1.
- Production generated `FOOTWORK_TECHNIQUE` block count remains 0.
- Production generated `footworkPrescription` count remains 0.
- V2 audit/preview remain inactive/fail-closed.

## Curriculum lock

Current curriculum timeline is defined only for Beginner 1/3/6-month paths. Intermediate/experienced input therefore fails closed through the existing stage resolver. No fake Stage 1 fallback is allowed.

## Integration-layer boundary

PART 35 `footworkPrescription` support remains available as dormant metadata. This PART does not attach prescriptions to attack rounds and does not define directional phase semantics beyond the already locked `before_combo / after_combo` contract.

## Regression gate

`tests/part36-footwork-scheduling-regression.mjs` verifies:

- Stage 1 introduction cadence and Step In/Step Out order.
- Stage 2 newly unlocked lateral-footwork introduction.
- Stage 3 refresh cadence without fake new unlocks.
- exact 60-second allocation and 180-second remaining interval minimum.
- insufficient boxing budget fail-closed behavior.
- explicit V1 policy rejection.
- unsupported experience fail-closed behavior.
- canonical V1 fingerprint unchanged.
- production V1 generated isolated footwork count remains 0.
- production V1 generated prescription count remains 0.

No DB schema, movement-library, generator-version, or production-policy version bump is part of PART 36.
