# Kaynak Kod Haritası

## Uygulama girişi

- `src/main.jsx`: React root
- `src/App.jsx`: Router + local initialization gate
- `src/components/layout/AppShell.jsx`: ana layout
- `src/components/layout/BottomNavigation.jsx`: alt navigasyon

## Sayfalar

- `Home.jsx`: giriş ekranı
- `ProgramCreate.jsx`: kullanıcı tercihleri + generation başlatma
- `ProgramPreview.jsx`: persisted program preview/audit/correction/approval
- `Programs.jsx`: yerel program listesi
- `Workout.jsx`: henüz placeholder
- `History.jsx`: henüz placeholder
- `Settings.jsx`: henüz placeholder

## Configuration

`src/config/architecture.js` merkezi enum/version/constant dosyasıdır. Yeni magic string/number eklemek yerine mümkün olduğunca burada veya domain-specific constant dosyasında tanımlanmalıdır.

## Boks

- `boxing/library`: movement registry + seed/ensure
- `boxing/transitions`: strike transition graph
- `boxing/combinations`: 52 canonical attack combo
- `boxing/defense`: V1 Slip defense rules
- `boxing/curriculum`: technique curriculum, V2 policies, supplemental Catch/foundational combo
- `boxing/technical`: constitution/profile validation

## Kuvvet

- `strength/library`: exercise library
- `strength/templates`: strength templates
- `strength/technical`: session/balance/constitution validation

## Program üretimi

`src/features/programGeneration/`

- `programGenerationEngine.js`: ana pure blueprint engine
- `programCalendarEngine.js`: tarih planlama
- `boxingContentSelector.js`: attack seçim
- `defenseContentSelector.js`: defense seçim
- `strengthTemplateSelector.js`: template seçim
- `strengthPrescriptionFitter.js`: süreye sığdırma
- `workoutBlockBuilder.js`: block üretimi
- `programBlueprintValidator.js`: blueprint validation
- `programPersistenceService.js`: atomic local persistence
- `blueprintFingerprint.js`: deterministic signature
- `generationPolicyResolver.js`: V1/V2 fail-closed routing

## Diğer motorlar

- `sessionBudget/`: günlük zaman bütçesi
- `progression/`: program progression
- `weeklyBalance/`: haftalık rol/focus/balance
- `programAudit/`: persisted snapshot denetimi
- `programCorrection/`: correction
- `programApproval/`: approval
- `programPreview/`: view model

## Yerel veri

`src/lib/localData/` uygulamadaki tek kalıcı storage katmanıdır. UI doğrudan IndexedDB kullanmamalıdır.
