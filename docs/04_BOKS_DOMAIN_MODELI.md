# Boks Domain Modeli

## Movement registry

Current movement universe 18 tekniktir:

### Strike — 10
- Jab
- Cross
- Lead Hook
- Rear Hook
- Jab Body
- Cross Body
- Lead Body Hook
- Rear Body Hook
- Lead Uppercut
- Rear Uppercut

### Defense — 4
- Slip Lead
- Slip Rear
- Catch Lead
- Catch Rear

### Footwork — 4
- Step In
- Step Out
- Lead-side Step
- Rear-side Step

Footwork direction enum:

- `forward`
- `backward`
- `lateral_lead`
- `lateral_rear`

Absolute left/right domain data kullanılmaz; stance + sideRole ile physical side çözülür.

## Attack combinations

- V1 canonical: 52
- V2 foundational supplemental: 2
- V2 combined attack catalog: 54

Footwork hiçbir attack combo `moveIds` dizisine girmez. Catch de attack library'ye girmez.

## Defense

V1:
- 2 Slip-counter rule

V2 supplemental:
- 2 Catch-counter rule

Curriculum hard gate: `requiredStage <= currentStage`.

## Curriculum

Stage 1 — Fundamentals:
- Jab, Cross
- Step In, Step Out

Stage 2 — Basic Combination:
- Hooks, body straights
- Catch Lead/Rear
- Lead-side/Rear-side Step

Stage 3 — Defense Integration:
- Slip Lead/Rear
- Body hooks

Stage 4 — Advanced Strike Integration:
- Lead/Rear Uppercut

Stage 5 — Rhythm Advanced
Stage 6 — Performance

Stage 5/6 şu an yeni movement açmaz; uzun süre policy ve ileri pedagojik progression henüz tamamlanmamıştır.

## Footwork mimarisi

Kilitli model OPTION D+:

1. Technique layer: first-class footwork registry + curriculum
2. Isolated drill layer: ileride ayrı V2-only teaching block
3. Integration layer: ileride structured `footworkPrescription`

Önerilen prescription şekli:

```js
{
  actions: [
    { phase: 'before_combo', movementId: 'BOX_STEP_IN' },
    { phase: 'after_combo', movementId: 'BOX_STEP_OUT' }
  ]
}
```

Bu schema henüz production'a eklenmemiştir.
