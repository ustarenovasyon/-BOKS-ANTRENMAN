# Workout, History ve Settings

Üç ekran production akışına bağlıdır; placeholder veya demo veri kullanmaz.

## Workout

`upcoming → in_progress ↔ paused → awaiting_completion_confirmation → completed`

Partial/skipped ayrı terminal sonuçlardır. Süre dolması otomatik completed değildir. Blok atlayan seans partial olur. Onay tekrarı aynı güne ikinci history kaydı eklemez. Yalnız onaylı/locked ve fingerprint doğrulanmış program açılır.

Boks attack/defense/footwork ayrı, work/rest görünür. Kombinasyon tek tek yumruk zamanlamasına zorlanmaz. Kuvvet set aralıkları persisted toplam bütçeyi böler. Teknik cue/guard/balance talimattır; fiziksel ölçüm yoktur.

Arka plana geçince durur; reload son checkpoint'i paused olarak açar. Kapalı geçen zaman yapılmış süreye eklenmez. Stale tab yazımı revision kontrolünde reddedilir. Abrupt kapanmada son yarım saniyelik tick kaybolabilir. Ayrıntı: `27_PART_43_WORKOUT_PLAYER.md`.

## History

Repository'den gerçek completed/partial/skipped kayıtları, planlanan/yapılan süre, tarih ve program adı gösterilir. Tarih/durum filtrelenebilir. Not ve efor kullanıcının öz beyanıdır.

## Settings ve çevrimdışı

Ses/titreşim/tema, JSON export/import, kurtarma noktası ve çift adımlı sıfırlama çalışır. Sıfırlama yerel kurtarma noktasını koruduğunu açıkça belirtir. İçe aktarma atomiktir; geçersiz dosya mevcut veriyi değiştirmez. Production service worker ilk online açılışta shell/assets'i cache eder. Ayrıntı: `28_PART_44_HISTORY_SETTINGS_BACKUP.md`.

390 × 844 Chromium testleri gerçek IndexedDB üzerinde oluşturma/onay/workout/reload/history/backup/migration/offline akışlarını çalıştırır. Hareket medyası, pivot veya fiziksel skor eklenmemiştir.

## PART46 yönetim akışları

Programlarım ve Önizleme düzenle/kopyala/duraklat/devam/arşiv/çöp kutusu sağlar. Oluşturma ekranı edit/copy modunda kaynak version'ın gerçek tercihlerini yükler. Ana Sayfa ve Workout doğru program ID'sini taşır; duruş görünür. History program filtresi, özgün version görüntüsü, not silme ve geri alınabilir kayıt silme içerir. Settings program yönetimine bağlantı sağlar. Detay ve testler: `31_PART_46_PROGRAM_MANAGEMENT.md`.
