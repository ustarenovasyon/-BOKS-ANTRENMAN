# Kaynak Kod Haritası

## Uygulama girişi

- `src/main.jsx`: React root
- `src/App.jsx`: Router + local initialization gate
- `src/components/layout/AppShell.jsx`: ana layout
- `src/components/layout/BottomNavigation.jsx`: alt navigasyon

## Sayfalar

- `Home.jsx`: gerçek aktif program ve sıradaki antrenman
- `ProgramCreate.jsx`: kullanıcı tercihleri + generation başlatma
- `ProgramPreview.jsx`: persisted program preview/audit/correction/approval
- `Programs.jsx`: yerel program listesi
- `Workout.jsx`: kalıcı timer, work/rest, teknik talimat ve kullanıcı completion onayı
- `History.jsx`: gerçek sonuçlar, filtre ve öz beyan feedback
- `Settings.jsx`: ses/titreşim/tema, JSON backup/import/kurtarma ve sıfırlama

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

## PART 43–45 ekleri

- `features/workout/`: pure timer reducer ve approved-program loader
- `lib/localData/workoutRepository.js`: atomik revision-checked progress/history
- `features/backup/`: doğrulamalı JSON backup ve kurtarma
- `programGeneration/programGenerationV2.js`, `v2ProgramPolicy.js`: V2 orchestration/context
- `programAudit/programAuditV2.js`: bağımsız V2 semantic audit
- `tests/fixtures/v2/program-matrix.json`: 216 self-contained exact fixture
- `tests/browser/`: gerçek IndexedDB/production offline Playwright testleri
- `vite.config.js`: production offline shell/asset generation
