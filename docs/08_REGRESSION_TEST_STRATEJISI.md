# Regression ve Determinism Test Stratejisi

## Neden gerekli?

Bu projede algoritma küçük bir enum/library değişikliğinden bile deterministic selection sırasını etkileyebilir. Bu nedenle sadece "build geçti" yeterli değildir.

## Historical bilinen baseline'lar

Exact fixture'la doğrulanmış:

- 1M: `FP_d703233d`, `AFP_1456231044`
- 3M: `FP_cf99b187`, `AFP_1436708599`
- 6M/78: `FP_eab5e5c1`, `AFP_1046783139`

Historical fakat exact fixture kayıp:

- 6M/104: `FP_9698c40e`, `AFP_628181959`

Son çift silinmemeli, ancak exact fixture yoksa aktif gate değildir.

## Yapılacak fixture altyapısı

Repository içinde örneğin:

- `tests/fixtures/v1/1m-beginner-3dpw.json`
- `tests/fixtures/v1/3m-beginner-3dpw.json`
- `tests/fixtures/v1/6m-beginner-3dpw.json`
- `tests/fixtures/v1/6m-beginner-4dpw.json`

Her fixture self-contained olmalı; başka fixture'dan spread ile seed/requestId miras almamalıdır.

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

Yeni GitHub repository'de Vitest eklenmesi önerilir. Regression tests CI'da her push/PR'da çalışmalıdır.
