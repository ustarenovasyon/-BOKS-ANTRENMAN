# BOX ANTRENMAN — Güncel Proje Durumu

## Kısa özet

Bu repository tek kullanıcılı, offline-first bir boks + kuvvet antrenman uygulamasıdır. Uygulamanın aktif üretim politikası V1'dir. V2 eğitim motoru kademeli olarak hazırlanmıştır ancak production generation, audit ve preview tarafında henüz aktif değildir.

Base44 runtime/auth/backend bağımlılıkları bu bağımsızlaştırma paketinde kaldırılmıştır. Uygulama artık React + Vite + IndexedDB temelli bağımsız bir istemci uygulaması olarak ele alınmalıdır.

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

Footwork şu anda registry + curriculum seviyesinde tanımlıdır; workout generation'a henüz bağlanmamıştır. Bu bilinçli bir durumdur.

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

## PART 32 durumu

PART 32 footwork domain foundation implementation ve durable regression finalizasyonu tamamlanmıştır.

Canonical aktif gate:

- Fixture: `tests/fixtures/v1/6m-beginner-4dpw.json`
- 6 ay / 4 gün-hafta / 104 session
- Explicit `generationSeed` + `generationRequestId` + tüm generation input'ları fixture içinde self-contained
- İki bağımsız generation run: deep-equal
- `FP_9b61698b`
- Audit: `pass`
- `AFP_3194287436`
- Critical: `0`
- Warning: `0`
- V1 Catch leak: `0`
- V1 Footwork attack leak: `0`

Historical fakat exact original input contract'ı kayıp 6M/104 çifti `FP_9698c40e / AFP_628181959` silinmemiştir ve active gate olarak kullanılmaz.

1M / 3M / 6M78 historical exact baseline fingerprint çiftleri de korunur. Bunların original complete input object'leri mevcut repository ve eldeki karar kayıtlarında bulunmadığından uydurulmuş fixture üretilmemiştir.

## Bir sonraki teknik hedef

PART 33: Footwork isolated-learning domain/block preflight. Önce yeni block contract, süre bütçesi, preview ve persistence etkisi incelenecek; PART 33 preflight kilitlenmeden isolated drill production implementation'a geçilmeyecektir.
