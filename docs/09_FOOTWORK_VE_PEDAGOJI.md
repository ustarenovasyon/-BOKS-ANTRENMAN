# Footwork ve Pedagojik Progression

## Kilit karar

Footwork punch combo uzunluğunun parçası değildir.

`Step In → Jab → Cross → Step Out` kullanıcıya dört teknik aksiyon olarak gösterilebilir; fakat attack domain için combo `Jab → Cross` ve `moveCount=2` kalır.

## Mevcut footwork library

- Step In — lead foot initiates, direction forward
- Step Out — rear foot initiates, direction backward
- Lead-side Step — lateral_lead
- Rear-side Step — lateral_rear

Stance Reset ertelenmiştir; fake lead/rear semantics kullanılmaz. Pivot ertelenmiştir; angle/rotation modeli yoktur.

## Üç katman

### 1. Technique registry
Mevcut ve tamamlanmış foundation. Technique curriculum'a bağlıdır.

### 2. Isolated learning
PART 33 preflight ile contract kilitlendi; PART 34 ile dormant V2 block/support implementation tamamlandı.

First-class block:

- enum key: `FOOTWORK_TECHNIQUE`
- canonical string: `boxing_footwork_technique`
- tek canonical `footworkMoveId`
- attack `moveIds` / `moveCount` alanlarından tamamen ayrı
- defense rule alanlarından tamamen ayrı
- `footworkPrescription` değildir

Pedagojik sıra: warmup sonrası, attack/defense interval bloklarından önce.

Isolated block ekstra session süresi yaratmaz; mevcut boxing budget içinden pay alır. PART 36 scheduled exposure için 60 saniye ayırır ve en az 180 saniye boxing interval bırakır.

### 3. Integrated application
PART 35 ile structured `before_combo / after_combo` `footworkPrescription` dormant support implementation tamamlandı ve LOCKED.

Integration layer isolated `FOOTWORK_TECHNIQUE` block ile aynı kavram değildir. Prescription attack `moveIds` içine girmez, `moveCount` artırmaz ve süre eklemez.

## Curriculum

Eligibility merkezi `boxingTechniqueCurriculum` source-of-truth'undan derive edilir; duplicate footwork stage listesi source code'a eklenmez.

Unlock:

- Stage1: Step In, Step Out
- Stage2: Lead-side Step, Rear-side Step de açılır

Stage progression global training ordinal değil boxing exposure ordinal kullanır. Current stage resolver yalnız Beginner için tanımlıdır; intermediate/experienced için sahte fallback yapılmaz.

## Budget ve domain sınırı

Invariant:

`footworkTechniqueSeconds + boxingIntervalSeconds = boxingSeconds`

Footwork block boxing interval work round değildir:

- `roundIndex` taşımaz
- attack round sayısını artırmaz
- defense round sayısını artırmaz
- combo selector pool'una girmez

PART 36 locked allocation:

- isolated technique = 60 sn
- kalan boxing interval minimum = 180 sn
- yetersiz budget overtime veya gizli süreyle düzeltilmez; fail-closed

## PART 36 scheduling/frequency — LOCKED

Scheduling attack round role policy'sinden bağımsız, stage-local boxing exposure cadence'i kullanır:

1. Her curriculum stage'in ilk boxing exposure'ı isolated technique içerir.
2. Stage yeni footwork movement açıyorsa introduction window her yeni movement'a bir isolated exposure verir.
3. Introduction sonrası her 3. stage-local exposure controlled repetition içerir.

Current library sonucu:

- Stage 1 local 1: Step In
- Stage 1 local 2: Step Out
- Stage 2 local 1: Lead-side Step
- Stage 2 local 2: Rear-side Step
- Stage 3/4: yeni footwork unlock yok; ilk exposure refresh, sonra her 3. local exposure tekrar

Movement selection listesi policy içinde duplicate edilmez; canonical registry + curriculum helper'lardan derive edilir.

Policy explicit V2 ister. V1 call fail-closed kalır ve current production V1 generator bu helper'a bağlı değildir. Bu nedenle production generated isolated footwork block count ve prescription count 0 kalır.

## PART 37 technique instruction layer

PART 37 hareketleri fiziksel olarak ölçmez; yalnız neye odaklanılacağını anlatan static instruction üretir.

Her canonical movement için derive edilen alanlar:

- `techniqueCue`
- `guardReminder`
- `balanceReminder`
- `repetitionObjective`
- `mode = instruction_only`

Kamera/sensör yokken `accuracy`, `score`, `confidence`, `detected`, `measured` veya “guard/balance doğru” sonucu üretilmez.

Instruction identity movement registry'den derive edilir. Lead/Rear semantics korunur; stance'tan bağımsız absolute sol/sağ cue yazılmaz.

Read-only block sequence helper şu bağlamları destekler:

- isolated footwork
- attack combo
- optional `before_combo` / `after_combo` footworkPrescription
- defense + counter

Örnek instruction sırası `Step In → Jab → Cross → Step Out` olabilir; attack yine `Jab → Cross`, `moveCount=2` kalır ve block süresi değişmez.

Instruction layer generated blueprint'e persist edilmez ve fingerprint'e girmez.

## Determinism / fingerprint

Isolated block fingerprint identity'sinde `footworkMoveId` bulunur. Structured prescription varsa phase + movement identity fingerprint'e girer. Instruction text ise derived/read-time katmandır; persisted blueprint identity'si değildir.

Audit `checkSummary` şeması V1 için koşulsuz değiştirilmez; canonical `AFP_3194287436` korunur.

## Zorluk eksenleri

Uzun vadede yalnız combo length değil:

- technique cue
- guard
- balance
- footwork
- distance
- angle
- defense
- counter
- rhythm
- head/body transition
- fatigue
- controlled repetition

Bu nedenle 2 punch combo 18–24 aylık advanced session'da da kullanılabilir; advanced yapan şey bağlamdır.

## Durum

- PART 33 isolated-learning preflight: LOCKED
- PART 34 isolated block/support: LOCKED
- PART 35 structured integration prescription: LOCKED
- PART 36 scheduling/frequency policy: LOCKED
- PART 37 instruction-only technique layer: implementation candidate; final LOCK final CI/PR/main gates sonrası

Production V1 generated footwork block count: 0.
Production V1 generated `footworkPrescription` count: 0.
