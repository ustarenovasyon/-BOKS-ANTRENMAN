# BOX ANTRENMAN — Repository Agent Rules

Bu repository bağımsız, tek kullanıcılı ve offline-first bir uygulamadır. Harici backend, login/hesap sistemi veya bulut AI zorunluluğu ekleme.

## Değişmez kurallar
- Kullanıcı verisi IndexedDB/repository katmanında kalır; UI doğrudan DB kullanmaz.
- Üretim motoru deterministic olmalıdır; `Math.random`, `Date.now()` tabanlı seçim veya simülasyon ekleme.
- V1 davranışını ve kilitli fingerprint/regression sözleşmelerini bilinçsizce değiştirme.
- V2 aktif edilmeden önce generation, audit ve preview path'leri birlikte doğrulanmalıdır.
- Footwork attack `moveIds` içine girmez ve punch `moveCount` değerini şişirmez.
- Kamera/sensör yokken fiziksel teknik kalitesini gözlemlemiş gibi skor üretme.
- Yeni süre/seviye desteğinde curriculum, progression, selector, audit ve regression testleri birlikte ele alınır.
- Üretim kodunda geçici fixture veya hard-coded test kimliği bırakma.

## Çalışma akışı
1. İlgili `docs/` dosyalarını oku.
2. Değişiklik öncesi mevcut invariant/regression değerlerini çıkar.
3. Minimum kapsamlı değişiklik yap.
4. `npm run typecheck`, `npm run lint`, `npm run build` çalıştır.
5. Domain değişikliği varsa determinism/regression testlerini de çalıştır.
6. Sonucu `docs/` karar kayıtlarıyla uyumlu tut.

## Git
- Her PART ayrı ve açıklayıcı commit olmalıdır.
- Kilitlenmemiş PART sonraki PART ile karıştırılmaz.
- Büyük refactor yerine küçük, geri alınabilir commit tercih edilir.
