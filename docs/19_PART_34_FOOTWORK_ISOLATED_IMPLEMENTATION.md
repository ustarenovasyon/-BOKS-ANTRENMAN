# PART 34 — Footwork Isolated Drill Implementation

## Status

`PART 34 — PASS / LOCKED` yalnız final branch/main CI gate'leri başarıyla tamamlandıktan sonra geçerlidir.

Bu PART'ın amacı PART 33'te kilitlenen isolated-learning contract'ını **dormant V2 support** olarak kodlamaktır. Production scheduling/frequency açılmaz ve V1 output değiştirilmez.

## Uygulanan contract

Yeni workout block type:

- key: `FOOTWORK_TECHNIQUE`
- value: `boxing_footwork_technique`

Minimal isolated block identity:

- `id`
- `programDayId`
- `orderIndex`
- `type`
- `plannedSeconds`
- `footworkMoveId`

Attack/defense/integration alanları isolated footwork block üzerinde yasaktır. Özellikle `moveIds`, `moveCount`, `combinationId`, `defenseRuleId`, `counterMoveIds`, `roundIndex` ve `footworkPrescription` isolated block'a sızamaz.

## Merkezi footwork helper

`src/features/programGeneration/footworkTechniqueBlock.js`

Sorumluluklar:

- canonical active footwork movement doğrulaması
- curriculum stage eligibility
- boxing exposure üzerinden stage çözümü
- isolated block descriptor üretimi
- block-level validation
- day-level composition/order/budget validation

Eligibility source-of-truth `boxingTechniqueCurriculum.js` helper'larıdır; Stage listeleri ikinci kez hard-code edilmez.

Current beginner timeline:

- Stage 1: Step In, Step Out
- Stage 2+: Step In, Step Out, Lead-side Step, Rear-side Step

Intermediate/experienced timeline tanımlı olmadığı için sahte Stage 1 fallback yapılmaz.

## Budget ve order invariant

Isolated footwork yalnız boxing-capable session'da bulunabilir ve bir günde en fazla bir tane olabilir.

Order:

`warmup → optional isolated footwork → boxing intervals → optional mode transition → strength → cooldown`

Footwork session süresini artırmaz. Gün seviyesinde:

`footworkTechniqueSeconds + boxingIntervalSeconds = budgetSnapshot.boxingSeconds`

olmalıdır.

PART 34 exact footwork seconds veya frequency belirlemez. Bu karar PART 36 kapsamındadır.

## V1 izolasyonu

Production generator hâlâ V1'dir ve `buildDayBlocks` çağrısına `footworkTechnique` descriptor vermez.

Bu nedenle:

- generated V1 footwork block count = 0
- attack `moveIds` değişmez
- attack `moveCount` değişmez
- defense semantics değişmez
- canonical PART 32 blueprint fingerprint değişmez
- canonical audit fingerprint değişmez

## Fingerprint

Canonical block content identity chain future isolated footwork için `footworkMoveId` içerir.

Existing V1 block'larda `footworkMoveId` bulunmadığından eski signatures byte-for-byte korunur.

Regression synthetic sonuçları:

- Step In synthetic fingerprint: `FP_c45ecc5d`
- Step Out alternate fingerprint: `FP_790ff55e`

Bu, isolated footwork movement identity değişiminin fingerprint tarafından görüldüğünü kanıtlar.

## Validator / Audit / Preview

Blueprint validator isolated footwork contract'ını merkezi helper üzerinden doğrular.

Audit:

- V1'de footwork block yoksa yeni checkSummary bump eklenmez; canonical AFP korunur.
- V1 içine isolated footwork block sızarsa fail-closed finding üretilir.
- Explicit V2 hâlâ inactive olduğu için audit normal V2 audit path'ini açmaz ve unsupported/inactive policy ile fail-closed kalır.

Preview:

- block type known list'e eklenmiştir
- dedicated Turkish label/render vardır
- integrity validation merkezi helper kullanır
- V2 preview policy gate hâlâ inactive/fail-closed'dur

DB schema değişmez; generic `workout_blocks` store yeni block shape'i taşıyabilir.

## Regression

Kalıcı test:

`tests/part34-footwork-isolated-regression.mjs`

`npm run test:regression` zincirine eklenmiştir.

Doğrulanan başlıklar:

- Stage 1 exact eligibility
- Stage 2 exact eligibility
- invalid stage fail-safe
- strike/defense movement isolated descriptor'a giremez
- forbidden attack fields fail
- order contract
- exact boxing budget composition
- synthetic V2 blueprint validator support
- V2 audit inactive/fail-closed
- V1 footwork tampering audit fail-closed
- Step In / Step Out fingerprint ayrımı
- V1 canonical FP/AFP preservation

Implementation workflow sonucu:

- `verify:independent` PASS
- canonical PART 32 regression PASS: `FP_9b61698b / AFP_3194287436`
- strength regression PASS
- PART 34 isolated regression PASS
- lint PASS
- build PASS

## Deferred

PART 34 kapsamında değildir:

- production isolated drill scheduling/frequency
- exact footwork duration allocation policy
- structured `before_combo / after_combo` integration prescription
- V2 generator activation
- V2 audit activation
- V2 preview activation
- Pivot/Stance Reset

Sonraki izinli kapsam PART 35 structured footwork integration prescription'dır.
