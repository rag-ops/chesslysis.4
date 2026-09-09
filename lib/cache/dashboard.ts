type Entry<T> = { value: T; expiresAt: number };

const cache = new Map<string, Entry<unknown>>();

export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const value = await loader();
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
