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

Footwork registry + curriculum foundation tamamlandı. Generated workout'a footwork scheduling henüz bağlı değildir; production generated footwork block count = 0.

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
- exact scheduling/frequency PART 36'ya aittir
- PART 34 support implementation production scheduling açmayacaktır

Critical safety decisions:

- V1 output değişmez
- `CURRENT_GENERATION_POLICY_VERSION = V1` kalır
- V2 preview/audit fail-closed kalır
- DB schema 2 değişmez
- movement library 3 değişmez
- future fingerprint `footworkMoveId` içermeli ama mevcut V1 block signatures byte-for-byte korunmalı
- audit `checkSummary` V1 shape/count koşulsuz değiştirilmemeli; canonical `AFP_3194287436` korunmalı

Ayrıntılı karar: `docs/18_PART_33_FOOTWORK_ISOLATED_PREFLIGHT.md`.

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

PART 34: dormant V2 footwork isolated drill contract/support implementation. V1 output ve canonical PART 32 regression baseline'ları değişmeden kalmalıdır.
