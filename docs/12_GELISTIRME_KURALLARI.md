# Geliştirme Kuralları

1. Her PART tek amaçlı olsun.
2. Current production policy V1'i istemeden değiştirme.
3. V1 regression baseline'larını yeni çıktıya göre sessizce güncelleme.
4. Unknown version fail-closed kalmalı.
5. `Math.random` kullanma.
6. Generation seçiminde cihaz saatine bağımlı gizli state kullanma.
7. UI doğrudan IndexedDB kullanmasın.
8. Yeni movement için library + curriculum + validator coverage birlikte güncellensin.
9. Yeni attack combo elle `requiredStage` yazmasın; movement'lardan derive et.
10. Footwork attack `moveIds` içine girmesin.
11. Catch/Slip defense ile attack catalog sınırını koru.
12. Kamera/sensör olmadan fiziksel teknik doğruluğu skorlama.
13. 9+ ay desteğini yalnız duration enum ekleyerek yapma.
14. Yeni block type eklenirse budget, builder, persistence, preview, audit ve workout player etkisini birlikte incele.
15. Library version bump legacy audit compatibility ile test edilsin.
16. Test fixture'ları temp script/conversation içinde bırakma; repository'ye persist et.
17. Her deterministic fixture explicit seed + requestId içersin.
18. Build/regression geçmeden PART lock verme.
19. Büyük refactor yerine küçük reversible değişiklikler yap.
20. Source-of-truth duplicate etme.

## Definition of Done

Bir PART ancak:

- scope dışı dosya değişikliği yoksa
- validation pass ise
- V1 regression korunuyorsa
- V2 safety gate bozulmadıysa
- docs gerekiyorsa güncellendiyse
- build/test sonucu raporlandıysa

kilitlenir.
