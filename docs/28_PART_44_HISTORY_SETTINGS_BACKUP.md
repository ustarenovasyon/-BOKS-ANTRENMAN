# PART 44 — History, settings, backup and offline shell

History reads real terminal workout records, distinguishes completed/partial/skipped, filters by planned date and status, and saves optional self-reported effort/notes. No performance score is inferred.

Settings provide sound/vibration cues, theme, JSON backup export/import, a local recovery checkpoint and two-step reset. Backup format v1 carries DB schema version 2 and SHA-256 integrity. Import rejects unknown versions, broken references, duplicate identities, corrupt fingerprints and invalid approved programs. Failed drafts remain failed drafts. All stores replace atomically; the previous complete state is captured in the same transaction. Recovery snapshots exclude themselves, preventing recursive growth. One daily local checkpoint and pre-import/reset checkpoints are retained. An external JSON copy remains necessary to survive clearing browser storage. Reset explicitly retains the recovery checkpoint, as the UI states.

Production builds precache their own local app shell and hashed assets through a service worker. Offline reload/deep links fall back to the cached app entry. Updates wait for the normal service-worker lifecycle so an active workout is not forcibly reloaded. No external runtime/backend/auth dependency is added.

Validation includes actual Chromium IndexedDB export/reset/recovery/import round-trips, corruption rejection without data loss, history feedback persistence, theme/download UI, real v1→v2 DB migration, and production offline reload/navigation, plus all previous regression and build/type/lint/independence gates.
