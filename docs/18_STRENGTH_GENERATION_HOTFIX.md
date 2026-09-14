# Strength Generation Blocker Hotfix

## Amaç

Kuvvet içeren program üretiminde bulunan blocker'ları V1 boxing davranışını değiştirmeden kapatmak.

## Kök nedenler

1. `strengthPrescriptionFitter.js` egzersiz registry'sini `Map` olarak oluşturmasına rağmen `EX_BY_ID[id]` ile okuyordu. Bu nedenle geçerli kuvvet template'leri prescription aşamasında reddediliyor ve generator `program_strength_prescription_does_not_fit` veriyordu.
2. `strengthTemplateSelector.js` rolling-4 coverage borcunu hesaplarken önceki 4 strength session'a bakıyordu. Audit penceresi ise önceki 3 + mevcut session olduğundan selector bir session gecikmeli davranıyor ve `audit_rolling_pattern_coverage_missed` üretiyordu.
3. `Boks + Kuvvet` için 15/20 dakika tüm V1 seviye/zorluk kombinasyonlarında güvenilir değildir. Production policy minimum 30 dakika olarak kilitlenmiştir. `Sadece Boks` ve `Sadece Kuvvet` 15/20 dakika desteğini korur.

## Kalıcı düzeltmeler

- Exercise lookup `EX_BY_ID.get(id)`.
- Rolling coverage selector: `ROLLING_STRENGTH_SESSION_WINDOW - 1` previous strength sessions.
- Mode-specific session duration source-of-truth: `src/features/sessionBudget/sessionDurationPolicy.js`.
- `Boks + Kuvvet` minimum günlük süre: 30 dakika.
- UI preference validation ve session budget engine aynı policy helper'ını kullanır.

## Regression gate

`npm run test:regression` artık mevcut PART 32 canonical fixture'a ek olarak `tests/strength-generation-regression.mjs` çalıştırır.

Matrix:

- 1/3/6 ay
- beginner/intermediate/experienced
- easy/normal/hard
- 15 dk `Sadece Kuvvet`: generation + audit PASS beklenir.
- 20 dk `Boks + Kuvvet`: fail-closed beklenir.
- 30 dk `Boks + Kuvvet`: generation + audit PASS beklenir.

Historical boxing fingerprint baseline'ları değiştirilmez.
