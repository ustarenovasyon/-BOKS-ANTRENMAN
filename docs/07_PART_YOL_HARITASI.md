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

Ayrıntılı contract: `docs/18_PART_33_FOOTWORK_ISOLATED_PREFLIGHT.md`.

## PART 34 — LOCKED: Footwork isolated drill implementation

Dormant V2 isolated block/support tamamlandı. Validator, fingerprint, audit, preview ve kalıcı regression coverage mevcut. V1 generated footwork block count = 0.

Regression lock:

- V1 canonical `FP_9b61698b / AFP_3194287436`
- synthetic Step In `FP_c45ecc5d`
- alternate Step Out `FP_790ff55e`

Ayrıntılı implementation: `docs/19_PART_34_FOOTWORK_ISOLATED_IMPLEMENTATION.md`.

## PART 35 — LOCKED: Footwork integration prescription

Structured `before_combo / after_combo` prescription support tamamlandı. Attack `moveIds`, punch `moveCount` ve session süresi değişmez. Production generator prescription schedule etmez.

Regression lock:

- canonical V1 `FP_9b61698b / AFP_3194287436`
- synthetic prescription `FP_8cda526a`
- alternate prescription `FP_52d704eb`

Ayrıntılı implementation: `docs/20_PART_35_FOOTWORK_INTEGRATION_PRESCRIPTION.md`.

## PART 36 — LOCKED: Footwork scheduling/frequency policy

Dormant V2-only deterministic policy tamamlandı:

- isolated technique allocation = 60 sn
- kalan boxing interval minimum = 180 sn
- stage-local ilk boxing exposure teaching exposure
- new movement introduction window
- introduction sonrası her 3. stage-local exposure controlled repetition
- canonical registry/curriculum-derived selection
- attack role planından bağımsız cadence
- explicit V2; V1 fail-closed
- production V1 generator'a bağlı değil; footwork/prescription count = 0

PR #5 squash merge edildi; main CI ve GitHub Pages deploy PASS.

Ayrıntılı policy: `docs/21_PART_36_FOOTWORK_SCHEDULING_POLICY.md`.

## PART 37 — Technique cue / guard / balance instruction layer

Instruction-only layer implementation candidate:

- 18/18 canonical movement coverage
- `techniqueCue`
- `guardReminder`
- `balanceReminder`
- `repetitionObjective`
- observed score/accuracy/confidence/detection yok
- kamera/sensör olmadan fiziksel doğruluk iddiası yok
- Lead/Rear stance-relative semantics korunur
- attack / defense / isolated footwork block instruction sequence helper
- `before_combo → combo → after_combo` ordering support
- source block mutate edilmez
- generator/persisted blueprint/fingerprint değişmez

Final LOCK için final branch + PR + main regression/CI/Pages gate'leri gereklidir.

Ayrıntılı karar: `docs/22_PART_37_TECHNIQUE_INSTRUCTION_LAYER.md`.

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
