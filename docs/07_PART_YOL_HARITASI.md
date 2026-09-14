# PART Yol Haritası — GitHub Devam Planı

Bu dosya kesin PART numaralarını koddan daha önemli saymaz; kapsamlar küçük tutulmalıdır.

## PART 32 — LOCKED

Durable finalizasyon tamamlandı:

- Historical 6M/104 `FP_9698c40e / AFP_628181959` historical/unreproducible olarak korundu
- Kalıcı, self-contained canonical 6M/104 V1 fixture eklendi
- Canonical 104-session gate: `FP_9b61698b / AFP_3194287436`
- İki bağımsız run deep-equal doğrulandı
- V1 Catch/Footwork leak kontrolleri regression runner'a bağlandı
- Persistent GitHub Actions CI gate eklendi

1M / 3M / 6M78 historical exact fingerprint çiftleri korunur. Original complete input object'leri mevcut repository/karar kayıtlarında bulunmadığından seed/requestId/date tahmin edilerek sahte exact fixture oluşturulmadı. Güvenilir original input evidence bulunursa ayrı durable fixture olarak eklenebilir; historical çiftler overwrite edilmez.

## PART 33 — LOCKED: Footwork isolated-learning domain/block preflight

Preflight kararları:

- Future block key `FOOTWORK_TECHNIQUE`
- Canonical type string `boxing_footwork_technique`
- Tek canonical `footworkMoveId`
- Attack `moveIds` / `moveCount` ile tamamen ayrı
- Defense rule alanlarıyla ayrı
- `footworkPrescription` değildir
- Warmup sonrası, boxing interval öncesi
- Boxing budget içinden pay alır; session total artırmaz
- V1 session budget davranışı değişmez
- Curriculum eligibility merkezi helper'lardan derive edilir
- Current intermediate/experienced curriculum timeline için fake fallback yok
- DB schema bump gerekmez
- Fingerprint'te future `footworkMoveId` identity zorunlu
- V1 audit `checkSummary` shape/count değiştirilemez
- Production generated footwork block count bu PART sonunda hâlâ 0

Ayrıntılı contract: `docs/18_PART_33_FOOTWORK_ISOLATED_PREFLIGHT.md`.

## PART 34 — LOCKED: Footwork isolated drill implementation

Dormant V2 contract/support implementation tamamlandı:

- `FOOTWORK_TECHNIQUE = boxing_footwork_technique` block type
- merkezi isolated footwork descriptor/validator helper
- Stage 1 yalnız Step In / Step Out
- Stage 2+ dört canonical footwork movement
- strength-only day fail-closed
- max 1 isolated footwork block / boxing-capable day
- warmup → footwork → boxing interval order contract
- boxing budget içinden exact süre composition
- attack/defense/integration field isolation guard'ları
- fingerprint identity `footworkMoveId` içerir
- validator/audit/preview fail-closed support
- preview dedicated render/label support
- kalıcı PART 34 regression testi

Regression lock:

- V1 canonical `FP_9b61698b / AFP_3194287436` değişmedi
- 104-session canonical fixture PASS
- strength regression PASS
- synthetic Step In `FP_c45ecc5d`
- alternate Step Out `FP_790ff55e`

Production scheduling **açılmadı**. V1 generated footwork block count = 0. V2 generation/audit/preview active değildir.

Ayrıntılı implementation: `docs/19_PART_34_FOOTWORK_ISOLATED_IMPLEMENTATION.md`.

## PART 35 — LOCKED: Footwork integration prescription

Structured `before_combo / after_combo` prescription support tamamlandı:

- attack `moveIds` değişmez
- punch `moveCount` değişmez
- prescription süre eklemez
- canonical active footwork + curriculum stage validation
- phase/movement fingerprint identity
- V1 prescription metadata için fail-closed audit
- preview integrity + dormant future render support
- production generator prescription schedule etmez

Regression lock:

- canonical V1 `FP_9b61698b / AFP_3194287436`
- synthetic prescription `FP_8cda526a`
- alternate prescription `FP_52d704eb`

PR #4 squash merge edildi; main CI ve GitHub Pages deploy PASS.

Ayrıntılı implementation: `docs/20_PART_35_FOOTWORK_INTEGRATION_PRESCRIPTION.md`.

## PART 36 — Footwork scheduling/frequency policy

Dormant V2-only policy candidate:

- isolated technique allocation = 60 sn
- kalan boxing interval minimum = 180 sn
- boxing budget exact composition korunur
- stage-local ilk boxing exposure teaching exposure
- stage yeni footwork açıyorsa introduction window her yeni movement'a bir exposure verir
- introduction sonrası her 3. stage-local exposure controlled repetition
- selection canonical registry/curriculum source-of-truth'undan derive edilir
- attack `FOUNDATIONAL / SUPPORT / MAIN / CHALLENGE` role planından bağımsızdır
- explicit V2 gerekir; V1 fail-closed
- current intermediate/experienced timeline tanımsız olduğu için fail-closed
- production V1 generator'a bağlanmaz; generated footwork/prescription count = 0 kalır

Final LOCK için branch + PR + main regression/CI/Pages gate'leri gereklidir.

Ayrıntılı policy: `docs/21_PART_36_FOOTWORK_SCHEDULING_POLICY.md`.

## PART 37 — Technique cue / guard / balance instruction layer

Observed scoring yok. Instructional cue, repetition objective, stance reminder.

## PART 38 — Uzun süre timeline architecture

9 / 12 / 15 / 18 / 24 ay için curriculum boundary model. Beginner'dan sonra intermediate/experienced timeline ayrıca tanımlanmalı.

## PART 39 — 9/12 ay implementation

Stage 4–5 geçişi, rhythm/defense/footwork integration.

## PART 40 — 15/18 ay implementation

Sürdürülebilir ileri progression; kısa combo + ileri footwork/defense hâlâ mümkün.

## PART 41 — 24 ay implementation

Stage 6 performance curriculum; tekrar yönetimi, varyasyon, deload ve uzun vadeli monotonluk kontrolü.

## PART 42 — Pivot/angle architecture

Rotation/angle model olmadan pivot eklenmez. Stance-relative angle semantics tanımlanır.

## PART 43 — Workout player

Timer, work/rest, pause/resume, completion confirmation, workout_progress/history.

## PART 44 — History / Settings / backup

Gerçek geçmiş, export/import, uygulama ayarları.

## PART 45 — V2 activation + full production gate

Generation V2 activation, audit V2, preview V2, migration/backward compatibility, full matrix regression.

Numaralar gerekirse değişebilir; kural: bir PART kesin kilitlenmeden sonraki PART production'a karıştırılmaz.
