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
- PART 37 technique instruction regression: `tests/part37-technique-instruction-regression.mjs`
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

Footwork registry + curriculum foundation tamamlandı. PART 34 isolated block support, PART 35 structured integration prescription ve PART 36 deterministic scheduling/frequency policy LOCKED durumdadır. Production V1 generator bu V2 footwork support katmanlarını schedule etmez.

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

- `FOOTWORK_TECHNIQUE`
- type: `boxing_footwork_technique`
- tek canonical `footworkMoveId`
- attack combo / defense rule / integration prescription alanlarından ayrı
- warmup sonrası, boxing interval öncesi
- mevcut boxing budget içinden süre kullanır
- session total artırmaz

Ayrıntılı karar: `docs/18_PART_33_FOOTWORK_ISOLATED_PREFLIGHT.md`.

## PART 34 durumu

Dormant V2 footwork isolated drill contract/support implementation LOCKED.

Regression lock:

- canonical V1: `FP_9b61698b / AFP_3194287436`
- synthetic Step In: `FP_c45ecc5d`
- alternate Step Out: `FP_790ff55e`

Production scheduling açılmadı.

Ayrıntılı implementation: `docs/19_PART_34_FOOTWORK_ISOLATED_IMPLEMENTATION.md`.

## PART 35 durumu

Structured `footworkPrescription` integration support LOCKED.

- canonical phases: `before_combo` / `after_combo`
- attack `moveIds` değişmez
- punch `moveCount` değişmez
- prescription session süresi eklemez
- canonical active footwork + curriculum eligibility zorunlu
- V1 prescription metadata görürse fail-closed
- production generator prescription schedule etmez

Regression lock:

- canonical V1: `FP_9b61698b / AFP_3194287436`
- synthetic prescription: `FP_8cda526a`
- alternate prescription: `FP_52d704eb`

Ayrıntılı implementation: `docs/20_PART_35_FOOTWORK_INTEGRATION_PRESCRIPTION.md`.

## PART 36 durumu

Deterministic footwork scheduling/frequency policy LOCKED.

- isolated technique allocation = 60 sn
- kalan boxing interval minimum = 180 sn
- stage-local ilk boxing exposure teaching exposure
- stage yeni footwork açıyorsa introduction window her yeni movement'a bir exposure verir
- introduction sonrası her 3. stage-local exposure controlled repetition
- movement seçimi canonical registry + curriculum helper'larından derive edilir
- attack round role planından bağımsızdır
- explicit V2 gerekir; V1 fail-closed
- Intermediate/experienced current timeline tanımsız olduğu için fail-closed
- production V1 isolated block count = 0
- production V1 prescription count = 0

PR #5 squash merge edildi. Main commit: `cb6821c703dec371701bf95574b3f3d2c70d0c7e`. Main CI ve GitHub Pages deploy PASS.

Ayrıntılı policy: `docs/21_PART_36_FOOTWORK_SCHEDULING_POLICY.md`.

## PART 37 durumu

Technique cue / guard / balance instruction-only layer branch implementasyonu hazırlandı.

- mevcut 18 canonical movement için 18/18 instruction coverage
- `techniqueCue`, `guardReminder`, `balanceReminder`, `repetitionObjective`
- `mode = instruction_only`
- kamera/sensör sonucu, accuracy/score/confidence veya fiziksel doğruluk iddiası yok
- Lead/Rear stance-relative semantics korunur; absolute sol/sağ talimatı üretilmez
- attack/defense/isolated-footwork block'larından read-only instruction sequence üretilebilir
- `before_combo → combo → after_combo` sırası desteklenir
- source workout block mutate edilmez
- instruction layer persisted blueprint alanı değildir; fingerprint değiştirmez
- production V1 block shape değişmez

Initial branch regression: coverage `18/18`, instruction-only, V1 lock PASS. Final LOCK ancak final branch + PR + main CI/Pages gate'leri geçerse verilir.

Ayrıntılı karar: `docs/22_PART_37_TECHNIQUE_INSTRUCTION_LAYER.md`.

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

PART 37 LOCKED olduktan sonra PART 38: 9 / 12 / 15 / 18 / 24 ay için uzun süre timeline architecture. Yalnız duration enum genişletilmeyecek; curriculum boundaries ve ilgili generation/audit/preview politikaları birlikte ele alınacak.
