# GitHub Çalışma ve Deploy Rehberi

## Repository

Canonical repository:

`ustarenovasyon/-BOKS-ANTRENMAN`

Repository tek source-of-truth'tur. Base44 runtime/backend/auth bağımlılığı yoktur.

## Yerel doğrulama

Değişiklik öncesi/sonrası kapsamına göre en az:

1. `npm ci`
2. `npm run verify:independent`
3. `npm run test:regression`
4. `npm run lint`
5. `npm run build`

çalıştırılmalıdır.

`npm run typecheck` ayrıca vardır ancak mevcut repository'de pre-existing JS/JSDoc type borcu bulunduğu için şu an lock gate değildir. Typecheck başarısızlığı gizlenmemeli veya diğer PASS sonuçlarıyla karıştırılmamalıdır.

## Branch stratejisi

- `main`: yalnız locked/stabil durum
- Her production PART için kısa ömürlü branch kullan
- Örnek: `part33-footwork-drill-preflight`

Tek kişi projede bile her PART ayrı commit/merge kapsamı olmalıdır. Regression çıkarsa hangi PART'ın bozduğu izlenebilmelidir.

## Kalıcı GitHub Actions CI

Aktif workflow:

`.github/workflows/ci.yml`

Her push/PR için zorunlu zincir:

- `npm ci`
- `npm run verify:independent`
- `npm run test:regression`
- `npm run lint`
- `npm run build`

PART 32 ile ilk durable regression runner repository'ye eklendi:

- `tests/run-regression.mjs`
- `tests/fixtures/v1/6m-beginner-4dpw.json`

Yeni PART'lar mevcut gate'i zayıflatmamalı; gerekirse suite'i genişletmelidir.

## GitHub Pages deploy

Aktif workflow:

`.github/workflows/deploy-pages.yml`

Canlı adres:

`https://ustarenovasyon.github.io/-BOKS-ANTRENMAN/`

Deploy yalnız `main` push sonrası çalışır ve publish öncesi:

- independence
- regression
- lint
- build

kontrollerini geçirir.

Vite repository subpath base ayarı ve BrowserRouter basename ayarı yapılmıştır. Workflow `dist/index.html` kopyasıyla SPA `404.html` fallback üretir; böylece static hosting deep-link davranışı korunur.

Deploy provider değişse bile repository tek source-of-truth kalmalıdır.

## Secrets

Şu an backend/API secret gerekmemektedir. İleride analytics, sync veya başka servis eklenirse secret browser bundle'a gömülmemelidir.
