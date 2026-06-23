export function dedupeRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
  const cache = dedupeRequestCache as Map<string, Promise<unknown>>;
  const existing = cache.get(key);

  if (existing) {
    return existing as Promise<T>;
  }

  const promise = request().finally(() => {
    cache.delete(key);
  });

  cache.set(key, promise);
  return promise;
}

const dedupeRequestCache = new Map<string, Promise<unknown>>();
