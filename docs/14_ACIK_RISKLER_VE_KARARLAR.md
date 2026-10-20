# Açık Riskler ve Kararlar

## Kapanan işler

- Canonical PART 32 fixture: 104 seans, `FP_9b61698b / AFP_3194287436`.
- Independence/regression/typecheck/lint/build CI kapıları; pre-existing checkJs hataları PART 37 final gate'te düzeltildi.
- Strength registry Map erişimi ve rolling-4 coverage hizası.
- 1–24 ay ve üç deneyim seviyesinin ortak V2 generator/audit/preview aktivasyonu.
- Gerçek Workout/Home/History/Settings, kullanıcı completion onayı.
- Atomik JSON export/import/kurtarma, DB migration ve offline production shell.
- Pages subpath build ve SPA fallback; browser suite deploy öncesi çalışır.

## Kalan sınırlar

1. Historical 1M/3M/6M78 ve eski 6M104 original complete input'ları eksik. Bilinen FP/AFP tarihçesi korunur; tahmini seed ile eskiymiş gibi fixture üretilmez.
2. Veri cihazdadır. Yerel kurtarma kopyası browser storage temizliğini atlatamaz; dışa aktarılan JSON ayrı yerde saklanmalıdır.
3. Pivot/Stance Reset DEFER. Rotation mimarisi `26_PART_42_ROTATION_ARCHITECTURE.md` içinde tanımlıdır; domain/movement/UI uygulaması yapılmamıştır.
4. Kamera/sensör yoktur; hareket doğruluğu veya fiziksel performans ölçülmez. Teknik ipuçları talimat, history eforu öz beyandır.
5. Görsel/GIF/video eklenmemiştir; metin tabanlı mimari korunur.
6. Chromium otomasyonu mobil boyutta çalışır. Gerçek cihazların ses/titreşim izinleri, iOS storage eviction ve farklı browser motorları ayrı cihaz testidir.
7. Ani process kapanışında en son yarım saniyelik workout checkpoint kaybolabilir. Yeniden açılış kapalı zamanı çalışılmış saymaz.

Final release için exact GitHub branch/main CI ve Pages başarıları ayrıca doğrulanmalıdır. Yerel PASS tek başına deploy kanıtı değildir.
