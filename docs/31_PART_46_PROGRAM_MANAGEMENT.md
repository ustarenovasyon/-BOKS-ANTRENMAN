# PART 46 — Program Düzenleme ve Kayıp Olmadan Yönetim

## Sorun ve yeni davranış

Programlarım listesi doluyken yeni program düğmesi görünmüyordu. Mevcut programlar düzenlenemiyor, kopyalanamıyor veya ayrı ayrı yönetilemiyordu. Birden fazla aktif programın Ana Sayfa bağlantıları program seçimini taşımıyordu.

Yeni program düğmesi her zaman görünür. Mevcut programlar silinmeden bağımsız program veya tercihlerinden yeni bir V2 kopyası oluşturulabilir. Program adı eklenebilir; aktif program dahil gün, süre, seviye, zorluk, ekipman ve duruş düzenlenebilir. Düzenleme kaynak program tercihlerinden açılır; global profil kaynak programın yerine kullanılmaz.

## Sürüm ve ilerleme sözleşmesi

Ad değişikliği yalnız metadata güncellemesidir. Eğitim tercihi değişince yeni version oluşturulur; kaynak version/day/block ve history korunur. Eski generation policy ve seed korunur; takvim mevcut başlangıç tarihinden hesaplanır. Legacy V1 düzenleme 1/3/6 ayla sınırlıdır; 9+ ay için ayrı V2 kopyası oluşturulur. Default CURRENT=V1 ve tüm eski deterministic fixture'lar değişmez.

Yeni blueprint yeniden imzalanır, gerçek audit'ten geçer ve program/version/day/block/audit/progress tek transaction ile yazılır. Önceden onaylı programın yeni version'ı onaylı kalır; aktif/duraklatılmış/arşiv lifecycle korunur. Eğitim tercihi değişen onaysız taslak düzenleme sonrası onaya hazırdır. Arşivli taslak arşivde kalır ve çıkarıldığında onaylanabilir.

Tamamlanan/partial/skipped seanslar aynı plan tarihine bağlanan `carriedResults` referansı ile korunur. Yeni history veya yapılmış süre uydurulmaz; özgün sonuç eski version'da kalır. Tekrar düzenlemeler referansı doğrudan gerçek sonuç gününe taşır. Başlangıç tarihi/günler değişirse takvimden çıkan eski sonuçlar History'de bulunmaya devam eder.

Yarım kalan antrenman ancak yeni blok içeriği aynıysa yeni version'a taşınır. Duruş değişikliği Lead/Rear içeriği değiştirmediği için mevcut süre, konum ve atlanan bloklar korunur; seans duraklatılmış açılır. Yapıyı değiştiren düzenleme önce antrenmanı sonuçlandırmayı veya yeni program oluşturmayı ister; hiçbir kayıt kısmen yazılmaz. Kaynak progress checkpoint'i de korunur. Program ve progress revision kontrolleri eşzamanlı değişiklikleri reddeder. Eski sekme yeni version'a/paused/archived/trash programa timer sonucu yazamaz.

Eski tamamlanmış antrenman History'den özgün version/stance ile salt okunur açılır. Yeni version'ın ilk tamamlanmamış günü doğru program ID'siyle seçilir. Duruş Workout ve History'de görünür.

## Sayfa işlemleri

| Sayfa | İşlemler |
| --- | --- |
| Ana Sayfa | Her programın kendi antrenmanına git; programı düzenle; yeni program |
| Programlarım | Her zaman yeni program; ad arama ve durum filtresi; düzenle/kopyala/duraklat/devam/arşiv/sil/geri al |
| Oluştur/Düzenle | Kaynak tercihlerle dolu form; isim; kayıt öncesi düzenleme onayı; iptal/dön |
| Önizleme | Aynı yönetim işlemleri; paused/archived program önizlemesi |
| Workout | Seçili program ve duruş; program düzenleme bağlantısı; özgün geçmiş sonucu |
| History | Program filtresi; özgün duruş; not düzenle/sil; kayıt sil/geri al; antrenmanı görüntüle |
| Settings | Program yönetimine bağlantı; mevcut backup/reset sözleşmesi korunur |

