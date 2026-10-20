# PART 37 final gate and type hygiene

Upstream main `39eb0f1402e0cb8fce727e26beb365b5c7f04f96` was retrieved byte-for-byte and checked before feature work. Main CI runs 34835458576 / 34835252710 and Pages run 34835252732 completed successfully. PART 37 is LOCKED.

The existing checkJs errors were repaired through explicit React prop types, optional input contracts, inferred return unions, correctly widened enum collections, and IndexedDB request typing. No type checking was disabled. Existing legacy snapshot boundaries remain structurally typed records. Preview error results now carry null view-model fields, without changing successful behavior.

Validation: independence, complete regression suite, typecheck, lint and production build. V1 canonical gate remains `FP_9b61698b / AFP_3194287436`; 104 sessions; instruction coverage 18/18. No historical fingerprint has been overwritten.

CI and Pages now require typecheck as well as the existing gates.
