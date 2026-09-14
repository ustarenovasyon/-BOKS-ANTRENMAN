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

Footwork registry + curriculum foundation tamamlandı. PART 34 ile dormant V2 isolated footwork block contract/support kodu da eklendi. Ancak scheduling/frequency production generator'a bağlı değildir; production generated footwork block count = 0 kalır.

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

Ayrıntılı karar: `docs/18_PART_33_FOOTWORK_ISOLATED_PREFLIGHT.md`.

## PART 34 durumu

Dormant V2 footwork isolated drill contract/support implementation tamamlandı ve regression ile doğrulandı.

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

PART 34 production scheduling açmaz. V1 generator `buildDayBlocks` çağrısına footwork descriptor vermediği için generated V1 block count hâlâ 0'dır. Explicit V2 generation/audit/preview production activation da yapılmamıştır.

Regression sonucu:

- canonical V1: `FP_9b61698b / AFP_3194287436` — değişmedi
- canonical 104-session fixture PASS
- strength regression PASS
- PART 34 isolated regression PASS
- synthetic Step In fingerprint: `FP_c45ecc5d`
- alternate Step Out fingerprint: `FP_790ff55e`
- iki farklı footwork movement aynı fingerprint identity'ye düşmüyor

Ayrıntılı implementation kaydı: `docs/19_PART_34_FOOTWORK_ISOLATED_IMPLEMENTATION.md`.

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

PART 35: structured footwork integration prescription (`before_combo / after_combo`) contract/implementation. Attack `moveIds` ve `moveCount` kesinlikle değişmez. Isolated scheduling/frequency PART 36 gelmeden production'a açılmaz.

## PART 35 durumu

Structured `footworkPrescription` integration support branch implementation is present. Attack combo identity and punch `moveCount` remain unchanged; prescription adds no session time. V1 production output must remain unchanged and prescription scheduling remains deferred to PART 36. Final LOCK requires all branch/PR/main gates.
