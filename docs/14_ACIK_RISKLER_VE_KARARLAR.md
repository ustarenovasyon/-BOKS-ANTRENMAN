# Açık Riskler ve Karar Gerektiren Konular

## Çözülen konular

### PART 32 durable regression fixture — CLOSED

Historical 6M/104 `FP_9698c40e / AFP_628181959` çifti historical/unreproducible olarak korunur ve active gate değildir.

Yeni canonical self-contained fixture repository'ye eklendi:

- `tests/fixtures/v1/6m-beginner-4dpw.json`
- 104 session
- explicit generation seed/request ID
- iki bağımsız run deep-equal
- `FP_9b61698b`
- `AFP_3194287436`
- audit pass / critical 0 / warning 0

### Minimum otomatik regression altyapısı — CLOSED FOR PART 32

Standart kalıcı runner artık vardır:

- `npm run test:regression`
- `tests/run-regression.mjs`
- `.github/workflows/ci.yml`

CI independence + regression + lint + build zincirini her push/PR'da çalıştırır. Bu, tüm gelecekteki regression matrix'in tamamlandığı anlamına gelmez; suite ilerleyen PART'larda genişletilmelidir.

### SPA deploy — CLOSED

GitHub Pages subpath için Vite base, router basename, SPA fallback ve GitHub Actions deploy akışı kurulmuştur. Production preview GitHub Pages üzerinden yayınlanır.

## Açık riskler

### 1. Historical 1M / 3M / 6M78 executable fixture input'ları eksik

Bilinen exact historical baseline çiftleri korunur:

- 1M: `FP_d703233d / AFP_1456231044`
- 3M: `FP_cf99b187 / AFP_1436708599`
- 6M/78: `FP_eab5e5c1 / AFP_1046783139`

Ancak original complete generation input object'leri repository'de ve eldeki karar kayıtlarında bulunmamaktadır. Seed/requestId/date tahminiyle sahte exact fixture oluşturulmaz. Gelecekte güvenilir original input evidence bulunursa executable gate olarak eklenebilir.

### 2. TypeScript/checkJs borcu

Kod JavaScript ağırlıklıdır ve JSDoc/checkJs tipleri bazı feature dosyalarında eksik/gevşektir. `npm run typecheck` mevcut durumda çok sayıda pre-existing hata verir. Runtime logic değiştirmeden kademeli type hygiene yapılmalıdır.

### 3. Workout player eksik

Program üretilebiliyor ama gerçek antrenman yürütme ekranı placeholder. Kullanıcı değerinin büyük kısmı burada oluşacaktır.

### 4. Data export/import yok

Offline-only storage tarayıcı temizliğiyle kaybolabilir. Backup kritik.

### 5. 9–24 ay yok

UI/generator yalnız 1/3/6. Hedefe 9/12/15/18/24 eklenmeli.

### 6. Intermediate/experienced V2 timeline

V2 curriculum stage resolver şu anda beginner timeline odaklıdır. Diğer experience seviyeleri için fail-safe davranış korunurken gerçek timeline tanımlanmalıdır.

### 7. Pivot/angle yok

Direction translation mevcut; rotation/angle domain yok. Pivot eklemek için ayrı architecture gerekir.

### 8. Media kararı çatışması

Current source text-only/no-images kilidi taşır. Eğer ürün hedefi hareket video/GIF/animasyon zorunluluğu ise mimari karar resmi olarak güncellenmelidir.
