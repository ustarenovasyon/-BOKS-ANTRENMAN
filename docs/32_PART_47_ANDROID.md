# PART47 — Android APK

Android paketi `com.ustarenovasyon.boxantrenman`, minSdk24 (Android7), target/compile35; versionCode1/versionName1.0.0. Mevcut React uygulaması APK assets içine tamamen gömülür; Chrome/TWA veya canlı siteye yönlendirme kullanılmaz. Java17, Gradle8.9, AGP8.7.3, AndroidX WebKit1.12.1 sabittir.

WebViewAssetLoader HTTPS yerel origin kullanır. Yalnız yerel asset istekleri kabul edilir, dosya erişimi kapalıdır. Mesaj köprüsü yalnız bu origin ve ana frame içindir. JSON dışa aktarma Android CREATE_DOCUMENT, içe aktarma OPEN_DOCUMENT üzerinden çalışır; geniş depolama izni yoktur. IndexedDB, gerçek programlar, immutable sürümler ve history aynı repository katmanını kullanır. Web ve APK verileri farklıdır: web Ayarlar JSON yedeğini indir → APK Ayarlar JSON yedeği seç → doğrulanmış yedeği geri yükle. Otomatik veri taşıma iddiası yoktur.

Activity arka plana geçince timer geçiş anının zamanıyla duraklatılır; tekrar gelen native pause idempotenttir. Yeniden açılınca mevcut kalıcı duraklatılmış ilerleme yüklenir. Native paket service worker kaydetmez; internetten cache doldurmadan ilk açılışta çalışır. Web PWA manifesti Pages alt yoluyla uyumlu scope/start_url ve 192/512 PNG ikonlarını içerir.

## Derleme

`npm ci`, `npm run build:android`, AndroidSDK35 ve build-tools35.0.0 hazırken `gradle -p android assembleRelease` çalıştırılır. Çıktı unsigned APK'dir; kullanıcıya verilmeden önce özel kalıcı keystore ile apksigner kullanılarak imzalanmalıdır. Anahtar, şifre ve imzalı APK repository'ye commit edilmez. Gelecek güncellemeler aynı applicationId, aynı anahtar ve daha yüksek versionCode kullanmalıdır; aksi halde veri koruyan yerinde güncelleme yapılamaz.

`.github/workflows/android-apk.yml` derleme/lint sonrası unsigned APK üretir. API35 emülatöründe Wi-Fi ve mobil veri kapatılarak gerçek UI ile program üretimi, audit/onay, timer/background/recreate, native JSON export/import ve Android geri tuşu denenir. Web testleri ve V1/V2 exact regresyon kapıları ayrıca zorunludur. İmzalama ve emülatör sonucu teslimde kaydedilir; yalnız derlenmiş olması test PASS sayılmaz.
