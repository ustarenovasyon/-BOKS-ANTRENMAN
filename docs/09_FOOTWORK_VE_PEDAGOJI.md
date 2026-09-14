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
PART 33 preflight ile contract kilitlendi; production implementation henüz yok.

Future first-class block:

- enum key: `FOOTWORK_TECHNIQUE`
- canonical string: `boxing_footwork_technique`
- tek canonical `footworkMoveId`
- attack `moveIds` / `moveCount` alanlarından tamamen ayrı
- defense rule alanlarından tamamen ayrı
- `footworkPrescription` değildir

Pedagojik sıra: warmup sonrası, attack/defense interval bloklarından önce.

Isolated block ekstra session süresi yaratmaz; mevcut boxing budget içinden pay alır. Exact duration ve hangi günlerde uygulanacağı scheduling/frequency policy PART 36'ya aittir.

PART 34 contract/support implementasyonu yapılabilir ancak PART 36 gelmeden generated workout scheduling production'a açılmaz.

### 3. Integrated application
Henüz yok. PART 35'te structured `before_combo / after_combo` footwork prescription olarak ele alınacaktır.

Integration layer isolated `FOOTWORK_TECHNIQUE` block ile aynı kavram değildir.

## Curriculum

Eligibility merkezi `boxingTechniqueCurriculum` source-of-truth'undan derive edilir; duplicate footwork stage listesi source code'a eklenmez.

Beklenen unlock:

- Stage1: Step In, Step Out
- Stage2: Lead-side Step, Rear-side Step de açılır

Stage progression global training ordinal değil boxing exposure ordinal kullanır. Current stage resolver yalnız Beginner için tanımlıdır; intermediate/experienced için sahte fallback yapılmaz.

## Budget ve domain sınırı

Future invariant:

`footworkTechniqueSeconds + boxingIntervalSeconds = boxingSeconds`

Footwork block boxing interval work round değildir:

- `roundIndex` taşımaz
- attack round sayısını artırmaz
- defense round sayısını artırmaz
- combo selector pool'una girmez

## Determinism / fingerprint

Future isolated block fingerprint identity'sinde `footworkMoveId` bulunmalıdır. Mevcut V1 block signature'ları değişmeden kalmalıdır.

Audit `checkSummary` şeması V1 için koşulsuz değiştirilmemelidir; audit fingerprint checkSummary'yi hash'lediği için boş bir yeni sayaç bile V1 AFP'yi değiştirebilir.

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

## PART 33 durumu

Isolated-learning preflight contract: LOCKED.

Production generated footwork block count: hâlâ 0.

## PART 35 implementation note

Structured `footworkPrescription` support is implemented as dormant V2 attack metadata. It does not enter attack `moveIds`, does not increase `moveCount`, and does not add session time. Canonical phases are `before_combo` and `after_combo`; curriculum eligibility comes from the existing central curriculum helpers. Production prescription scheduling/frequency remains disabled until PART 36.
