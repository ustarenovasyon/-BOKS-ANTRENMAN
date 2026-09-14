# Base44 Bağımsızlaştırma Raporu

## Yapılan işlemler

Bu paket hazırlanırken runtime ve build zincirindeki Base44 bağlantıları kaldırıldı:

- `@base44/sdk` dependency kaldırıldı
- `@base44/vite-plugin` dependency kaldırıldı
- Vite config saf React/Vite hale getirildi
- Base44 client kaldırıldı
- Base44 app-param/bootstrap kodu kaldırıldı
- AuthContext kaldırıldı
- Login/Register/Forgot/Reset/OAuthConsent sayfaları kaldırıldı
- ProtectedRoute ve Base44 user access bileşenleri kaldırıldı
- `base44/` config/entity klasörü kaldırıldı
- remote Base44 favicon kaldırıldı
- package adı `box-antrenman` yapıldı
- README bağımsız proje formatına çevrildi
- AGENTS.md bağımsız repository kurallarıyla değiştirildi
- gereksiz, kullanılmayan Base44-era image helper kaldırıldı
- kullanılmayan UI boilerplate ve bağımlılıklar sadeleştirildi

## Runtime mimari sonucu

`src/App.jsx` artık auth/public-settings beklemez. Uygulama yalnız local DB initialization yapar ve doğrudan ana route'ları açar.

## Doğrulama

`scripts/verify-independent.mjs` runtime/package/config alanlarını tarar. `npm run verify:independent` ile çalıştırılır.

Migration dokümanında "Base44" kelimesinin geçmesi bağımlılık değildir; script bilinçli olarak `docs/` klasörünü taramaz.

## Silinen özelliklerin gerekçesi

Projenin kendi mimari anayasası `SINGLE_USER=true` ve hesap/login gereksiz dediği için auth sistemi yalnız platform kalıntısıydı. Kaldırılması business functionality kaybı değildir.

## Geri eklenmemesi gerekenler

- platform auth SDK
- hosted public-settings bootstrap
- builder-specific Vite plugin
- app_id/access_token URL bootstrap
- platform OAuth consent route

İleride sync/login istenirse yeni ve bağımsız mimari kararı olarak tasarlanmalıdır; eski platform katmanı geri taşınmamalıdır.
