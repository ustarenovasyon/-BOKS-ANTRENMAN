# Açık Riskler ve Karar Gerektiren Konular

## 1. PART 32 regression fixture

6M/104 historical `FP_9698c40e / AFP_628181959` exact fixture kayıp. Durable canonical fixture repository'ye eklenmeden PART 32 final lock eksik kabul edilmelidir.

## 2. Otomatik test altyapısı yok

Kaynakta çok sayıda validator var ancak standart test runner/fixture suite yok. Vitest + deterministic fixture tests yüksek önceliktir.

## 3. TypeScript/checkJs borcu

Kod JavaScript ağırlıklıdır ve JSDoc/checkJs tipleri bazı feature dosyalarında eksik/gevşektir. Runtime logic değiştirmeden kademeli type hygiene yapılmalıdır.

## 4. Workout player eksik

Program üretilebiliyor ama gerçek antrenman yürütme ekranı placeholder. Kullanıcı değerinin büyük kısmı burada oluşacaktır.

## 5. Data export/import yok

Offline-only storage tarayıcı temizliğiyle kaybolabilir. Backup kritik.

## 6. 9–24 ay yok

UI/generator yalnız 1/3/6. Hedefe 9/12/15/18/24 eklenmeli.

## 7. Intermediate/experienced V2 timeline

V2 curriculum stage resolver şu anda beginner timeline odaklıdır. Diğer experience seviyeleri için fail-safe davranış korunurken gerçek timeline tanımlanmalıdır.

## 8. Pivot/angle yok

Direction translation mevcut; rotation/angle domain yok. Pivot eklemek için ayrı architecture gerekir.

## 9. Media kararı çatışması

Current source text-only/no-images kilidi taşır. Eğer ürün hedefi hareket video/GIF/animasyon zorunluluğu ise mimari karar resmi olarak güncellenmelidir.

## 10. SPA deploy

BrowserRouter kullanıldığı için static hosting deep-link fallback ayarı gerekir.
