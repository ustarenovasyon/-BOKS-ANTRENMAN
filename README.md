# BOX ANTRENMAN

Tek kullanıcılı, offline-first boks ve kuvvet antrenman uygulaması. Uygulama React + Vite ile çalışır; kalıcı veri tarayıcı IndexedDB üzerinde repository katmanı aracılığıyla tutulur. Harici backend ve hesap/giriş sistemi zorunlu değildir.

## Kurulum

```bash
npm ci
npm run dev
```

Vite yerel adresini açın. Production build:

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
```

## Mimari

- React 18 + Vite
- React Router
- IndexedDB local persistence
- Deterministic program generation
- V1 aktif generation policy; V2 geliştirme altında ve fail-closed
- Boks movement/combo/defense/curriculum kütüphaneleri
- Kuvvet exercise/template sistemi
- Program generation, audit, correction ve approval katmanları

Detaylı proje kaynakları `docs/` klasöründedir. Geliştirmeye başlamadan önce özellikle `docs/00_PROJE_DURUMU.md`, `docs/01_MIMARI_ANAYASA.md`, `docs/07_PART_YOL_HARITASI.md` ve `docs/12_GELISTIRME_KURALLARI.md` okunmalıdır.

## Veri

Veriler kullanıcı cihazındaki IndexedDB'de tutulur. Tarayıcı verisi temizlenirse yerel kayıtlar silinebilir; ileride export/import ve native/SQLite katmanı planlanmalıdır.

## Repository

Bu repository projenin tek kaynak deposu olacak şekilde hazırlanmıştır. Harici builder senkronizasyonuna bağlı değildir.
