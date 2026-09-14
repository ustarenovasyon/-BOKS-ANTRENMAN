# Veri Modeli ve IndexedDB

## Database

- Ad: `boks_kuvvet_db`
- Schema version: 2
- Adapter: `src/lib/localData/localDb.js`
- Migration registry: `src/lib/localData/migrations/index.js`

## Store'lar

- `app_meta`
- `settings`
- `training_profiles`
- `programs`
- `program_versions`
- `program_days`
- `workout_blocks`
- `workout_progress`
- `workout_history`
- `user_feedback`
- `boxing_moves`
- `boxing_transitions`
- `boxing_combinations`
- `defense_counter_rules`
- `strength_exercises`
- `strength_templates`
- `program_audits`

## Repository kuralı

UI veya feature code doğrudan `indexedDB` API'sine gitmemelidir. `baseRepository.js` veya domain repository'leri kullanılmalıdır. Böylece ileride SQLite/Capacitor/native adapter'a geçildiğinde business logic değişmeden kalabilir.

## Program persistence

Program generation önce pure blueprint üretir. Persist işlemi ayrı katmanda yapılır. Program/version/day/block kayıtları transaction ile yazılmalıdır; yarım program bırakılmamalıdır.

## Version ayrımı

Aşağıdaki sürümler aynı şey değildir:

- DB schema version
- movement library version
- combination library version
- defense library version
- engine versions
- generation policy version

Her biri ayrı contract olarak korunmalıdır.

## Gelecek gereksinimler

1. Kullanıcı için JSON export/import
2. Otomatik local backup snapshot
3. Schema migration regression testleri
4. Native uygulamaya geçilirse SQLite adapter
5. Workout progress/history gerçek kayıt akışı

Veri migration'ları eski kaydı silmemeli; destructive reset yalnız kullanıcı açıkça isterse yapılmalıdır.
