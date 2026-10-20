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
 *   explicit V2                    → V2 (active since PART 45)
 *   unknown                        → fail-closed
 *
 * Generator, audit ve preview V2 path'leri PART 45'te birlikte açıldı.
 * Eksik version için legacy V1 varsayılanı değişmez.
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

  // Explicit V2 — jointly activated in PART 45
  if (raw === V2) {
    return { resolved: true, version: V2, active: true, legacy: false };
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
 * Legacy/default generation policy version'ını döndürür.
 * V1 compatibility default korunur; yeni program UI'sı explicit V2 ister.
 */
export function getActiveGenerationPolicyVersion() {
  return CURRENT_GENERATION_POLICY_VERSION;
}
