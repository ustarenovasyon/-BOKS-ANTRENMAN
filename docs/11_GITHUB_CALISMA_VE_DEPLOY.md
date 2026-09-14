# GitHub Çalışma ve Deploy Rehberi

## Repository adı

Hedef repository: `BOX ANTRENMAN`.

## İlk push öncesi

1. Bu temiz ZIP'i aç.
2. `npm ci`
3. `npm run verify:independent`
4. `npm run build`
5. Git init / remote bağla
6. İlk commit'i "Independent baseline" olarak at.

## Branch stratejisi

- `main`: yalnız locked/stabil durum
- İsteğe bağlı `part/33-footwork-drill` gibi kısa ömürlü branch

Tek kişi projede bile her PART ayrı commit olmalıdır. Bir regression çıkarsa hangi PART'ın bozduğu kolay bulunur.

## Commit örneği

`PART 33: add V2 footwork drill contract`

## GitHub Actions önerisi

CI en az:

- npm ci
- verify:independent
- lint
- build
- regression test suite

çalıştırmalıdır.

## Deploy

Uygulama client-side BrowserRouter kullanır. GitHub Pages kullanılacaksa doğrudan subpath hosting için Vite `base` ve SPA fallback konusu çözülmelidir. En sorunsuz seçeneklerden biri özel domain + static host (GitHub Pages/Cloudflare Pages/Render Static Site) ile SPA fallback sağlamaktır.

Deploy provider değişse bile repository tek source-of-truth kalmalıdır.

## Secrets

Şu an backend/API secret gerekmemektedir. İleride analytics, sync veya başka servis eklenirse secret browser bundle'a gömülmemelidir.
