# BOX ANTRENMAN — Güncel Proje Durumu

## Kısa özet

Bu repository tek kullanıcılı, offline-first bir boks + kuvvet antrenman uygulamasıdır. Uygulamanın aktif üretim politikası V1'dir. V2 eğitim motoru kademeli olarak hazırlanmıştır ancak production generation, audit ve preview tarafında henüz aktif değildir.

Base44 runtime/auth/backend bağımlılıkları kaldırılmıştır. Uygulama React + Vite + IndexedDB temelli bağımsız istemci uygulamasıdır.

## Kaynak kodda bugün çalışan ana parçalar

- Program tercih formu: `src/pages/ProgramCreate.jsx`
- 1 / 3 / 6 aylık program üretimi: `src/features/programGeneration/programGenerationEngine.js`
- Deterministic seçim: `src/features/programGeneration/deterministicSelection.js`
- Program takvimi: `programCalendarEngine.js`
- Session süre bütçesi: `src/features/sessionBudget/`
- Boks progression: `src/features/progression/boxingProgressionEngine.js`
- Kuvvet progression: `strengthProgressionEngine.js`
- Haftalık dengeleme: `src/features/weeklyBalance/`
- Boks hareket/combo/defense kütüphaneleri: `src/features/boxing/`
- Program persistence: `programPersistenceService.js`
- Program preview: `src/features/programPreview/` + `src/pages/ProgramPreview.jsx`
- Program audit/correction/approval katmanları: `src/features/programAudit`, `programCorrection`, `programApproval`
- Yerel DB ve repository katmanı: `src/lib/localData/`
- Kalıcı regression runner: `tests/run-regression.mjs`
- Canonical PART 32 fixture: `tests/fixtures/v1/6m-beginner-4dpw.json`
- PART 34 footwork isolated regression: `tests/part34-footwork-isolated-regression.mjs`
- PART 35 footwork prescription regression: `tests/part35-footwork-prescription-regression.mjs`
- PART 36 footwork scheduling regression: `tests/part36-footwork-scheduling-regression.mjs`
- GitHub CI: `.github/workflows/ci.yml`
- GitHub Pages deploy: `.github/workflows/deploy-pages.yml`

## Boks domain durumu

- Toplam movement: 18
- Strike: 10
- Defense: 4
- Footwork: 4
- Canonical attack combo: 52
- V2 foundational supplemental attack combo: 2
- Combined V2 attack catalog: 54
- V1 defense rule: 2 Slip-counter
- V2 supplemental defense: 2 Catch-counter
- Combined V2 defense pool: 4
- Curriculum coverage: 18/18
- Footwork: Step In, Step Out, Lead-side Step, Rear-side Step

Footwork registry + curriculum foundation tamamlandı. PART 34 dormant isolated block support, PART 35 structured integration prescription support olarak LOCKED durumdadır. PART 36 deterministic scheduling/frequency policy desteğini dormant V2 helper olarak hazırlar; production V1 generator'a bağlanmaz.

## PART 32 durumu

PART 32 footwork domain foundation + durable regression finalizasyonu LOCKED.

Canonical aktif gate:

- Fixture: `tests/fixtures/v1/6m-beginner-4dpw.json`
- 104 session
- `FP_9b61698b`
- `AFP_3194287436`
- Audit pass / critical 0 / warning 0
- iki bağımsız generation run deep-equal
- V1 Catch leak = 0
- V1 Footwork attack leak = 0

Historical 6M/104 `FP_9698c40e / AFP_628181959` historical/unreproducible olarak korunur ve active gate değildir.

## PART 33 durumu

Footwork isolated-learning domain/block preflight LOCKED.

Future contract:

- `FOOTWORK_TECHNIQUE`
- type: `boxing_footwork_technique`
- tek `footworkMoveId`
- attack combo / defense rule / integration prescription alanlarından ayrı
- warmup sonrası, boxing interval öncesi
- mevcut boxing budget içinden süre kullanır
- session total artırmaz

Ayrıntılı karar: `docs/18_PART_33_FOOTWORK_ISOLATED_PREFLIGHT.md`.

## PART 34 durumu

