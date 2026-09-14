# Regression ve Determinism Test Stratejisi

## Neden gerekli?

Bu projede algoritma küçük bir enum/library değişikliğinden bile deterministic selection sırasını etkileyebilir. Bu nedenle sadece "build geçti" yeterli değildir.

## Historical bilinen baseline'lar

Exact historical baseline olarak korunur:

- 1M: `FP_d703233d`, `AFP_1456231044`
- 3M: `FP_cf99b187`, `AFP_1436708599`
- 6M/78: `FP_eab5e5c1`, `AFP_1046783139`

Bu üç çift daha önce gerçek regression çalışmalarıyla doğrulanmıştır. Ancak original complete input object'leri mevcut repository ve eldeki karar kayıtlarında bulunmadığından bugün active executable fixture olarak yeniden yazılmamıştır. Seed/requestId veya tarih tahmin edilerek historical baseline üretilmez.

Historical fakat exact fixture/input contract kayıp:

- 6M/104: `FP_9698c40e`, `AFP_628181959`

Bu çift silinmez ve yeni değerin eskiymiş gibi üstüne yazılması yasaktır. Active gate değildir.

## PART 32 canonical aktif gate

Repository'de kalıcı fixture:

- `tests/fixtures/v1/6m-beginner-4dpw.json`

Canonical sonuç:

- 6 ay
- 4 gün/hafta
- 104 planned session
- `generationPolicyVersion = 1`
- movement library = `3`
- movement count = `18`
- footwork count = `4`
- canonical attack combo = `52`
- V1 defense rule = `2`
- `FP_9b61698b`
- audit outcome = `pass`
- `AFP_3194287436`
- critical = `0`
- warning = `0`

Fixture tüm generation input'larını kendi içinde taşır; `generationSeed` ve `generationRequestId` explicit'tir ve başka fixture'dan miras alınmaz.

Regression runner iki bağımsız generation çağrısını deep-equal karşılaştırır ve iki bağımsız audit sonucunun da aynı olduğunu doğrular. Ayrıca V1 attack `moveIds` içine defense/footwork sızmadığını, `moveCount` ile strike listesi eşleştiğini, Catch'in V1 defense'a sızmadığını ve production V1 bloklarında `footworkPrescription` oluşmadığını kontrol eder.

## Kalıcı fixture kuralı

Yeni fixture'lar:

- self-contained olmalı
- başka fixture'dan spread ile seed/requestId miras almamalı
- explicit `generationLocalDate`, `generationSeed`, `generationRequestId` içermeli
- expected FP/AFP yalnız gerçek execution sonrası yazılmalı
- historical baseline'i yalnız test yeşil olsun diye değiştirmemeli

Önerilen fixture ailesi uzun vadede:

- `tests/fixtures/v1/1m-beginner-3dpw.json`
- `tests/fixtures/v1/3m-beginner-3dpw.json`
- `tests/fixtures/v1/6m-beginner-3dpw.json`
- `tests/fixtures/v1/6m-beginner-4dpw.json`

İlk üçü ancak original exact inputs güvenilir biçimde geri kazanılırsa historical fingerprint çiftleriyle active gate yapılabilir. Aksi halde yeni canonical fixture oluşturulursa yeni fingerprint ayrı isimle kaydedilir; historical değer overwrite edilmez.

## Test katmanları

1. Library validation
2. Curriculum coverage
3. Selector unit tests
4. Determinism repeat test
5. Blueprint structural test
6. Fingerprint test
7. Audit fingerprint test
8. Persistence round-trip
9. Legacy version audit
10. V2 fail-closed test

PART 32 runner şu anda 1, 2, 4, 5, 6 ve 7 katmanlarını canonical 6M/104 gate üzerinde çalıştırır. Diğer katmanlar ilerleyen regression genişletmelerinde eklenmelidir; mevcut runner olduğundan fazla kapsamlı gösterilmemelidir.

## Structural invariants

Fingerprint'e ek olarak şunlar kontrol edilmelidir:

- day count
- attack/defense block count
- block ordering
- planned seconds
- Catch/Footwork V1 leak = 0
- Stage1 3/3 foundational diversity
- 7-move nonChallenge = 0
- 8+ = 0
- defense eligibility 0/2/4/4

## Tooling

Kalıcı runner:

`npm run test:regression`

Implementation:

`tests/run-regression.mjs`

Runner Node `assert` + Vite SSR module loader kullanır; ek test framework dependency'si gerektirmez. İleride suite büyürse Vitest'e geçiş değerlendirilebilir, ancak PART 32 için yeni dependency zorunlu değildir.

CI `.github/workflows/ci.yml` içinde her push/PR'da:

- `npm ci`
- `npm run verify:independent`
- `npm run test:regression`
- `npm run lint`
- `npm run build`

çalışır. GitHub Pages deploy workflow'u da publish öncesi regression suite'i çalıştırır.
