# PART 33 — Footwork Isolated-Learning Preflight

## Amaç

PART 33 yalnız mimari/contract preflight'tır. Production workout generation değişmez. Yeni footwork block henüz generator'a bağlanmaz.

Bu PART'ın görevi, PART 34 implementasyonundan önce isolated-learning katmanının domain sınırlarını kesinleştirmektir.

## Kilit karar

Gelecekte isolated footwork için first-class workout block kullanılacak:

- enum key: `FOOTWORK_TECHNIQUE`
- canonical block type string: `boxing_footwork_technique`
- yalnız V2 yolunda anlamlıdır
- V1 output'a hiçbir şekilde eklenmez

Bu block attack combo değildir, defense block değildir ve `footworkPrescription` değildir.

## Minimal block contract

Gelecekteki persisted block minimum olarak şunları taşır:

```js
{
  id,
  programDayId,
  orderIndex,
  type: 'boxing_footwork_technique',
  plannedSeconds,
  footworkMoveId,
}
```

`footworkMoveId` canonical `BOXING_MOVES` registry'sinden gelmelidir ve movement:

- `movementType === FOOTWORK`
- `approved === true`
- `active === true`
- current curriculum stage için allowed

olmalıdır.

### Bu block'ta bulunmaması gereken alanlar

Domain sınırını korumak için isolated footwork block aşağıdakileri taşımaz:

- `combinationId`
- `moveIds`
- `moveCount`
- `defenseRuleId`
- `counterMoveIds`
- `roundIndex`
- `footworkPrescription`

Footwork attack `moveIds` içine girmez ve punch `moveCount` değerini artırmaz.

## Curriculum eligibility

Kaynak-of-truth yeni liste değildir. Eligibility mevcut merkezi curriculum helper'larından derive edilmelidir.

Beklenen davranış:

- Stage 1: Step In, Step Out
- Stage 2+: Lead-side Step, Rear-side Step de açılır

Implementation yeni ayrı stage listesi hard-code etmemelidir. `BOXING_MOVES` içinden `movementType=FOOTWORK` filtrelenip mevcut curriculum eligibility helper'ı kullanılmalıdır.

Current curriculum stage resolver yalnız Beginner timeline için tanımlıdır. Intermediate/experienced için isolated footwork generation fail-safe kalmalıdır; sahte Stage 1 fallback yapılmaz.

## Boxing exposure semantiği

Footwork curriculum progression global training ordinal ile değil boxing exposure ordinal ile ilişkilidir.

Boxing exposure:

- `BOXING_ONLY_DAY` → evet
- `COMBINED_BOXING_STRENGTH_DAY` → evet
- `STRENGTH_ONLY_DAY` → hayır

## Block order

Isolated technique pedagojik olarak combo'dan önce gelir.

Future ordering:

1. Warmup
2. Optional `FOOTWORK_TECHNIQUE`
3. Boxing attack/defense/rest interval blocks
4. Combined ise mode transition
5. Strength blocks
6. Cooldown

Bir session'da isolated-learning layer için en fazla 1 `FOOTWORK_TECHNIQUE` block desteklenecek. Block tek bir `footworkMoveId` öğretir.

Bu karar scheduling/frequency kararı değildir. Hangi session'larda block bulunacağı PART 36'ya aittir.

## Time-budget contract

Footwork ekstra süre yaratmaz.

Future invariant:

`footworkTechniqueSeconds + boxingIntervalSeconds = boxingSeconds`

Yani isolated technique mevcut boxing budget içinden pay alır. Session total hiçbir zaman artmaz.

`sessionTimeBudgetEngine` V1 davranışı değiştirilmez. Split, V2-only bir allocation layer'da base session budget üretildikten sonra ve `buildBoxingIntervalBudget` çağrısından önce yapılmalıdır.

Sonraki interval budget yalnız kalan `boxingIntervalSeconds` üzerinden kurulmalıdır. Aynı `boxingSeconds` hem footwork hem attack interval için iki kez harcanamaz.

Exact footwork seconds, minimum kalan interval envelope ve scheduling frequency PART 36'da kilitlenecektir. Invalid allocation overtime ile sessizce düzeltilmez.

## Builder etkisi

Current `buildDayBlocks` boxing interval segmentlerini attack/defense/rest block'larına çevirir. PART 34'te builder contract genişletilecek ancak generator scheduling yapılmayacaktır.

Builder isolated block'u round gibi ele almamalıdır:

- `roundIndex` yok
- attack work slot'u sayılmaz
- defense slot'u sayılmaz
- boxing combo selector pool'unu etkilemez

## Blueprint validator etkisi

PART 34'te validator en az şunları doğrulamalıdır:

