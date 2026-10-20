/**
 * Stabil ID üretimi. Date.now() tek başına kullanılmaz.
 * crypto.randomUUID tercih edilir; yoksa güvenli fallback.
 * Sabit katalog kayıtları ileride domain ID (ör. BOX_JAB) kullanır;
 * dinamik kayıtlar bu helper ile benzersiz ID alır.
 */
function fallbackUuid() {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') throw new Error('Güvenli kimlik üretimi bu tarayıcıda desteklenmiyor.');
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function generateId(prefix) {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : fallbackUuid();
  return prefix ? `${prefix}_${uuid}` : uuid;
}
