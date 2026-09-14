# PART 38 — 9–24 Ay Timeline Architecture

## Status

Architecture / preflight implementation candidate. Bu PART production duration desteğini açmaz. Final LOCK yalnız branch + PR + main CI/Pages gate'leri geçerse verilir.

## Amaç

9 / 12 / 15 / 18 / 24 aylık programların ileride güvenli biçimde eklenebilmesi için curriculum timeline sınırlarını ve diğer policy katmanlarının aynı anda uyması gereken contract'ı kilitlemek.

Bu PART'ta:

- `PROGRAM_DURATION_MONTHS` genişletilmez.
- ProgramCreate duration seçenekleri genişletilmez.
- Generator 9+ ay kabul etmez.
- V2 production aktif edilmez.
- Mevcut 1/3/6 davranışı değiştirilmez.
- Exact yeni fingerprint baseline uydurulmaz.

## Mevcut kilitli baseline

Current Beginner curriculum reach:

| Süre | Mevcut max stage | Anlam |
| --- | ---: | --- |
| 1 ay | Stage 2 | Fundamentals → Basic Combination |
| 3 ay | Stage 3 | Defense Integration'a kadar |
| 6 ay | Stage 4 | Advanced Strike Integration'a kadar |

Current resolver boxing exposure ordinal kullanır; calendar month veya global training ordinal kullanmaz. Bu invariant uzun sürelerde de korunacaktır.

## Uzun süre stage reach contract

Beginner için hedef reach aşağıdaki gibi kilitlenir:

| Süre | Hedef max stage | Timeline amacı |
| --- | ---: | --- |
| 9 ay | Stage 4 | Stage 4 stabilizasyonu; mesafe giriş/çıkış, defense sonrası cevap, ritim varyasyonu |
| 12 ay | Stage 5 | Rhythm Advanced başlangıcı; timing/rhythm objective ve kontrollü counter bağlamı |
| 15 ay | Stage 5 | Stage 5 gelişimi; varyasyon, short-combo advanced context, controlled fatigue/repetition |
| 18 ay | Stage 5 | Stage 5 ileri entegrasyon; defense + footwork bağlamı, fakat angle/pivot zorunlu değil |
| 24 ay | Stage 6 | Performance; sürdürülebilir rotation, tekrar kontrolü, deload ve teknik yeniden kullanım |

### Kritik movement kuralı

Stage 5 ve Stage 6 **yeni movement unlock etmez**. Current 18-movement registry tek movement source-of-truth olarak kalır.

Bu nedenle daha uzun program:

- otomatik olarak daha uzun combo demek değildir,
- yeni punch/defense/footwork hareketi eklemek zorunda değildir,
- kısa kombinasyonları footwork, defense, mesafe, rhythm, counter, fatigue ve controlled repetition bağlamında ileri seviyede kullanabilir.

## Boundary model contract

Future long-duration timeline resolver aşağıdaki kurallara uymalıdır:

1. Stage progression yalnız boxing exposure ordinal üzerinden çözülür.
2. Boundary'ler integer ve contiguous olmalıdır; stage skip yasaktır.
3. Reach edilen her stage, exposure varsa en az bir exposure almalıdır.
4. Beginner Stage 1 introduction mevcut `min(2, totalBoxingExposures)` davranışını geriye dönük değiştirmemelidir.
5. Boundary hesapları tek merkezi resolver/helper'da yaşamalıdır; attack role, defense, footwork veya audit kendi timeline formülünü kopyalamaz.
6. 9 ay Stage 5'e çıkamaz.
7. 12 / 15 / 18 ay Stage 6'ya çıkamaz.
8. 24 ay Stage 6'ya ulaşabilir.
9. Exact long-duration exposure oranları bu architecture PART'ta tahmin edilmez. PART 39/40/41 implementation'larında kalıcı regression matrix'iyle birlikte sayısallaştırılır.
10. Total boxing exposure sayısı weekly role planından sonra bilinen gerçek boxing-capable day sayısıdır; calendar ay sayısı doğrudan stage ordinal değildir.

## Experience-level contract

Current V2 curriculum resolver yalnız Beginner için gerçek timeline tanımlar. Intermediate / Experienced için Beginner timeline'ı sessizce reuse etmek yasaktır.

Long-duration activation öncesi her experience level için açıkça şu bilgiler tanımlanmalıdır:

- entry stage / başlangıç semantics,
- reachable stage sequence,
- stage boundary policy,
- combo-length profile,
- defense exposure policy,
- challenge eligibility,
- footwork teaching/repetition cadence ile uyum.

Bu bilgiler tanımlanana kadar Intermediate / Experienced long-duration V2 path fail-closed kalır.

## Cross-policy atomic activation gate

Bir duration yalnız enum/UI eklenerek production'a açılamaz. Aynı implementation zincirinde aşağıdakiler birlikte tamamlanmalıdır:

1. `PROGRAM_DURATION_MONTHS` + form label/validation.
2. Calendar/end-date davranışı.
3. Progression active phases + phase weights.
4. Boxing/strength progression tabloları ve deload/recovery kararı.
5. Curriculum stage boundaries.
6. V2 combo-length profile.
7. V2 attack round-role policy; Stage 5/6 stage-local ordinal desteği.
8. V2 defense selector supported-stage policy.
9. Footwork isolated scheduling/frequency compatibility.
10. Structured `footworkPrescription` compatibility.
11. Weekly balance / defense eligibility expectations.
12. Program blueprint validator.
13. Audit expectations ve fail-closed version davranışı.
14. Preview integrity/rendering.
15. Deterministic self-contained regression fixtures ve two-run deep-equal gate.
16. V1 regression matrix'in değişmeden kalması.

Bu zincirde herhangi bir blocker varsa duration production'a açılmaz.

## Combo-length architecture

Current V2 combo-length policy yalnız Beginner 1/3/6 için tanımlıdır. 9+ profilleri eklenirken:

- support kısa combo aralığı korunmalıdır,
- normal target range duration ile sınırsız büyümemelidir,
- challenge seyrek ve kontrollü kalmalıdır,
- Stage 5/6 progression yalnız combo length ile temsil edilmemelidir,
- user `boxingMaxMoves` hard cap olmaya devam etmelidir.

PART 38 exact 9+ combo-length sayıları tanımlamaz; bunlar ilgili implementation PART'ında regression ile kilitlenir.

## Attack round-role architecture

Current role policy Stage 1–4 stage-local ordinal bilir. Stage 5/6 support eklenirken:

- `FOUNDATIONAL / SUPPORT / MAIN / CHALLENGE` role vocabulary değişmek zorunda değildir,
- Stage 5/6 için stage-local start merkezi curriculum boundary resolver'dan derive edilmelidir,
- challenge eligibility final reachable stage'e göre çözülmelidir,
- role policy timeline formülünü duplicate etmemelidir.

## Defense architecture

Current V2 defense candidate pool mevcut dört defense rule'dan oluşur. Stage 5/6 yeni defense movement/rule açmaz.

Uzun duration implementasyonunda:

- supported-stage guard Stage 5/6'yı bilinçli biçimde ele almalıdır,
- eligibility yine `requiredStage <= currentStage` merkezi curriculum mapping üzerinden derive edilmelidir,
- yeni defense rule eklemek bu timeline PART'ının işi değildir.

## Footwork architecture

PART 34–36 lock'ları korunur:

- footwork attack `moveIds` içine girmez,
- punch `moveCount` artırmaz,
- isolated footwork mevcut boxing budget'tan süre kullanır,
- structured prescription süre eklemez,
- Stage 5/6 yeni footwork movement açmaz; mevcut dört movement kontrollü tekrar/integration bağlamında kullanılabilir.

PART 36 stage-local cadence uzun stage'lere genişletilirken boundary source-of-truth merkezi resolver olmalıdır.

## Pivot / angle boundary

18 aylık planın `angle model eklendiyse` ifadesi koşulludur. Pivot/angle, PART 42'de ayrı rotation/angle architecture gerektirir.

9/12/15/18/24 ay desteği Pivot'a bağımlı değildir. Angle architecture hazır değilse uzun programlar mevcut translation footwork + defense + rhythm bağlamıyla çalışmalıdır; fake Pivot eklenmez.

## Deload / recovery boundary

15+ ay programlarda sürekli lineer yoğunluk artışı kabul edilmez. Long-duration progression implementation'ı production'a açılmadan önce recovery/deload davranışı açıkça tanımlanmalıdır.

PART 38 bunun varlığını zorunlu architectural gate olarak kilitler; exact deload cadence'i bu PART'ta uydurmaz.

## Implementation ayrımı

### PART 39 — 9 / 12 ay

- 9 ay Stage 4 stabilizasyon timeline'ı
- 12 ay Stage 5 intro timeline'ı
- exact boundaries
- progression / combo length / round role / defense / weekly balance / audit / preview / fixtures

### PART 40 — 15 / 18 ay

- Stage 5 development ve advanced integration
- recovery/deload policy
- short-combo advanced-context sürdürülebilirliği
- exact deterministic fixtures

### PART 41 — 24 ay

- Stage 6 performance timeline
- rotation / repetition control / recovery
- full deterministic long-duration gate

## PART 38 exit criteria

Bu PART ancak şu koşullarla LOCKED olabilir:

- architecture karar kaydı repository'de kalıcıdır,
- current duration enum hâlâ yalnız 1/3/6'dır,
- generator hâlâ 9+ ayı reddeder,
- V1 canonical `FP_9b61698b / AFP_3194287436` değişmez,
- mevcut PART 34–37 regression'ları geçer,
- `npm run verify:independent`, `npm run lint`, `npm run build` geçer,
- branch + PR + main CI/Pages gate'leri yeşildir.

Bu PART production duration desteğini açmaz.
