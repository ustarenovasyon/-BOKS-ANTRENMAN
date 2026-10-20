# BOX ANTRENMAN

Tek kullanıcılı, Türkçe, offline-first boks ve kuvvet antrenman uygulaması. React + Vite kullanır; veri yalnız cihazdaki IndexedDB'de repository katmanı üzerinden tutulur. Hesap veya backend gerekmez.

## Kullanım

1. Program Oluştur ekranında süre, günler, deneyim ve ekipmanı seçin.
2. Önizlemede programı gözden geçirin ve onaylayın.
3. Ana Sayfa'dan antrenmana geçin. Sayaç bitince tamamlamayı kendiniz onaylayın.
4. Programlarım’dan yeni program oluşturun, mevcut programı düzenleyin veya kopyalayın. Silmek gerekmez. Aktif programın duruşu değiştirilebilir; geçmiş korunur. Duraklatma, arşiv ve geri alınabilir çöp kutusu da bu ekrandadır.
5. Geçmiş ekranında gerçek sonuçları ve isteğe bağlı not/zorluk beyanını görün.
6. Ayarlar'dan JSON yedeğini dışa aktarın veya içe aktarın.

Yeni programlar V2 ile 1, 3, 6, 9, 12, 15, 18 veya 24 aylık oluşturulur. Üç deneyim seviyesi ve boks/kuvvet/birleşik mod desteklenir. Eski V1 programları korunur. Footwork ayrı teknik blok ve kombinasyon öncesi/sonrası talimat olarak sunulur; yumruk sayısına eklenmez. Teknik ipuçları ölçüm veya performans skoru değildir. Pivot ve Stance Reset kapsam dışı/DEFER durumundadır.

## Kurulum

```bash
npm ci
npm run dev
```

Production ve kontrol:

```bash
npm run verify:independent
npm run test:regression
npm run typecheck
npm run lint
npm run build
npx playwright install --with-deps chromium
npm run test:browser
npm run preview
```

Tarayıcı testleri gerçek IndexedDB ve üretim motorunu kullanır. CI ve Pages aynı kapıları yayın öncesinde çalıştırır. Test matrisi: 216 V2 kombinasyonu; her biri iki bağımsız üretim/audit ve exact FP/AFP kontrolü. V1 canonical gate: `FP_9b61698b / AFP_3194287436` (104 seans).

## Android APK

Android7 ve üstü için bağımsız `com.ustarenovasyon.boxantrenman` uygulaması vardır. Uygulama dosyaları APK içine gömülür; ilk açılış dahil internet veya Chrome gerektirmez. Webdeki kayıtlarını aktarmak için web Ayarlar → JSON yedeğini indir; APK Ayarlar → JSON yedeği seç → doğrulanmış yedeği geri yükle adımlarını kullan. Uygulamayı kaldırmak yerel APK verilerini siler; önce JSON yedeği al.

Derleme: Java17, Gradle8.9 ve AndroidSDK35/build-tools35.0.0 ile `npm ci`, `npm run build:android`, `gradle -p android assembleRelease`. Unsigned çıktıyı özel kalıcı anahtarla imzala. Gelecek güncellemeler aynı anahtar/applicationId ve daha yüksek versionCode kullanır. CI çevrimdışı API35 native UI testi uygular. Ayrıntı: [PART47](docs/32_PART_47_ANDROID.md).

## Çevrimdışı çalışma ve veri

Production ilk başarılı çevrimiçi açılıştan sonra uygulama dosyalarını service worker ile önbelleğe alır. Sonraki açılışlar çevrimdışı çalışır. Geliştirme sunucusu service worker kullanmaz. Sekme arka plana gidince sayaç durur; yeniden açılışta son kayıtlı noktadan duraklatılmış olarak devam edilir. Süre dolması kendiliğinden tamamlandı kaydı oluşturmaz.

Günlük yerel kurtarma kopyası ve içe aktarma/sıfırlama öncesi atomik kurtarma kaydı vardır. Tarayıcı verilerini temizlemek bunları da siler; Ayarlar'dan dışa aktarılan JSON'u cihaz dışında saklayın. İçe aktarma biçim, sürüm, bütünlük ve program ilişkilerini doğrular; hata varsa mevcut veri korunur.

## Geliştirme

Başlangıç: [güncel durum](docs/00_PROJE_DURUMU.md), [mimari](docs/01_MIMARI_ANAYASA.md), [PART kararları](docs/07_PART_YOL_HARITASI.md), [geliştirme kuralları](docs/12_GELISTIRME_KURALLARI.md), [V2 aktivasyon kapısı](docs/29_PART_45_V2_ACTIVATION.md).

Repository tek kaynak deposudur. V1 default compatibility sabiti değiştirilmez; oluşturma UI'sı explicit V2 ister. Bilinmeyen/null sürümler fail-closed kalır.

Program yönetimi ve veri koruma sözleşmesi: [PART46](docs/31_PART_46_PROGRAM_MANAGEMENT.md).
