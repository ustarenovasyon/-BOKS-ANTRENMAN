# Mimari Anayasa

## Değişmez ilkeler

1. **Tek kullanıcı:** login, kayıt, rol, multi-tenant ve hesap backend'i yoktur.
2. **Offline-first:** ana iş mantığı internet olmadan çalışmalıdır.
3. **Yerel veri:** IndexedDB repository abstraction arkasındadır.
4. **Deterministic generation:** aynı fixture aynı blueprint'i üretmelidir. `Math.random` yasaktır.
5. **Fail-closed versioning:** bilinmeyen generation/library version sessizce kabul edilmez.
6. **V1 koruması:** V2 geliştirmesi V1 selector, defense ve persisted legacy programları değiştirmemelidir.
7. **Canonical domain:** movement/combo/defense IDs stabil olmalıdır.
8. **Pedagoji combo uzunluğuna indirgenmez:** zorluk; teknik, savunma, footwork, mesafe, açı, ritim ve counter katmanlarıyla gelişir.
9. **Fiziksel gözlem iddiası yok:** kamera/sensör yoksa sistem kullanıcının gardı, dengesi veya pivot açısını gerçekten ölçmüş gibi skor vermez.
10. **Veri migration'lıdır:** IndexedDB schema ve content-library version kavramları birbirinden ayrıdır.

## V1 / V2 sınırı

`CURRENT_GENERATION_POLICY_VERSION = V1` kalır. V2 üretim aktif edilmeden önce aşağıdaki üç yol birlikte açılmalıdır:

- generator
- audit
- preview

Birini tek başına açmak yasaktır.

## Footwork sözleşmesi

Footwork gerçek first-class teknik olabilir fakat attack combo `moveIds` içine girmez. Bunun nedeni attack `moveCount` değerinin punch sayısını temsil etmesidir. Örnek:

- Footwork: Step In
- Combo: Jab → Cross
- Footwork: Step Out

Kullanıcı açısından 4 teknik aksiyon olsa bile attack combo `moveCount = 2` kalmalıdır.

## Veri güvenliği

Kullanıcı verisi local cihazdadır. Uygulama veri yedekleme/export özelliği eklenene kadar tarayıcı storage temizliği veri kaybı riski taşır. İleride export/import veya native SQLite geçişi repository contract bozulmadan yapılmalıdır.

## UI ve medya notu

Current source `NO_IMAGES=true` ve text-based UI ilkesini içerir. Ürün hedefinde hareket video/GIF/animasyon isteniyorsa bu mevcut kilitle çelişir. Bu karar sessizce değiştirilmemeli; ayrı bir PART ile mimari anayasa güncellenmeli ve offline media cache/storage planı tanımlanmalıdır.
