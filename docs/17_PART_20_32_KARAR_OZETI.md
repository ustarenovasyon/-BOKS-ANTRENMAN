# PART 20–32 Karar Özeti

## PART 20
Generation policy versioning. V1 current; V2 inactive/fail-closed. Missing legacy field V1; unknown/null fail.

## PART 21
6-stage boxing curriculum source-of-truth. Combo/defense required stage movement'lardan derive edilir.

## PART 22
Beginner 1/3/6 aylık boxing exposure timeline resolver. Global training ordinal ile boxing exposure ordinal ayrılır.

## PART 23
V2 attack curriculum hard-filter. Starvation unrestricted V1 fallback yapmaz.

## PART 24
2 V2 foundational supplemental combo. Canonical 52 korunur; combined 54.

## PART 25
V2 combo-length policy. Duration bazlı support/floor/target/normal/challenge ceiling. Length yalnız bir difficulty eksenidir.

## PART 26
V2 attack round roles: FOUNDATIONAL / SUPPORT / MAIN / CHALLENGE.

## PART 27
Role planner selector'a bağlandı. 7-move yalnız challenge; 8+ yok. V1 korunur.

## PART 28
V2 defense curriculum gate selector path'e gerçek bağlandı. Stage1/2 eski Slip yokluğu görünür oldu.

## PART 29
Defense expansion architecture. Catch family seçildi; parry/block/high guard ertelendi.

## PART 30
Catch Lead/Rear + 2 supplemental Catch defense rule eklendi. Movement library 14 oldu. Legacy movement-library audit compatibility [1,2] yapıldı.

## PART 31
Footwork architecture OPTION D+: technique registry + future isolated drill + future integration prescription. Footwork attack moveIds'e girmez.

## PART 32
Footwork domain foundation: 4 footwork movement, direction model, curriculum Stage1/2, library version 3, total movement 18. Production generated footwork block hâlâ 0.

### PART 32 durable regression lock

Final durable gate repository'ye taşındı:

- Fixture: `tests/fixtures/v1/6m-beginner-4dpw.json`
- Runner: `tests/run-regression.mjs`
- Command: `npm run test:regression`
- 6 ay / 4 gün-hafta / 104 session
- self-contained explicit generation inputs
- explicit `generationSeed = part32-canonical-6m104-seed-v1`
- explicit `generationRequestId = part32-canonical-6m104-request-v1`
- two independent generation runs = deep-equal
- canonical fingerprint: `FP_9b61698b`
- audit outcome: `pass`
- canonical audit fingerprint: `AFP_3194287436`
- critical = 0
- warning = 0
- V1 Catch attack/defense leak = 0
- V1 Footwork attack leak = 0
- V1 generated `footworkPrescription` = 0

Historical 6M/104 `FP_9698c40e / AFP_628181959` çifti silinmemiş ve yeni canonical değerle overwrite edilmemiştir; historical/unreproducible referans olarak fixture içinde açıkça tutulur.

1M `FP_d703233d / AFP_1456231044`, 3M `FP_cf99b187 / AFP_1436708599`, 6M/78 `FP_eab5e5c1 / AFP_1046783139` historical exact baseline çiftleri de korunur. Original complete input object'leri elde olmadığı için seed/requestId/date uydurularak active fixture yapılmamıştır.

Persistent CI `.github/workflows/ci.yml` ile `npm ci → verify:independent → test:regression → lint → build` zorunlu gate olmuştur. GitHub Pages deploy da regression testinden sonra publish eder.

## PART 32 FINAL STATUS

`PART 32 — PASS`

`PART 32 — LOCKED`

Sonraki izinli kapsam: PART 33 footwork isolated-learning domain/block preflight.
