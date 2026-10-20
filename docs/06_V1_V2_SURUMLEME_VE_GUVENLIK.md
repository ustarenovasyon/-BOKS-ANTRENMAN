# V1 / V2 Sürümleme ve Güvenlik

## PART 45 resolver sözleşmesi

| Girdi | Sonuç |
| --- | --- |
| Version field eksik/undefined | Legacy V1, aktif |
| Explicit 1 | V1, aktif |
| Explicit 2 | V2, aktif |
| Null veya bilinmeyen | Fail-closed |

`CURRENT_GENERATION_POLICY_VERSION = V1` geriye uyumluluk default'udur. Yeni program UI'sı explicit V2 ister. V1 yalnız 1/3/6 ay; V2 1/3/6/9/12/15/18/24 ay destekler.

## Ortak aktivasyon

Generator, audit, blueprint validator, persistence ve preview birlikte V2 destekler. Preview ve persistence V2 semantik audit'i geçmeden programı kabul etmez. Başka policy etiketiyle yeniden imzalanmış V1 fixture V2 program sayılmaz.

V2 fingerprint settings/engine sürümlerini, takvim/gün snapshot'larını ve tüm block içeriklerini deterministically imzalar. Audit generator'ı çağırmadan domain sözleşmelerini doğrular; yeniden hash edilmiş semantik bozulmalar da reddedilir. V1 signature ve audit summary değişmez; canonical `FP_9b61698b / AFP_3194287436` korunur.

## Library compatibility

Movement library current=3. Legacy V1 1/2/3 desteklenir; unknown/null reddedilir. Diğer engine sürümleri merkezi engine snapshot ile karşılaştırılır. Bilinmeyen sürüm UI'da kullanılabilir kabul edilmez. DB v1→v2 migration eski veriyi silmez; gerçek IndexedDB migration testi vardır.

## İzolasyon

V1 attack pool/defense selector/block shape ve FP/AFP değişmez. V2 Catch/footwork metadata V1'e sızmaz. Footwork attack moveIds veya punch moveCount'a eklenmez. 216 V2 fixture ve tüm V1 regression birlikte CI kapısıdır. Ayrıntı: `29_PART_45_V2_ACTIVATION.md`.
