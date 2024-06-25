type CacheKeyable = { toString(): string };

export class MemoryCacheClient {
  store = new Map<string, any>();

  static buildCacheKey(args: CacheKeyable[]) {
    let key = '';
    for (const arg of args) {
      key += String(arg);
    }
    return key;
  }

  get(args: CacheKeyable[]): any {
    return this.store.get(MemoryCacheClient.buildCacheKey(args));
  }

  // TODO: TTL?
  set(args: CacheKeyable[], data: any) {
    this.store.set(MemoryCacheClient.buildCacheKey(args), data);
  }

  delete(args: CacheKeyable[]) {
    this.store.delete(MemoryCacheClient.buildCacheKey(args));
  }
}
