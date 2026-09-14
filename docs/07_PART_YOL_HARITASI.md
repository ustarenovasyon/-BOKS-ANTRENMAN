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

## PART 34 — Footwork isolated drill implementation

Dormant V2 contract/support implementation:

- block type constant
- isolated block builder/helper
- validator support
- fingerprint identity
- audit/preview fail-closed support
- regression tests

PART 36 scheduling/frequency policy gelmeden generated workout scheduling production'a açılmaz. V1 output kesinlikle değişmez.

## PART 35 — Footwork integration prescription

Structured `before_combo / after_combo` prescription; attack `moveCount` değişmez.

## PART 36 — Footwork scheduling/frequency policy

Exposure frequency, budget allocation seconds ve hangi session'larda isolated drill bulunacağı kilitlenir. Support/main/challenge ile karışmayan ayrı pedagojik katman.

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
