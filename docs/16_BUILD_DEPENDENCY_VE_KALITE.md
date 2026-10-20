# Build, Dependency ve Kalite

## Tekrarlanabilir kapılar

```bash
npm ci
npm run verify:independent
npm run test:regression
npm run typecheck
npm run lint
npm run build
npx playwright install --with-deps chromium
npm run test:browser
```

PART 45 yerel tam zinciri PASS. Eski dependency indirme/typecheck engelleri kapanmıştır. JavaScript/JSDoc `checkJs=true` korunur; tip kontrolünü kapatarak yeşil sonuç alınmaz.

Regression tüm önceki PART'ları, canonical V1 lock'u, 216 V2 input/FP/AFP fixture'ını, bağımsız tekrarları, fail-closed ve yeniden hash edilmiş semantik bozulma kontrollerini içerir. Browser suite 6 gerçek Chromium/IndexedDB senaryosudur: timer/restore/explicit confirmation, skipped, history/backup, DB migration, offline production ve 24 aylık V2 UI.

Vite build local offline shell/hashed asset listesi üretir. `GITHUB_ACTIONS=true` production için `/-BOKS-ANTRENMAN/` base kullanır; dev server root kalır. Browser suite hem dev gerçek servisleri hem production preview'ı test eder. Özel yerel Chromium kurulumunda `PLAYWRIGHT_CHROMIUM_EXECUTABLE` desteklenir; CI normal Playwright Chromium kurar.

`.github/workflows/ci.yml` ve `deploy-pages.yml` aynı zorunlu kapıları çalıştırır. Deploy build ayrıca `404.html` SPA fallback üretir. Final yayın sonucunda exact CI/Pages run'ları kontrol edilir; yerel doğrulama ile yayın doğrulaması birbirine karıştırılmaz.

Base44/runtime/auth/backend/AI dependency eklenmemiştir. Playwright yalnız dev dependency'dir. İlk bundle yaklaşık 554 kB (gzip yaklaşık 163 kB); Vite chunk-size uyarısı build hatası değildir. İleride route splitting yapılabilir.
