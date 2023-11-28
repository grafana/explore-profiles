type CacheKeyable = { toString(): string };

export class CacheClient {
  store = new Map<string, any>();

  static buildCacheKey(...args: CacheKeyable[]) {
    let key = '';
    for (const arg of args) {
      key += String(arg);
    }
    return key;
  }

  get(...args: CacheKeyable[]): any {
    const cacheKey = CacheClient.buildCacheKey(...args);

    return this.store.has(cacheKey) ? this.store.get(cacheKey) : null;
  }

  // TODO: TTL?
  set(args: CacheKeyable[], data: any) {
    this.store.set(CacheClient.buildCacheKey(...args), data);
  }
}
