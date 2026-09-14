# UI Tamamlama Planı

## Mevcut durum

### Hazır
- Program oluşturma formu
- Program listesi
- Program preview
- Audit/correction/approval bileşenleri
- App shell / bottom navigation

### Placeholder
- Workout
- History
- Settings

## Workout player hedefi

Workout ekranı en az şu state machine'i desteklemelidir:

`upcoming → in_progress ↔ paused → awaiting_completion_confirmation → completed`

Ayrıca `partial` ve `skipped` davranışı açıkça tanımlanmalıdır.

Süre bitti diye otomatik completed yapılmamalıdır; kullanıcı onayı gerekir.

## Boxing round UI

- Round numarası
- Attack combo
- Defense instruction varsa ayrı gösterim
- Footwork prescription varsa ayrı görsel/tekst katmanı
- Work/rest timer
- Pause/resume
- Sonraki round

Footwork punch gibi cadence içine zorlanmamalıdır.

## History

`workout_history` store'dan:

- tarih
- program
- tamamlanma durumu
- planlanan / yapılan süre
- skip/partial
- kullanıcı feedback

gösterilmelidir.

## Settings

Önerilen ilk ayarlar:

- Data export/import
- Local data reset (çift onay)
- Ses/titreşim tercihleri
- Timer preferences
- UI theme gerekiyorsa

Program generation ayarları Training Profile'da kalmalıdır; generic app settings ile karıştırılmamalıdır.