- block yalnız boxing-capable role'de
- day başına maksimum 1
- canonical active footwork move
- curriculum eligibility
- forbidden attack/defense alanlarının yokluğu
- positive integer `plannedSeconds`
- order: warmup sonrası, boxing interval öncesi
- day exact-total invariant korunuyor

V1 blueprint'te footwork block sayısı kesinlikle 0 kalmalıdır.

## Fingerprint etkisi — V1 koruma kilidi

Current blueprint fingerprint block content key olarak `combinationId || defenseRuleId || exerciseId || templateId || ''` kullanır.

Yeni block'ta `footworkMoveId` fingerprint identity'ye dahil edilmezse iki farklı footwork hareketi aynı block signature'a düşebilir. Bu kabul edilemez.

PART 34 implementasyonu content key resolver'ı şu mantıkla genişletmelidir:

`combinationId || defenseRuleId || exerciseId || templateId || footworkMoveId || ''`

Önemli: mevcut block tiplerinin signature string'i byte-for-byte değişmemelidir. Böylece V1 canonical `FP_9b61698b` korunur.

## Audit etkisi — AFP koruma kilidi

Current audit fingerprint `JSON.stringify(checkSummary)` değerini de hash'ler.

Bu nedenle `checkSummary` içine koşulsuz yeni `footworkChecks: 0` alanı eklemek bile V1 audit fingerprint'ini değiştirir. Bu yasaktır.

PART 34/ilerisi için:

- V1 code path'te checkSummary shape ve bump sayıları değişmemeli
- isolated footwork validation yalnız block gerçekten mevcut olan V2 path'te çalışmalı
- gerekiyorsa mevcut `boxingChecks` / `policyChecks` altında koşullu sayılmalı veya V2-only summary shape kullanılmalı
- canonical V1 `AFP_3194287436` korunmalı

Audit gelecekte en az role, movement type, curriculum, order, forbidden-field ve budget composition kontrollerini yapmalıdır.

## Preview etkisi

`programPreviewService` unknown block type için fail-closed davranır. Bu korunacak.

PART 34'te block type enum'a eklendiği aynı küçük kapsamda:

- preview known-type guard
- block label
- dedicated render branch
- content integrity rules

birlikte eklenmelidir. Sadece enum'a type ekleyip preview'ın içeriği doğrulamadan kabul etmesi yasaktır.

V2 preview production'da hâlâ inactive/fail-closed kalır.

## Persistence / IndexedDB etkisi

Yeni store veya index gerekmiyor.

`workout_blocks` generic object records saklar ve mevcut indexler `programDayId` / `orderIndex` üzerindedir. `footworkMoveId` için query index ihtiyacı yoktur.

Bu nedenle isolated block contract tek başına DB schema bump gerektirmez.

Persistence yine `programPersistenceService` transaction'ı üzerinden yapılır; UI doğrudan IndexedDB kullanmaz.

## Workout player etkisi

Workout player henüz placeholder'dır. İleride isolated footwork block:

- ayrı technique adı
- kendi planned timer'ı
- attack combo'dan ayrı presentation

olarak gösterilmelidir.

Guard, balance, pivot accuracy gibi sensörsüz ölçüm iddiası yapılmaz. Technique cue layer PART 37'ye aittir.

## V1 / V2 activation kilidi

PART 33 ve PART 34:

- `CURRENT_GENERATION_POLICY_VERSION = V1` değiştirmez
- V2 production activation yapmaz
- V1 generator output'u değiştirmez
- movement library version 3'ü değiştirmez
- DB schema version 2'yi değiştirmez

V2 production activation ancak generator + audit + preview aynı gate'te hazır olduğunda yapılabilir.

## PART 34 implementation sınırı

PART 34 yalnız dormant V2 isolated drill contract/support implementasyonu yapacaktır:

- block type constant
- isolated footwork block builder/helper
- validator contract
- fingerprint content identity
- audit/preview support gereken fail-closed yüzeyler
- deterministic unit/regression coverage

Ancak generated workout'a hangi günlerde footwork block konacağı PART 36 scheduling/frequency policy gelmeden production scheduling olarak açılmayacaktır.

## Regression gate

PART 34 tamamlanmadan önce en az:

- movement library validator PASS
- curriculum coverage PASS
- `npm run test:regression` PASS
- canonical V1 `FP_9b61698b` değişmedi
- canonical V1 `AFP_3194287436` değişmedi
- V1 generated footwork block count = 0
- V1 attack footwork leak = 0
- `npm run verify:independent` PASS
- `npm run lint` PASS
- `npm run build` PASS

olmalıdır.

## PART 33 final karar

Bu preflight ile isolated-learning domain sınırı kilitlenmiştir. Production code bu PART'ta değiştirilmez.

Sonraki izinli kapsam: PART 34 — dormant V2 footwork isolated drill implementation.
