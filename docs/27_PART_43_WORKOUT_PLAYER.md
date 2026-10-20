# PART 43 — Real workout player

The player uses approved, locked, fingerprint-checked persisted programs. No demonstration workout or fabricated history is inserted. Home reads real programs/progress. Workout selects the first unfinished day or an explicit day query.

State contract: upcoming → in_progress ↔ paused → awaiting_completion_confirmation → completed. Partial and skipped are explicit terminal outcomes. Timer expiration never commits history until the user confirms. Skipping any block prevents completed status and produces partial. Per-day history identity is stable; repeated confirmation cannot double-count.

An explicit clock drives a pure reducer. Hidden pages pause; reloading restores the last durable checkpoint as paused and does not count time while closed. Work/rest phases follow persisted boxing blocks. Strength set pacing windows partition the persisted work budget exactly, with recorded rests and transitions. No per-punch timing or measured repetition claim is introduced.

Progress/history writes are atomic through a localData repository. Revision checks reject stale writes from other tabs. Save errors are visible and stop ticking. The latest checkpoint can lose at most the half-second tick interval on abrupt process termination. The player displays technique instructions from the existing instruction-only layer.

LOCKED. Validation: original V1 gates, pure clock/pause/restore/skip/confirmation and strength budget tests, independence/typecheck/lint/build. Two Chromium tests passed against real IndexedDB: generation → persistence → audit → approval → timer → reload → completion confirmation → exactly one history row; and skipped-workout recording. Browser tests run at a 390 × 844 viewport. The test clock is controlled only by Playwright; production contains no fake timer/data provider.
