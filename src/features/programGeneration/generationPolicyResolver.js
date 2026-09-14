/**
 * GENERATION POLICY RESOLVER (PART 20)
 * --------------------------------------------------------------
 * Single source of truth for generation policy version resolution.
 * Preview / Audit / Generator / Persistence içinde ayrı ayrı version
 * çözme mantığı tekrar etmez — hepsi burayı kullanır.
 *
 * Invariant:
 *   missing field (undefined)      → V1 (legacy)
 *   null                           → fail-closed (explicit but unknown)
 *   explicit V1                    → V1 (active)
 *   explicit V2                    → V2 (defined but NOT active — fail-closed)
 *   unknown                        → fail-closed
 *
 * V2 production generation henüz aktif değildir. Bu resolver yalnızca
 * version'u çözer ve aktif/pasif durumunu belirler. V2 audit/generation
 * path ileride ilgili PART'ta açılır.
 * --------------------------------------------------------------
 */
import { GENERATION_POLICY_VERSIONS, CURRENT_GENERATION_POLICY_VERSION } from '@/config/architecture';

const V1 = GENERATION_POLICY_VERSIONS.V1;
const V2 = GENERATION_POLICY_VERSIONS.V2;

/**
 * programVersion.generationPolicyVersion'ı çözer.
 *
 * @param {object|null|undefined} programVersion
 * @returns {{
 *   resolved: boolean,
 *   version: number|null,
 *   active: boolean,
 *   legacy: boolean,
 *   reason?: string,
 *   raw?: *
 * }}
 */
export function resolveGenerationPolicyVersion(programVersion) {
  const raw = programVersion ? programVersion.generationPolicyVersion : undefined;

  // Legacy: field genuinely missing (undefined) → V1.
  // null is an EXPLICIT value — treated as unknown (fail-closed).
  // IndexedDB structured clone omits undefined properties, so legacy
  // programs (pre-PART-20) will have undefined, never null.
  if (raw === undefined) {
    return { resolved: true, version: V1, active: true, legacy: true };
  }

  // Explicit V1
  if (raw === V1) {
    return { resolved: true, version: V1, active: true, legacy: false };
  }

  // Explicit V2 — defined but not yet active in PART 20
  if (raw === V2) {
    return { resolved: true, version: V2, active: false, legacy: false };
  }

  // Unknown — fail-closed
  return {
    resolved: false,
    version: null,
    active: false,
    legacy: false,
    reason: 'unsupported_generation_policy_version',
    raw,
  };
}

/**
 * Aktif production generation policy version'ını döndürür.
 * PART 20: V1 (V2 henüz aktif değil).
 */
export function getActiveGenerationPolicyVersion() {
  return CURRENT_GENERATION_POLICY_VERSION;
}