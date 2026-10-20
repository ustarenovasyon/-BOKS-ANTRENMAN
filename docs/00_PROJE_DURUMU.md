# BOX ANTRENMAN — Güncel Proje Durumu

## Son durum — PART 45

Uygulama tek kullanıcılı, offline-first ve backend/login bağımsızdır. Yeni program oluşturma UI'sı explicit V2 kullanır. Generator, audit, persistence ve preview birlikte V2 destekler. Legacy missing-version ve explicit V1 programlarının yolu değişmez; `CURRENT_GENERATION_POLICY_VERSION = V1` compatibility default olarak korunur. Null/bilinmeyen version fail-closed kalır.

Desteklenen süreler: **1 / 3 / 6 / 9 / 12 / 15 / 18 / 24 ay**. Beginner/intermediate/experienced için tanımlı timeline, progression, role/length policy, defense, weekly balance ve recovery vardır. 9+ ayda her dördüncü hafta teknik recovery uygulanır; seans toplam süresi korunur. Stage 5/6 yeni movement açmaz. Pivot ve Stance Reset **DEFER**; yalnız rotation architecture kararı vardır.

## Tamamlanan kullanıcı akışları

- Program tercihleri → deterministic üretim → önizleme → audit → düzeltme/onay.
- Ana Sayfa: gerçek aktif program ve sıradaki gün.
- Workout: kalıcı work/rest ve kuvvet set aralıkları, pause/resume, arka planda duraklama, reload sonrası duraklatılmış devam.
- Süre dolunca açık kullanıcı onayı; partial/skipped ayrı ve aynı gün için history idempotent.
- Teknik talimatlar: cue/guard/balance; fiziksel doğruluk/skor iddiası yok.
- History: gerçek kayıtlar, tarih/durum filtresi, kullanıcı efor beyanı ve notlar.
- Settings: ses/titreşim/tema, doğrulamalı JSON export/import, atomik kurtarma ve çift adımlı sıfırlama.
- Production service worker: uygulama kabuğu ve yerel asset önbelleği; çevrimdışı reload/navigation.

## Domain kilitleri

18 movement = 10 strike + 4 defense + 4 footwork. Canonical attack 52; V2 supplemental 2, toplam 54. V1 defense 2 Slip-counter; V2 ilave 2 Catch-counter ile 4. Curriculum coverage 18/18. Step In / Step Out / Lead-side Step / Rear-side Step attack `moveIds` veya punch `moveCount` içine girmez.

V2 temel/support 2–3, main en fazla 6, challenge en fazla 7; 8+ üretmez. İzole footwork 60 sn'yi mevcut boks bütçesinden alır. Structured before/after prescription ayrı kalır. Lead/Rear stance-relative semantik korunur.

## Kalite durumu

Yerel independence, tüm regression suite, checkJs/typecheck, lint ve production build PASS. 216 self-contained V2 fixture (8 süre × 3 deneyim × 3 mod × 3 zorluk), bağımsız iki üretim/audit deep-equal ve exact FP/AFP PASS. Gerçek Chromium/IndexedDB üzerinde 6 tarayıcı senaryosu PASS; 390px mobil görünüm ve taşma kontrolü dahil. GitHub final CI ve Pages sonucu ayrıca yayın kapısıdır; yerel sonuç yayın sonucu olarak sunulmaz.

V1 canonical gate değişmedi: 104 seans, `FP_9b61698b / AFP_3194287436`, audit pass, critical 0, warning 0. Historical `FP_9698c40e / AFP_628181959` kayıp original-input nedeniyle historical/unreproducible kalır. Historical 1M/3M/6M78 çiftleri overwrite edilmez.

## Karar kayıtları

- PART 37 final gate: `23_PART_37_FINAL_GATE.md`
- PART 38 architecture: `24_PART_38_LONG_TERM_ARCHITECTURE.md`
- PART 39–41 support: `25_PART_39_41_LONG_DURATION_SUPPORT.md`
- PART 42 rotation architecture / pivot DEFER: `26_PART_42_ROTATION_ARCHITECTURE.md`
- PART 43 workout: `27_PART_43_WORKOUT_PLAYER.md`
- PART 44 history/settings/backup/offline: `28_PART_44_HISTORY_SETTINGS_BACKUP.md`
- PART 45 joint activation ve testler: `29_PART_45_V2_ACTIVATION.md`

Eski PART dokümanları o aşamadaki karar tarihçesidir. Önceki dormant/inactive V2 ve placeholder ifadeleri güncel durumu temsil etmez; PART 45 kaydı geçerlidir.

Pages ile aynı `GITHUB_ACTIONS=true` subpath build üzerinde 6/6 browser testi de PASS.
