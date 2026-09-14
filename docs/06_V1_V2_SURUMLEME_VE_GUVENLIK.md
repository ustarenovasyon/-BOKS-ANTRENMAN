# V1 / V2 Sürümleme ve Güvenlik

## Current

- `GENERATION_POLICY_VERSIONS.V1 = 1`
- `GENERATION_POLICY_VERSIONS.V2 = 2`
- `CURRENT_GENERATION_POLICY_VERSION = V1`

## Resolver davranışı

- generationPolicyVersion field yoksa: legacy V1
- explicit V1: aktif
- explicit V2: tanımlı ama inactive
- null/unknown: fail-closed

## Audit

Audit V2'yi production destekli saymaz; unsupported generation policy critical finding üretir. Bu özellik bilinçli safety lock'tur.

## Preview

V2 persisted program preview de fail-closed kalmalıdır. V2 gerçek production activation PART'ına kadar bu kilit açılmamalıdır.

## Movement library compatibility

Current movement library version: 3. Legacy V1 programları için supported movement versions 1, 2, 3 olarak tutulmalıdır; unknown/null fail etmelidir.

## V1 isolation checklist

V2 feature eklerken:

- V1 attack pool değişmemeli
- V1 defense selector değişmemeli
- V1 generated block semantics değişmemeli
- legacy audit bozulmamalı
- CURRENT V1 kalmalı
- V2 supplemental içerik V1'e sızmamalı

V2 aktive edilmeden önce generator + audit + preview + regression fixture birlikte geçirilmelidir.
