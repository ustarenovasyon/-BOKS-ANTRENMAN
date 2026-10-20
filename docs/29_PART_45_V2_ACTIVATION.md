# PART 45 — Ortak V2 Aktivasyonu ve Production Gate

## Karar

V2 generator, semantic audit, blueprint validator, persistence ve preview birlikte açıldı. Yeni program formu explicit `generationPolicyVersion: 2` gönderir. Eksik version legacy V1; explicit V1 aktif; null/unknown fail-closed. `CURRENT_GENERATION_POLICY_VERSION = V1` compatibility default değişmedi. V1 attack/defense/block/fingerprint yolu korunur.

Tüm 8 süre × 3 deneyim × 3 mod × 3 zorluk = 216 self-contained input fixture ile gerçek execution'dan FP/AFP kaydedildi. Her input explicit tarih, seed ve request ID taşır. Fixture üretim komutu mevcut dosyanın üzerine yazmayı reddeder; normal regression salt okunur exact sonuç kontrolüdür.

## Uygulama

- `programGenerationV2.js`: deterministic orchestration, mevcut selector/fitter/builder kullanımı.
- `v2ProgramPolicy.js`: merkezi takvim/rol/bütçe/progression/curriculum context; recovery ve footwork allocation; bounded work/rest ve tam süre korunumu.
- `v2StrengthPrescriptionFitter.js`: tier bir üst sınırdır; kısa seansın bütçesine sığmayan reçete alt tier ile deterministically yeniden fit edilir. V1 fitter değişmez.
- `v2StrengthCoverage.js`: recovery haftası öncesinde sonraki üç seansın daralan template havuzunu hesaba katar; rolling-4 coverage için ileride sağlanamayacak pattern'ları önceden korur. Uygun eski seçimler değişmez.
- `engineVersionSnapshot.js`: önceki V1 engine snapshot'ının aynı değerlerle merkezi helper'a taşınması.
- `programAuditV2.js`: generator çağırmadan calendar/order/link/budget/snapshot/role/strike/defense/footwork/strength/recovery denetimi.
- V2 fingerprint settings ve engine version dahil tüm gün/block içeriğini imzalar; lifecycle/oluşturma zamanı imzaya karışmaz. V1 signature değişmez.
- Preview bilinmeyen library/policy'yi reddeder. Persistence V2 semantic audit'i geçmeden yazmaz.
- Takvim month-index araması 12 yerine desteklenen maksimum 24 aya genişletildi. İlk 12 ay/V1 tarihleri aynı.
- Correction source policy'yi korur ve yeni version/day kimliklerinden sonra fingerprint'i yeniden hesaplar.
- UI sekiz süreyi gösterir; teknik görev hedefleri Workout ve preview'da talimat olarak görünür.
- Günlük backup hatası uygulamanın tamamını kilitlemek yerine görünür uyarı üretir; kullanıcı dışa aktarmaya erişebilir.

V2 main cap 6/challenge cap 7, support/foundational 2–3. Catch ve Slip attack moveIds'e sızmaz. Stage 5/6 mevcut movement'ları kullanır. İzole footwork ve before/after prescription punch count'a eklenmez. 9+ ay her dördüncü hafta recovery cap'leri uygular; session total sabit kalır. Pivot/Stance Reset DEFER. Sensör/kamera/skor veya otomatik kg önerisi yok.

## Doğrulama — yerel PASS / LOCK

- `npm run verify:independent`
- Tam `npm run test:regression`: tüm eski PART'lar + 216/216 V2.
- Her V2 input için iki ayrı üretim deep-equal, iki ayrı audit deep-equal, exact FP/AFP.
- Ek 12 boundary senaryosu: 24 ayda haftada 1/7 gün, 10/120 dk (birleşik mod minimum 30), her tek ekipman yolu ve yoğun recovery geçişleri.
- Takvim son month-index=duration; stage/length/role/defense/strike/time/recovery invariant'ları.
- Rehash sonrası bilinmeyen library/null policy, role, attack içine Catch, cycle ve erken lateral footwork bozulmaları reddedildi.
- Gizli `Date.now`/`Math.random` erişimi olmayan deterministic üretim.
- `npm run typecheck`, `npm run lint`, `npm run build` PASS.
- 6/6 gerçek Chromium/IndexedDB browser senaryosu PASS: önceki 5 senaryo + 24 aylık V2 create→preview→audit→approve→backup validation→workout/Step In.
- 390px mobil genişlikte overflow yok; tekniğin yalnız instruction olduğu görünür.

V1 canonical: 104 seans, `FP_9b61698b / AFP_3194287436`, critical 0/warning 0. Historical eski çiftler overwrite edilmedi. PART34/35 synthetic V2 imzaları tarihsel destek katmanı örnekleridir; yeni tam V2 signature onları active production fixture yapmaz. V1'i yalnız V2 etiketiyle değiştiren synthetic program artık gerçek V2 kurallarıyla reddedilir.

Yerel tam gate bu commit'in kilididir. Final branch CI ve merge sonrası main CI/Pages exact SHA sonuçları release kapısıdır; bu kayıt o sonuçları önceden PASS ilan etmez.

Pages ile aynı `GITHUB_ACTIONS=true` subpath build üzerinde 6/6 browser testi de PASS.
