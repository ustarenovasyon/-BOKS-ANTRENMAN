# Program Üretim Pipeline'ı

## Ana ilke

`generateProgramBlueprint(input)` pure ve deterministic olmalıdır. Persistence, `Date.now()` veya random seçim generation içine karışmaz.

## Ana sıra — current V1

1. Input validation
2. Settings snapshot
3. Engine version snapshot
4. Program start/end date çözümü
5. Scheduled date listesi
6. Weekly role planning
7. Session budget
8. Progression hesaplama
9. Defense exposure planning
10. Weekly balance/focus
11. Boxing attack seçimi
12. Defense seçimi
13. Strength template seçimi
14. Strength prescription fitting
15. Workout block build
16. Full blueprint validation
17. Blueprint fingerprint
18. Persistence

Current V1 pipeline PART 33'te değişmez.

## Future V2 isolated-footwork insertion point

PART 33 preflight ile isolated-learning katmanının gelecekteki pipeline konumu kilitlendi.

Base session budget üretildikten ve curriculum stage / boxing exposure context çözüldükten sonra, boxing budget V2-only bir allocation layer'da iki parçaya ayrılacaktır:

`footworkTechniqueSeconds + boxingIntervalSeconds = boxingSeconds`

Sonra:

1. optional isolated footwork technique planı
2. kalan `boxingIntervalSeconds` üzerinden boxing interval budget
3. attack/defense selection
4. workout block build

çalışacaktır.

Bu split `sessionTimeBudgetEngine` V1 davranışını değiştirmez. Footwork aynı `boxingSeconds` bütçesini ikinci kez kullanamaz ve session total artırılamaz.

Exact seconds ve scheduling frequency PART 36'da tanımlanacaktır.

## Future isolated block order

Boxing-capable bir günde future sıra:

1. Warmup
2. optional `FOOTWORK_TECHNIQUE`
3. attack / defense / rest boxing interval blocks
4. combined ise mode transition
5. strength blocks
6. cooldown

`FOOTWORK_TECHNIQUE` interval round değildir; `roundIndex`, attack `moveIds` veya punch `moveCount` üretmez.

## Determinism

`generationSeed` seçimde kullanılır. `generationRequestId` program/version/day kimliklerini etkiler; mevcut fingerprint block signature içinde programDayId kullandığı için requestId fingerprint'i de etkiler.

Bu nedenle regression fixture'da aşağıdaki alanlar explicit olmalıdır:

- durationMonths
- programMode
- daysPerWeek
- selectedWeekdays
- sessionDurationMinutes
- experienceLevel
- difficulty
- stance
- boxingMaxMoves
- strengthDaysPerWeek / equipment gerektiğinde
- generationLocalDate
- generationSeed
- generationRequestId

Base fixture inheritance ile seed/requestId sızıntısı yapılmamalıdır.

Future footwork selector da `Math.random` veya gizli `Date.now` kullanamaz. Selection merkezi curriculum eligibility + deterministic seed/context üzerinden yapılmalıdır.

## Fingerprint safety

Future isolated block `footworkMoveId` fingerprint content identity'ye dahil edilmelidir.

Existing V1 blocks için fingerprint signature string'i byte-for-byte değişmemelidir; canonical V1 baseline:

- `FP_9b61698b`
- `AFP_3194287436`

korunur.

Audit fingerprint `checkSummary` JSON'unu da içerdiğinden V1 path'te unconditional summary schema/count değişikliği yapılmaz.

## Current duration gate

Generator `durationMonths` için yalnız `[1,3,6]` kabul eder. 9+ ay desteği eklenirken bu satırı değiştirmek tek başına yeterli değildir.
