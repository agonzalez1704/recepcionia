type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

/**
 * Rate limit en memoria. NO sirve para horizontal scale — en producción serio
 * usar Redis o Upstash. Para Vercel single-region en dev/staging alcanza.
 */
export function rateLimit(key: string, limit: number, ventanaMs: number): { ok: boolean; restante: number; resetAt: number } {
  const ahora = Date.now();
  const actual = store.get(key);
  if (!actual || actual.resetAt < ahora) {
    const nuevo = { count: 1, resetAt: ahora + ventanaMs };
    store.set(key, nuevo);
    return { ok: true, restante: limit - 1, resetAt: nuevo.resetAt };
  }
  if (actual.count >= limit) {
    return { ok: false, restante: 0, resetAt: actual.resetAt };
  }
  actual.count += 1;
  return { ok: true, restante: limit - actual.count, resetAt: actual.resetAt };
}