Dormant V2 footwork isolated drill contract/support implementation LOCKED.

Eklenen destek:

- `WORKOUT_BLOCK_TYPES.FOOTWORK_TECHNIQUE = 'boxing_footwork_technique'`
- merkezi isolated footwork descriptor/validator helper
- Stage 1 eligibility: Step In + Step Out
- Stage 2+ eligibility: dört canonical footwork movement
- max 1 isolated footwork block / boxing-capable day
- warmup sonrası / boxing interval öncesi order contract
- `footworkTechniqueSeconds + boxingIntervalSeconds = boxingSeconds` exact budget composition
- forbidden attack/defense/integration alan guard'ları
- fingerprint identity içinde `footworkMoveId`
- preview label/render/integrity support
- audit fail-closed support
- DB schema bump yok

Regression lock:

- canonical V1: `FP_9b61698b / AFP_3194287436`
- synthetic Step In: `FP_c45ecc5d`
- alternate Step Out: `FP_790ff55e`

Ayrıntılı implementation: `docs/19_PART_34_FOOTWORK_ISOLATED_IMPLEMENTATION.md`.

## PART 35 durumu

Structured `footworkPrescription` integration support LOCKED.

- canonical phases: `before_combo` / `after_combo`
- attack `moveIds` değişmez
- punch `moveCount` değişmez
- prescription session süresi eklemez
- canonical active footwork + curriculum eligibility zorunlu
- fingerprint phase + movement identity içerir yalnız prescription mevcutsa
- V1 prescription metadata görürse fail-closed
- V2 production audit/preview hâlâ inactive/fail-closed
- production generator prescription schedule etmez

Regression lock:

- canonical V1: `FP_9b61698b / AFP_3194287436`
- PART 35 synthetic prescription: `FP_8cda526a`
- alternate prescription: `FP_52d704eb`

Main commit: `7d83b30d610a0f83ab19d51614635a3e12570331`. Main CI ve GitHub Pages deploy PASS.

Ayrıntılı implementation: `docs/20_PART_35_FOOTWORK_INTEGRATION_PRESCRIPTION.md`.

## PART 36 durumu

Deterministic footwork scheduling/frequency policy branch implementasyonu hazırlanıyor. Scope dormant V2-only support'tur; production generator'a bağlanmaz.

Policy candidate:

- scheduled isolated footwork = 60 sn
- süre mevcut boxing budget'tan düşer
- kalan boxing interval en az 180 sn olmalı
- stage'in ilk boxing exposure'ında isolated footwork
- stage yeni footwork açıyorsa introduction window her yeni movement'a bir exposure verir
- introduction sonrası her 3. stage-local exposure controlled repetition
- movement seçimi canonical registry + curriculum helper'larından derive edilir
- V1 explicit fail-closed
- Intermediate/experienced current timeline tanımsız olduğu için fail-closed
- production V1 isolated block count = 0
- production V1 prescription count = 0

Final LOCK ancak branch + PR + main CI/Pages gate'leri geçerse verilir.

Ayrıntılı policy: `docs/21_PART_36_FOOTWORK_SCHEDULING_POLICY.md`.

## Süre desteği

Kaynak kod şu anda yalnız `1, 3, 6` ayı kabul eder. Hedef süre ailesi:

`1 → 3 → 6 → 9 → 12 → 15 → 18 → 24 ay`

9+ aylar eklenirken yalnız UI enum'u genişletilmemelidir. Curriculum timeline, progression, attack/defense selector, weekly planning, audit, preview ve regression fixture'ları birlikte genişletilmelidir.

## Tamamlanmamış kullanıcı yüzleri

- `Workout.jsx`: placeholder
- `History.jsx`: placeholder
- `Settings.jsx`: placeholder
- Home ekranı oluşturulan programı özetlemiyor
- Antrenman başlat / duraklat / tamamla akışı yok
- Workout progress ve history store'ları var fakat UI akışı tamamlanmamış

## Bir sonraki teknik hedef

PART 36 tamamlanıp LOCKED olduktan sonra PART 37: technique cue / guard / balance instruction layer. Sensörsüz observed scoring veya fiziksel doğruluk ölçümü yapılmaz.
