/**
 * Stabil ID üretimi. Date.now() tek başına kullanılmaz.
 * crypto.randomUUID tercih edilir; yoksa güvenli fallback.
 * Sabit katalog kayıtları ileride domain ID (ör. BOX_JAB) kullanır;
 * dinamik kayıtlar bu helper ile benzersiz ID alır.
 */
function fallbackUuid() {
  const rnd = () => Math.random().toString(16).slice(2).padStart(4, '0');
  const now = Date.now().toString(16);
  return `${now}-${rnd()}${rnd()}-${rnd()}${rnd()}`;
}

export function generateId(prefix) {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : fallbackUuid();
  return prefix ? `${prefix}_${uuid}` : uuid;
}