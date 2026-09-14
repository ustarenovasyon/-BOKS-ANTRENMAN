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

## Kritik açık konu

PART 32 production footwork foundation kodu repository'dedir. Ancak 6M/104 historical fingerprint'in exact fixture'ı kaybolduğu için regression sözleşmesinin dayanıklı, repository'de kalıcı fixture yapısına taşınması gerekmektedir. Eski `FP_9698c40e / AFP_628181959` tarihsel referans olarak korunmalı; yeniden üretilemeyen aktif gate olarak kullanılmamalıdır.

## Bir sonraki teknik hedef

Önce dayanıklı regression fixture altyapısı kurup PART 32'yi kesin kapat. Sonra PART 33'te footwork'ün isolated-learning / integration katmanlarından hangisinin ilk uygulanacağı küçük kapsamla seçilmelidir.