## Silme ve arşiv

Program Sil işlemi onayla çöp kutusuna taşır. Version'lar, antrenmanlar, history ve notlar fiziksel olarak silinmez. Çöp kutusunda geri alma vardır. Arşiv/çöp kutusu programı sıradaki antrenmanlardan çıkarır ve çalışan checkpoint'i duraklatır. Diğer programlara dokunulmaz.

History Kaydı sil yalnız kaydı listeden çöp kutusuna taşır; seansın sonuçlanma durumu ve notlar korunur. Bu açıklama onayda gösterilir. Geri alınabilir. Notu sil yalnız o seansın öz beyan not/eforunu siler; history ve progress etkilenmez.

JSON backup tüm sürümleri, çöp kutusunu ve sonuç referanslarını içerir. İçe aktarma önceki version'ın aynı programa ait olduğunu, sonuç bağlantısının gerçek terminal/history kaydına ve aynı tarihe gittiğini doğrular; sahipsiz/döngüsel/bozuk bağlantıları reddeder. Eski yedek formatı/schema değişmez.

## Test sonucu — yerel PASS / LOCK

Independence, tüm regression (V1 canonical ve 216 V2 + 12 boundary), checkJs/typecheck, lint ve Pages subpath production build PASS. Gerçek IndexedDB/Chromium browser suite 12/12 PASS; 320px yönetim ekranında yatay taşma yok. V1 canonical değişmedi: `FP_9b61698b / AFP_3194287436`. Final branch/main CI ve Pages yayın kapısı ayrıca doğrulanır.

## Test kapsamı

Gerçek Chromium/IndexedDB üzerinde 6 yeni senaryo:

1. V1 aktif duruş düzenleme: 5 sn checkpoint, kaynak version ve history aynı, eski sekme yazımı/yapısal uygunsuz edit reddi.
2. V2 aynı akış; yeni settings/fingerprint ve backup doğrulaması.
3. Bağımsız V2 kopyası, iki programın ayrı Home hedefleri, pause/archive/trash/restore ve dar mobil görünüm.
4. History çöp kutusu/geri alma, bağımsız not silme ve eski antrenmanın okunması.
5. Birden çok V2 genel düzenleme, gerçek completion referansı, backup restore round-trip, bozuk lineage ve stale edit reddi.
6. Arşivli/onaysız taslağın düzenlenip arşivden çıkarıldıktan sonra onaylanması.

Bu testler mevcut 6 browser senaryosuna eklenir. Tüm eski 216 V2 exact fixture, 12 duration/density boundary, V1 FP/AFP, independence, checkJs/typecheck, lint ve production build release kapılarıdır. Son GitHub CI/Pages ayrıca exact SHA ile doğrulanır.

## Exact changed files

- `README.md`
- `docs/00_PROJE_DURUMU.md`
- `docs/03_VERI_MODELI_VE_INDEXEDDB.md`
- `docs/07_PART_YOL_HARITASI.md`
- `docs/10_UI_WORKOUT_HISTORY_SETTINGS.md`
- `docs/31_PART_46_PROGRAM_MANAGEMENT.md`
- `src/features/backup/dataBackup.js`
- `src/features/history/workoutHistoryService.js`
- `src/features/programManagement/ProgramActions.jsx`
- `src/features/programManagement/programManagementService.js`
- `src/features/programPreview/previewLabels.js`
- `src/features/programPreview/programPreviewService.js`
- `src/features/workout/workoutService.js`
- `src/lib/localData/programManagementRepository.js`
- `src/lib/localData/workoutRepository.js`
- `src/pages/History.jsx`
- `src/pages/Home.jsx`
- `src/pages/ProgramCreate.jsx`
- `src/pages/ProgramPreview.jsx`
- `src/pages/Programs.jsx`
- `src/pages/Settings.jsx`
- `src/pages/Workout.jsx`
- `tests/browser/helpers.js`
- `tests/browser/program-management.spec.js`
