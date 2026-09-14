# Program Üretim Pipeline'ı

## Ana ilke

`generateProgramBlueprint(input)` pure ve deterministic olmalıdır. Persistence, `Date.now()` veya random seçim generation içine karışmaz.

## Ana sıra

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

## Current duration gate

Generator `durationMonths` için yalnız `[1,3,6]` kabul eder. 9+ ay desteği eklenirken bu satırı değiştirmek tek başına yeterli değildir.
